import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  if (!query.id || !query.id_entidade) {
    throw createError({ statusCode: 400, message: 'id e id_entidade são obrigatórios' })
  }

  const { data, error } = await client
    .rpc('frm_delete_pergunta', {
      p_id: query.id,
      p_id_entidade: query.id_entidade
    } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
