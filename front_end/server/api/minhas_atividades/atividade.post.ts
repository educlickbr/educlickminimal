import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_upsert_submissao_atividade', {
    p_id_conteudo: body.id_conteudo,
    p_id_entidade: body.id_entidade,
    p_id_matricula: body.id_matricula,
    p_texto_resposta: body.texto_resposta || null,
    p_id_arquivo_envio: body.id_arquivo_envio || null,
    p_status: body.status || 'rascunho',
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Erros de negócio da RPC viram HTTP com código apropriado
  if (data?.success === false) {
    if (data.code === 'PRAZO_EXPIRADO') {
      throw createError({ statusCode: 409, statusMessage: 'prazo de envio expirado' })
    }
    throw createError({ statusCode: 400, statusMessage: data.message || 'Erro' })
  }

  return data
})
