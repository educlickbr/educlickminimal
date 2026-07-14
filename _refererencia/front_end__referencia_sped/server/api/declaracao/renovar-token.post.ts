import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  const body = await readBody<{ id_declaracao?: string }>(event)
  if (!body?.id_declaracao) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id_declaracao é obrigatório'
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('nxt_refresh_public_token_declaracao', {
    p_id_declaracao: body.id_declaracao
  } as any)

  if (error) {
    console.error('[API] Erro ao renovar token público da declaração:', error)
    const isUnavailable = (error.message || '').includes('indisponível para renovação')
    throw createError({
      statusCode: isUnavailable ? 409 : 500,
      statusMessage: error.message || 'Erro ao renovar token público da declaração'
    })
  }

  const payload = (data?.[0] || null) as {
    id_declaracao: string
    token_publico: string
    token_publico_expira_em: string | null
    token_validacao_publica: string | null
  } | null

  if (!payload?.token_publico) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Declaração indisponível para renovação'
    })
  }

  return {
    ok: true,
    id_declaracao: payload.id_declaracao,
    token_publico: payload.token_publico,
    token_publico_expira_em: payload.token_publico_expira_em,
    token_validacao_publica: payload.token_validacao_publica
  }
})
