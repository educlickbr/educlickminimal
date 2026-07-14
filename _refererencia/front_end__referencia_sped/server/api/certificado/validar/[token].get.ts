import { serverSupabaseClient } from '#supabase/server'
import { buildPublicCertificadoUrl } from '../../../utils/avaliacao-publica'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token || !UUID_REGEX.test(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token de validação inválido'
    })
  }

  // No auth required — this is called by anonymous QR code scans.
  // Uses serverSupabaseClient which will use anon key if no session.
  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('nxt_resolve_validacao_publica_certificado', {
    p_token_validacao_qrcode: token
  } as any)

  if (error) {
    console.error('[API] Erro ao resolver validação pública de certificado:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao resolver validação pública'
    })
  }

  const payload = (data?.[0] || null) as {
    id_certificado_emitido: string
    token_validacao_qrcode: string
    token_publico: string
    token_publico_expira_em: string | null
  } | null

  if (!payload?.token_publico) {
    return {
      ok: false,
      public_url: null,
      message: 'Validação pública indisponível'
    }
  }

  const public_url = buildPublicCertificadoUrl(payload.token_publico, event)

  return {
    ok: true,
    public_url,
    token_publico: payload.token_publico,
    token_publico_expira_em: payload.token_publico_expira_em
  }
})
