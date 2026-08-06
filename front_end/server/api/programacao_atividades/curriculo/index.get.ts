import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_programa, id_entidade } = getQuery(event)

  if (!id_programa || !id_entidade) {
    throw createError({ statusCode: 400, message: 'id_programa e id_entidade são obrigatórios' })
  }

  const { data, error } = await (client.rpc as any)('lms_get_curriculo_estrutura', {
    p_id_programa: id_programa,
    p_id_entidade: id_entidade,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
