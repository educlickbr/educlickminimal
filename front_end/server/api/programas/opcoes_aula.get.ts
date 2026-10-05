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
    let componentes: any[] = []
    let atribuicoes: any[] = []

    if (id_ciclo) {
      // 1. Busca módulo vinculado ao ciclo
      const { data: cicloObj } = await client
        .from('aca_ciclo')
        .select('id, id_modulo')
        .eq('id', id_ciclo)
        .maybeSingle()

      const id_modulo = cicloObj?.id_modulo

      if (id_modulo) {
        // Busca os componentes restritos ao módulo do ciclo com carga horária
        const { data: modComps } = await client
          .from('aca_modulo_componente')
          .select('id, id_componente, carga_horaria, aca_componente:id_componente(id, nome_componente)')
          .eq('id_modulo', id_modulo)

        if (Array.isArray(modComps) && modComps.length > 0) {
          componentes = modComps.map((mc: any) => ({
            id: mc.aca_componente?.id || mc.id_componente,
            id_modulo_componente: mc.id,
            nome_componente: mc.aca_componente?.nome_componente || 'Componente',
            carga_horaria: mc.carga_horaria || null,
            label_enriquecido: mc.carga_horaria
              ? `${mc.aca_componente?.nome_componente || 'Componente'} (${mc.carga_horaria}h)`
              : (mc.aca_componente?.nome_componente || 'Componente')
          }))
        }
      }

      // 2. Busca atribuições ativas do ciclo
      const { data: atrs } = await client
        .from('aca_docente_modulo_componente_ciclo')
        .select('id, id_ciclo, id_modulo_componente, id_docente, tipo, aca_modulo_componente:id_modulo_componente(id_componente)')
        .eq('id_ciclo', id_ciclo)
      
      atribuicoes = (atrs || []).map((a: any) => ({
        id: a.id,
        id_ciclo: a.id_ciclo,
        id_modulo_componente: a.id_modulo_componente,
        id_componente: a.aca_modulo_componente?.id_componente || null,
        id_docente: a.id_docente,
        tipo: a.tipo
      }))
    }

    // Se não encontrou componentes restritos do módulo, busca os componentes da entidade como fallback
    if (componentes.length === 0) {
      const { data: compEntidade } = await client
        .from('aca_componente')
        .select('id, nome_componente')
        .eq('id_entidade', id_entidade)
        .order('nome_componente')

      componentes = (compEntidade || []).map((c: any) => ({
        id: c.id,
        nome_componente: c.nome_componente,
        label_enriquecido: c.nome_componente
      }))
    }

    // 3. Docentes da entidade
    const { data: docentesRaw } = await client
      .from('aca_docente')
      .select('id, id_user_expandido, user_expandido:id_user_expandido(nome_completo, email)')
      .eq('id_entidade', id_entidade)

    const docentesFormatados = (docentesRaw || []).map((d: any) => ({
      id: d.id,
      nome: d.user_expandido?.nome_completo || 'Docente',
      email: d.user_expandido?.email || ''
    })).sort((a: any, b: any) => a.nome.localeCompare(b.nome))

    return {
      success: true,
      componentes,
      docentes: docentesFormatados,
      atribuicoes
    }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
