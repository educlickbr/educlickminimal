import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_salvar_correcao', {
    p_tipo: body.tipo,
    p_id_submissao: body.id_submissao,
    p_nota: body.nota ?? null,
    p_comentario: body.comentario || null,
    p_id_entidade: body.id_entidade,
    p_id_usuario: body.id_usuario,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  if (data?.success === false) {
    throw createError({ statusCode: 400, statusMessage: data.message || 'Erro' })
  }

  return data
})
