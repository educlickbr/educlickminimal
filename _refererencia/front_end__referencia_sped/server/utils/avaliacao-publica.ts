function normalizeBaseUrl(value?: string | null): string {
  return (value || '').trim().replace(/\/+$/, '')
}

function normalizeNomeQuery(value?: string | null): string | null {
  const nome = (value || '').trim().toLowerCase()
  if (nome === 'social' || nome === 'artistico') {
    return nome
  }
  return null
}

export function resolvePublicBaseUrl(event: any): string {
  const config = useRuntimeConfig(event)
  const isDev = import.meta.dev || process.env.NODE_ENV === 'development'

  // Prioridade 1: runtimeConfig público (NUXT_PUBLIC_APP_BASE_URL)
  const configuredBase = normalizeBaseUrl(config.public?.appBaseUrl)
  if (configuredBase) {
    return configuredBase
  }

  // Prioridade 2: origem resolvida pelo próprio request (mais resiliente em edge/proxy)
  const requestOrigin = normalizeBaseUrl(getRequestURL(event).origin)
  if (requestOrigin && requestOrigin !== 'null') {
    return requestOrigin
  }

  // Prioridade 3: headers forward do proxy
  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host')
  const rawProto = getRequestHeader(event, 'x-forwarded-proto') || 'https'
  const proto = rawProto.split(',')[0].trim()
  if (host) {
    return normalizeBaseUrl(`${proto}://${host}`)
  }

  // Prioridade 4: fallback localhost somente em desenvolvimento
  if (isDev) {
    return 'http://localhost:3001'
  }

  console.error('[resolvePublicBaseUrl] Falha ao resolver base URL em produção.', {
    runtimeConfigAppBaseUrl: config.public?.appBaseUrl || '',
    host: host || '',
    proto,
  })

  throw createError({
    statusCode: 500,
    statusMessage: 'Base URL de produção não configurada. Defina NUXT_PUBLIC_APP_BASE_URL no painel do Cloudflare Pages.',
  })
}

export function buildPublicAvaliacaoUrl(token: string, event: any): string {
  const baseUrl = resolvePublicBaseUrl(event)
  return `${baseUrl}/avaliacao/publica/${token}`
}

export function buildPublicAvaliacaoUrlWithNome(token: string, event: any, nome?: string | null): string {
  const url = buildPublicAvaliacaoUrl(token, event)
  const nomeNormalizado = normalizeNomeQuery(nome)
  return nomeNormalizado ? `${url}?nome=${nomeNormalizado}` : url
}

export function buildValidationAvaliacaoUrl(idResultadoGlobal: string, event: any, nome?: string | null): string {
  const baseUrl = resolvePublicBaseUrl(event)
  const url = `${baseUrl}/avaliacao/validar/${idResultadoGlobal}`
  const nomeNormalizado = normalizeNomeQuery(nome)
  return nomeNormalizado ? `${url}?nome=${nomeNormalizado}` : url
}

export function buildPublicDeclaracaoUrl(token: string, event: any): string {
  const baseUrl = resolvePublicBaseUrl(event)
  return `${baseUrl}/declaracao/publica/${token}`
}

export function buildPublicCertificadoUrl(token: string, event: any): string {
  const baseUrl = resolvePublicBaseUrl(event)
  return `${baseUrl}/certificado/publica/${token}`
}

export function buildPublicDeclaracaoUrlWithNome(token: string, event: any, nome?: string | null): string {
  const url = buildPublicDeclaracaoUrl(token, event)
  const nomeNormalizado = normalizeNomeQuery(nome)
  return nomeNormalizado ? `${url}?nome=${nomeNormalizado}` : url
}

export function buildPublicCertificadoUrlWithNome(token: string, event: any, nome?: string | null): string {
  const url = buildPublicCertificadoUrl(token, event)
  const nomeNormalizado = normalizeNomeQuery(nome)
  return nomeNormalizado ? `${url}?nome=${nomeNormalizado}` : url
}

export function buildValidationDeclaracaoUrl(tokenValidacao: string, event: any, nome?: string | null): string {
  const baseUrl = resolvePublicBaseUrl(event)
  const url = `${baseUrl}/declaracao/validar/${tokenValidacao}`
  const nomeNormalizado = normalizeNomeQuery(nome)
  return nomeNormalizado ? `${url}?nome=${nomeNormalizado}` : url
}
