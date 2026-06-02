import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const id_entidade = query.id_entidade

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await client
    .from('aca_area')
    .select('*')
    .eq('id_entidade', id_entidade)
    .order('nome_area', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, itens: data }
})
