import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_upsert_bloco', {
    p_id: body.id || null,
    p_id_entidade: body.id_entidade,
    p_titulo: body.titulo,
    p_descricao: body.descricao || null,
    p_cor_ident: body.cor_ident || null,
    p_usuario_id: body.usuario_id,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
