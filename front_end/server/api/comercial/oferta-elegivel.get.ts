import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const id_oferta = typeof query.id_oferta === 'string' ? query.id_oferta : undefined

  if (!id_entidade || !id_oferta) {
    throw createError({ statusCode: 400, message: 'id_entidade e id_oferta são obrigatórios' })
  }

  const { data, error } = await client.rpc('com_get_elegiveis', {
    p_id_oferta: id_oferta,
    p_id_entidade: id_entidade,
  } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
