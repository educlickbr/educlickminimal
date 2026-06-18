// BFF para Componentes Acadêmicos
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

// GET paginado
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const page = Number(query.page ?? 1)
  const limit = Number(query.limit ?? 20)
  const search = String(query.search ?? '')
  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const orderBy = String(query.orderBy ?? 'nome_componente')
  const orderDir = String(query.orderDir ?? 'ASC')

  if (!id_entidade) {
    return { success: false, message: 'id_entidade é obrigatório' }
  }

  const rpcAttempts = [
    {
      p_id_entidade: id_entidade,
      p_pagina: page,
      p_limite: limit,
      p_busca: search || null,
      p_ordenar_por: orderBy,
      p_ordenar_como: orderDir
    },
    {
      p_id_entidade: id_entidade,
      p_pagina: page,
      p_limite: limit,
      p_busca: search || null
    },
    {
      p_id_empresa: id_entidade,
      p_pagina: page,
      p_limite: limit,
      p_busca: search || null,
      p_ordenar_por: orderBy,
      p_ordenar_como: orderDir
    },
    {
      p_id_empresa: id_entidade,
      p_pagina: page,
      p_limite: limit,
      p_busca: search || null
    }
  ]

  let data: any = null
  let error: any = null

  for (const payload of rpcAttempts) {
    const rpcResult = await client.rpc('aca_get_componentes_paginado', payload as any)
    if (!rpcResult.error) {
      data = rpcResult.data
      error = null
      break
    }
    error = rpcResult.error
  }

  if (error) {
    const offset = (page - 1) * limit
    const selectQuery = client
      .from('aca_componente')
      .select('id,id_entidade,nome_componente,descricao,criado_por,criado_em,modificado_em', { count: 'exact' })
      .eq('id_entidade', id_entidade)
      .order(orderBy, { ascending: orderDir.toUpperCase() !== 'DESC' })
      .range(offset, offset + limit - 1)

    const filteredQuery = search
      ? selectQuery.or(`nome_componente.ilike.%${search}%,descricao.ilike.%${search}%`)
      : selectQuery

    const { data: rows, count, error: tableError } = await filteredQuery

    if (tableError) {
      return { success: false, message: tableError.message || error.message }
    }

    return {
      pagina_atual: page,
      qtd_paginas: Math.ceil((count || 0) / limit),
      qtd_total: count || 0,
      itens: rows || []
    }
  }

  let payload: any = data
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      payload = null
    }
  }

  if (!payload || typeof payload !== 'object') {
    return { pagina_atual: page, qtd_paginas: 0, qtd_total: 0, itens: [] }
  }

  return {
    pagina_atual: payload.pagina_atual ?? page,
    qtd_paginas: payload.qtd_paginas ?? 0,
    qtd_total: payload.qtd_total ?? 0,
    itens: Array.isArray(payload.itens) ? payload.itens : []
  }
})
