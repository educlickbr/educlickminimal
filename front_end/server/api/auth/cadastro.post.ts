import { serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/auth/cadastro
 * Body: { id_user, nome, sobrenome?, email, id_entidade?, papel? }
 *
 * BFF do fluxo de autocadastro público.
 * Chama a RPC SECURITY DEFINER `nxt_upsert_user_expandido` que cria/atualiza
 * user_expandido e provisiona os vínculos de `user_papeis_auth` e `user_entidade_user`
 * para emissão correta dos claims pelo hook jwt_custom_claims.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const body = await readBody(event)

    if (!body?.id_user || !body?.email || !body?.nome) {
        throw createError({
            statusCode: 400,
            message: 'Dados incompletos para cadastro (id_user, email e nome são obrigatórios).',
        })
    }

    const { data, error } = await (client as any).rpc('nxt_upsert_user_expandido', {
        p_user_id: body.id_user,
        p_nome: body.nome,
        p_sobrenome: body.sobrenome || '',
        p_email: body.email,
        p_id_entidade: body.id_entidade || null,
        p_papel: body.papel || 'aca_candidato',
    })

    if (error || !data?.success) {
        throw createError({
            statusCode: 500,
            message: error?.message || data?.message || 'Erro ao processar cadastro.',
        })
    }

    return data
})
