import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const page = Number(query.page ?? 1)
  const limit = Number(query.limit ?? 20)
  const search = String(query.search ?? '')
  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined

  if (!id_entidade) {
    return { success: false, message: 'id_entidade é obrigatório' }
  }

  const { data, error } = await client.rpc('aca_get_modulos_paginado', {
    p_id_entidade: id_entidade,
    p_pagina: page,
    p_limite: limit,
    p_busca: search || null
  } as any)

  if (error) return { success: false, message: error.message }

  let payload: any = data
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      payload = null
    }
  }

  if (!payload || typeof payload !== 'object') {
    return { pagina_atual: page, qtd_total: 0, itens: [] }
  }

  return {
    pagina_atual: payload.pagina_atual ?? page,
    qtd_total: payload.qtd_total ?? 0,
    itens: Array.isArray(payload.itens) ? payload.itens : []
  }
})
