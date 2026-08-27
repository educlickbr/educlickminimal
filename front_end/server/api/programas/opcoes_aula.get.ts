import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = query.id_entidade as string
  const id_ciclo = query.id_ciclo as string

  if (!id_entidade) {
    return { success: false, message: 'id_entidade é obrigatório' }
  }

  try {
    // 1. Componentes da entidade
    const { data: componentes } = await client
      .from('aca_componente')
      .select('id, nome_componente, carga_horaria')
      .eq('id_entidade', id_entidade)
      .order('nome_componente')

    // 2. Docentes da entidade
    const { data: docentes } = await client
      .from('aca_docente')
      .select('id, id_user_expandido, user_expandido:id_user_expandido(nome, email)')
      .eq('id_entidade', id_entidade)

    // 3. Atribuições do ciclo (docente titular/substituto por componente)
    let atribuicoes: any[] = []
    if (id_ciclo) {
      const { data: atrs } = await client
        .from('aca_docente_modulo_componente_ciclo')
        .select('id, id_ciclo, id_modulo_componente, id_docente, tipo')
        .eq('id_ciclo', id_ciclo)
      atribuicoes = atrs || []
    }

    const docentesFormatados = (docentes || []).map((d: any) => ({
      id: d.id,
      nome: d.user_expandido?.nome || 'Docente',
      email: d.user_expandido?.email || ''
    })).sort((a: any, b: any) => a.nome.localeCompare(b.nome))

    return {
      success: true,
      componentes: componentes || [],
      docentes: docentesFormatados,
      atribuicoes
    }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
