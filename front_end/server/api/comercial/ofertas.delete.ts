import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { id, id_entidade } = body

  if (!id || !id_entidade) {
    throw createError({ statusCode: 400, message: 'id e id_entidade são obrigatórios' })
  }

  const { data, error } = await client.rpc('com_delete_oferta', {
    p_id: id,
    p_id_entidade: id_entidade,
  } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
