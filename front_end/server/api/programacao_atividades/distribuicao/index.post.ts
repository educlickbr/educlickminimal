import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_upsert_distribuicao', {
    p_id_entidade: body.id_entidade,
    p_id_conteudo: body.id_conteudo,
    p_id_area: body.id_area || null,
    p_id_curso: body.id_curso || null,
    p_id_modulo: body.id_modulo || null,
    p_id_componente: body.id_componente || null,
    p_usuario_id: body.usuario_id,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
