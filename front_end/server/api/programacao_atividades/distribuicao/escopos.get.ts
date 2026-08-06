import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { tipo_escopo, id_entidade } = getQuery(event)

  if (!tipo_escopo || !id_entidade) {
    throw createError({ statusCode: 400, message: 'tipo_escopo e id_entidade são obrigatórios' })
  }

  const { data, error } = await (client.rpc as any)('lms_list_escopos_disponiveis', {
    p_tipo_escopo: tipo_escopo,
    p_id_entidade: id_entidade,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { itens: data || [] }
})
