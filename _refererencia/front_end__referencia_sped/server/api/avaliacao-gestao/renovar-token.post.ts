import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const body = await readBody<{ id_avaliacao?: string }>(event)
  const idAvaliacao = body?.id_avaliacao

  if (!idAvaliacao) {
    throw createError({ statusCode: 400, statusMessage: 'id_avaliacao é obrigatório' })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('avl_refresh_public_token_aluno', {
    p_id_avaliacao: idAvaliacao
  } as any)

  if (error) {
    console.error('[API] Erro ao renovar token público da avaliação:', error)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao renovar token público' })
  }

  const tokenInfo = data?.[0]
  if (!tokenInfo?.token_publico) {
    throw createError({ statusCode: 404, statusMessage: 'Avaliação não encontrada para renovação' })
  }

  return {
    ok: true,
    token_publico: tokenInfo.token_publico,
    token_publico_expira_em: tokenInfo.token_publico_expira_em,
    acesso_publico_ativo: tokenInfo.acesso_publico_ativo,
    token_validacao_publica: tokenInfo.token_validacao_publica
  }
})
