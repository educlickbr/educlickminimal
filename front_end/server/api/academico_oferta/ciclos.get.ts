import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_programa = typeof query.id_programa === 'string' ? query.id_programa : undefined
  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined

  if (id_programa) {
    const { data, error } = await client.rpc('aca_get_ciclos_do_programa', {
      p_id_programa: id_programa
    } as any) as any

    if (error) return { success: false, message: error.message }
    return { success: true, itens: Array.isArray(data) ? data : [] }
  }

  // Se não passar id_programa, pegar todos os ciclos de acordo com a entidade
  if (id_entidade) {
    const { data, error } = await client
      .from('aca_ciclo')
      .select(`
        *,
        aca_modulo ( nome_modulo, descricao )
      `)
      .eq('id_entidade', id_entidade)
      .order('data_ini', { ascending: false })

    if (error) return { success: false, message: error.message }
    return { success: true, itens: data || [] }
  }

  return { success: false, message: 'Faltando parâmetros de query (id_entidade ou id_programa)' }
})
