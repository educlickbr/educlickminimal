import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_finalizar_submissao_avaliacao', {
    p_id_submissao: body.id_submissao,
    p_id_entidade: body.id_entidade,
    p_respostas: body.respostas || [],
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  if (data?.success === false) {
    if (data.code === 'PRAZO_EXPIRADO') {
      throw createError({ statusCode: 409, statusMessage: 'prazo de envio expirado' })
    }
    throw createError({ statusCode: 400, statusMessage: data.message || 'Erro' })
  }

  return data
})
