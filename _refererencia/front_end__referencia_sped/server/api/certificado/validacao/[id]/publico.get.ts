import { serverSupabaseClient } from '#supabase/server'
import { buildPublicCertificadoUrl } from '../../../../utils/avaliacao-publica'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_REGEX.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identificador inválido'
    })
  }

  const client = await serverSupabaseClient(event)

  // Refresh renews the token UUID + sets expira_em = now() + 30min on every call.
  // This mirrors avl_refresh_public_token_aluno: the link is ephemeral and
  // each generation produces a new URL, preventing stale link sharing.
  const { data, error } = await client.rpc('nxt_refresh_public_token_certificado', {
    p_id_certificado_emitido: id
  } as any)

  if (error) {
    console.error('[certificado-validacao:publico] Erro ao renovar token do certificado', { id, error })
    const isUnavailable = (error.message || '').includes('indisponível para renovação')
    throw createError({
      statusCode: isUnavailable ? 404 : 500,
      statusMessage: error.message || 'Erro ao renovar token do certificado'
    })
  }

  const row = (data?.[0] || null) as {
    id_certificado_emitido: string
    token_publico: string
    token_publico_expira_em: string | null
  } | null

  if (!row?.token_publico) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Certificado aprovado não encontrado para validação'
    })
  }

  const path = `/certificado/publica/${row.token_publico}`

  return {
    ok: true,
    token_publico: row.token_publico,
    token_publico_expira_em: row.token_publico_expira_em,
    path,
    url: buildPublicCertificadoUrl(row.token_publico, event)
  }
})