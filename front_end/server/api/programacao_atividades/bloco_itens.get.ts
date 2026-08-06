import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_bloco } = getQuery(event)

  if (!id_bloco) {
    throw createError({ statusCode: 400, message: 'id_bloco é obrigatório' })
  }

  const { data, error } = await (client.rpc as any)('lms_list_conteudos_do_bloco', {
    p_id_bloco: id_bloco,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { itens: data || [] }
})
