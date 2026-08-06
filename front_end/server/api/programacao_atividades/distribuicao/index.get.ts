import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { escopo, escopo_id } = getQuery(event)

  if (!escopo || !escopo_id) {
    throw createError({ statusCode: 400, message: 'escopo e escopo_id são obrigatórios' })
  }

  const { data, error } = await (client.rpc as any)('lms_list_distribuicoes', {
    p_escopo: escopo,
    p_escopo_id: escopo_id,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data || { itens: [] }
})
