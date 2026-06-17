import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_entidade, page, limit } = getQuery(event)

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await (client.rpc as any)('aca_list_areas', {
    p_id_entidade: id_entidade,
    p_pagina: Number(page) || 1,
    p_limite: Number(limit) || 20,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
