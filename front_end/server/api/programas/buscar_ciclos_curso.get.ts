import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const id_curso = query.id_curso as string
  const id_entidade = query.id_entidade as string

  if (!id_entidade || !id_curso) {
    return { success: false, message: 'Faltam parâmetros requeridos.' }
  }

  try {
    // 1. Pega modulos do curso
    const { data: cursoModulosData, error: errC } = await client
      .from('aca_curso_modulo')
      .select('id_modulo, aca_modulo(nome_modulo)')
      .eq('id_curso', id_curso)
      .eq('id_entidade', id_entidade)
      
    if (errC) throw errC

    const cursoModulos = (cursoModulosData as any[]) || []
    const moduleIds = cursoModulos.map(m => m.id_modulo) || []

    if (moduleIds.length === 0) {
      return { success: true, ciclos: [], modulos_ausentes: [] }
    }

    // 2. Pega ciclos disponiveis para esses modulos
    const { data: ciclosData, error: errCi } = await client
      .from('aca_ciclo')
      .select('*, aca_modulo(nome_modulo)')
      .in('id_modulo', moduleIds)
      .eq('id_entidade', id_entidade)

    if (errCi) throw errCi

    const ciclos = (ciclosData as any[]) || []

    // Append modulo_nome for UI
    const moddedCiclos = ciclos.map(c => ({
      ...c,
      modulo_nome: c.aca_modulo?.nome_modulo || 'Módulo'
    }))

    // 3. Checa quais modulos faltaram ciclos
    const presentModuleIds = new Set(moddedCiclos.map(c => c.id_modulo))
    const missing = []

    for (const cm of cursoModulos) {
      if (!presentModuleIds.has(cm.id_modulo)) {
         missing.push(cm.aca_modulo?.nome_modulo || 'Módulo Desconhecido')
      }
    }

    return { 
      success: true, 
      ciclos: moddedCiclos,
      modulos_ausentes: missing 
    }

  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
