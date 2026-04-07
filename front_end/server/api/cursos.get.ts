import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const search = typeof query.search === 'string' ? query.search : undefined

  if (!id_entidade) {
    return { success: false, message: 'id_entidade é obrigatório' }
  }

  const { data, error } = await client.rpc('aca_get_cursos_paginado', {
    p_id_entidade: id_entidade,
    p_pagina:      page,
    p_limite:      limit,
    p_busca:       search
  } as any) as any

  if (error) return { success: false, message: error.message }
  return data
})
