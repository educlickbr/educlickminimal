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

  // Buca feriados que pertencem à entidade ou são globais (id_entidade IS NULL)
  // Ordena por data
  let dbQuery = client
    .from('aca_feriado')
    .select('*')
    .or(`id_entidade.eq.${id_entidade},id_entidade.is.null,is_global.eq.true`)

  if (ano) {
    dbQuery = dbQuery.or(`and(data.gte.${ano}-01-01,data.lte.${ano}-12-31),recorrente_anual.eq.true`)
  }

  const { data, error } = await dbQuery.order('data', { ascending: true })

  if (error) return { success: false, message: error.message }
  return { success: true, itens: data || [] }
})
