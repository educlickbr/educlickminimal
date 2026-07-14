import { serverSupabaseClient } from '#supabase/server'
import { resolvePublicBaseUrl } from '../../../utils/avaliacao-publica'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const nomeExibicao = typeof query.nome === 'string' ? query.nome : 'registro'

  if (!token || !UUID_REGEX.test(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token inválido'
    })
  }

  const client = await serverSupabaseClient(event)
  const baseUrl = resolvePublicBaseUrl(event)

  const { data, error } = await client.rpc('nxt_get_declaracao_publica_por_token', {
    p_token: token,
    p_base_url: baseUrl
  } as any)

  if (error) {
    console.error('[API] Erro ao buscar declaração pública:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar declaração pública'
    })
  }

  const declaracao = (data?.[0] || null) as {
    nome_aluno: string
    token_publico_expira_em: string | null
    [key: string]: any
  } | null

  if (!declaracao) {
    const { data: tokenInfo, error: tokenError } = await client
      .from('declaracoes')
      .select('token_publico_expira_em, aprovado')
      .eq('token_publico', token)
      .maybeSingle()

    const tokenInfoTyped = (tokenInfo || null) as {
      token_publico_expira_em: string | null
      aprovado: boolean | null
    } | null

    if (tokenError) {
      console.error('[API] Erro ao verificar estado do token público da declaração:', tokenError)
    }

    if (tokenInfoTyped?.aprovado && tokenInfoTyped?.token_publico_expira_em) {
      const expirado = new Date(tokenInfoTyped.token_publico_expira_em).getTime() <= Date.now()
      if (expirado) {
        return {
          ok: false,
          declaracao: null,
          message: 'Link expirado. Favor gerar um novo.',
          expired: true,
          token_publico_expira_em: tokenInfoTyped.token_publico_expira_em
        }
      }
    }

    return {
      ok: false,
      declaracao: null,
      message: 'Declaração indisponível no momento.',
      expired: false,
      token_publico_expira_em: tokenInfoTyped?.token_publico_expira_em || null
    }
  }

  const { data: nomeData, error: nomeError } = await client.rpc('nxt_get_nome_publico_declaracao_por_token', {
    p_token: token,
    p_nome_exibicao: nomeExibicao
  } as any)

  const nomeDataTyped = (nomeData || []) as Array<{ nome_aluno?: string | null }>

  if (nomeError) {
    console.error('[API] Erro ao resolver nome público da declaração:', nomeError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao resolver nome público da declaração'
    })
  }

  return {
    ok: true,
    declaracao: {
      ...declaracao,
      nome_aluno: nomeDataTyped?.[0]?.nome_aluno || declaracao.nome_aluno
    },
    expired: false,
    token_publico_expira_em: declaracao.token_publico_expira_em || null
  }
})
