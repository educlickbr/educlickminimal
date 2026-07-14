import { serverSupabaseClient } from '#supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token || !UUID_REGEX.test(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token inválido'
    })
  }

  const client = await serverSupabaseClient(event)
  const { data, error } = await client.rpc('nxt_get_certificado_publico_por_token', {
    p_token: token
  } as any)

  if (error) {
    console.error('[API] Erro ao buscar certificado público:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar certificado público'
    })
  }

  const certificado = (data?.[0] || null) as Record<string, any> | null

  if (!certificado) {
    return {
      ok: false,
      certificado: null,
      message: 'Certificado público indisponível',
      expired: false,
      verificacao_expira_em: null
    }
  }

  // Check expiration: token_publico_expira_em must exist and be in the future
  const expiresAt = certificado.token_publico_expira_em ? new Date(certificado.token_publico_expira_em) : null
  const now = new Date()
  const isExpired = expiresAt ? expiresAt <= now : false

  return {
    ok: !isExpired,
    certificado,
    expired: isExpired,
    verificacao_expira_em: certificado.token_publico_expira_em
  }
})