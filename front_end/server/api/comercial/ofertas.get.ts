import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const id_produto = typeof query.id_produto === 'string' ? query.id_produto : undefined
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await client.rpc('com_get_ofertas', {
    p_id_entidade: id_entidade,
    p_id_produto: id_produto || null,
    p_pagina: page,
    p_limite: limit,
  } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
