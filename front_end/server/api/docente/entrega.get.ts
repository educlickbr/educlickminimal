import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_submissao, tipo, id_entidade, id_usuario } = getQuery(event)

  if (!id_submissao || !tipo || !id_entidade || !id_usuario) {
    throw createError({ statusCode: 400, message: 'id_submissao, tipo, id_entidade e id_usuario são obrigatórios' })
  }

  const { data, error } = await (client.rpc as any)('lms_get_entrega_detalhe', {
    p_id_submissao: id_submissao,
    p_tipo: tipo,
    p_id_entidade: id_entidade,
    p_id_usuario: id_usuario,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
