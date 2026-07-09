import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const id_area = typeof query.id_area === 'string' ? query.id_area : undefined

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await client.rpc('com_get_ofertas_publicas', {
    p_id_entidade: id_entidade,
    p_id_area: id_area || null,
  } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
