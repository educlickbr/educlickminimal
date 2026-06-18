import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const ano = typeof query.ano === 'string' ? query.ano : undefined

  if (!id_entidade) {
    return { success: false, message: 'ID da entidade é obrigatório' }
  }

  let dbQuery = client
    .from('aca_evento')
    .select('*')
    .eq('id_entidade', id_entidade)
    
  if (ano) {
    // Garante que o evento se sobreponha (ou caia dentro) do ano escolhido
    dbQuery = dbQuery.lte('data_inicio', `${ano}-12-31`).gte('data_fim', `${ano}-01-01`)
  }

  const { data, error } = await dbQuery.order('data_inicio', { ascending: true })

  if (error) return { success: false, message: error.message }
  return { success: true, itens: data || [] }
})
