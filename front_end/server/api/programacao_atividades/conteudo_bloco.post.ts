import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_associar_conteudo_bloco', {
    p_id_conteudo: body.id_conteudo,
    p_id_bloco: body.id_bloco,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
