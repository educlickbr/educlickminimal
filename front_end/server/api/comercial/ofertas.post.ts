import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    id, id_entidade, id_produto, slug, nome_curto,
    valor_centavos, tipo_pagamento, parcelamento_maximo,
    recorrencia_periodo, recorrencia_intervalo,
    disponivel_a_partir_de, disponivel_ate,
    visibilidade, exige_elegibilidade, is_ativa,
    usuario_id,
  } = body

  if (!id_entidade || !id_produto) {
    throw createError({ statusCode: 400, message: 'id_entidade e id_produto são obrigatórios' })
  }

  const { data, error } = await client.rpc('com_upsert_oferta', {
    p_id: id || null,
    p_id_entidade: id_entidade,
    p_id_produto: id_produto,
    p_slug: slug || null,
    p_nome_curto: nome_curto || null,
    p_valor_centavos: valor_centavos ?? 0,
    p_tipo_pagamento: tipo_pagamento || 'unico',
    p_parcelamento_maximo: parcelamento_maximo ?? 1,
    p_recorrencia_periodo: recorrencia_periodo || null,
    p_recorrencia_intervalo: recorrencia_intervalo ?? 1,
    p_disponivel_a_partir_de: disponivel_a_partir_de || null,
    p_disponivel_ate: disponivel_ate || null,
    p_visibilidade: visibilidade || 'publica',
    p_exige_elegibilidade: exige_elegibilidade ?? false,
    p_is_ativa: is_ativa ?? true,
    p_usuario_id: usuario_id || null,
  } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
