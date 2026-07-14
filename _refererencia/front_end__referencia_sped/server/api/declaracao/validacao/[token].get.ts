import { serverSupabaseClient } from '#supabase/server'
import { resolvePublicBaseUrl } from '../../../utils/avaliacao-publica'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const nomeExibicao = typeof query.nome === 'string' ? query.nome : null

  if (!token || !UUID_REGEX.test(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token de validação inválido'
    })
  }

  const client = await serverSupabaseClient(event)
  const baseUrl = resolvePublicBaseUrl(event)

  const { data, error } = await client.rpc('nxt_resolve_validacao_publica_declaracao', {
    p_token_validacao_publica: token,
    p_base_url: baseUrl
  } as any)

  if (error) {
    console.error('[API] Erro ao resolver validação pública da declaração:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao resolver validação pública da declaração'
    })
  }

  const payload = (data?.[0] || null) as {
    public_url: string
    token_publico: string
    token_publico_expira_em: string | null
  } | null

  if (!payload?.public_url) {
    return {
      ok: false,
      public_url: null,
      message: 'Validação pública da declaração indisponível'
    }
  }

  const sufixoNome = nomeExibicao && nomeExibicao !== 'registro' ? `?nome=${encodeURIComponent(nomeExibicao)}` : ''

  return {
    ok: true,
    public_url: `${payload.public_url}${sufixoNome}`,
    token_publico: payload.token_publico,
    token_publico_expira_em: payload.token_publico_expira_em
  }
})
