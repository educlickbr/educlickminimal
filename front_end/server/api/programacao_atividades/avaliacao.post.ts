import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_upsert_avaliacao_completa', {
    p_id_conteudo: body.id_conteudo,
    p_id_entidade: body.id_entidade,
    p_nome: body.nome || null,
    p_descricao: body.descricao || null,
    p_perguntas: body.perguntas || [],
    p_usuario_id: body.usuario_id || null,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
