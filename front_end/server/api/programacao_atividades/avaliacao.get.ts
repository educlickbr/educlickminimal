import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_conteudo, id_entidade } = getQuery(event)

  if (!id_conteudo || !id_entidade) {
    throw createError({ statusCode: 400, message: 'id_conteudo e id_entidade são obrigatórios' })
  }

  const { data, error } = await (client.rpc as any)('lms_get_avaliacao_completa', {
    p_id_conteudo: id_conteudo,
    p_id_entidade: id_entidade,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
