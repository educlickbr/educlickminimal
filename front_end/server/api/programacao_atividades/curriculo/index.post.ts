import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_upsert_operacional', {
    p_id_entidade: body.id_entidade,
    p_id_conteudo: body.id_conteudo,
    p_id_programa: body.id_programa || null,
    p_id_ciclo: body.id_ciclo || null,
    p_id_calendario: body.id_calendario || null,
    p_ativo: body.ativo ?? null,
    p_destaque: body.destaque ?? null,
    p_usuario_id: body.usuario_id,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
