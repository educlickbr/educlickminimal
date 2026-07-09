import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const id_programa = typeof query.id_programa === 'string' ? query.id_programa : undefined

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await client.rpc('com_get_produtos', {
    p_id_entidade: id_entidade,
    p_pagina: page,
    p_limite: limit,
    p_id_programa: id_programa || null,
  } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
