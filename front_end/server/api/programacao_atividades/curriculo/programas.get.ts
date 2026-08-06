import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_entidade } = getQuery(event)

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await (client.rpc as any)('lms_list_programas_para_curriculo', {
    p_id_entidade: id_entidade,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { itens: data || [] }
})
