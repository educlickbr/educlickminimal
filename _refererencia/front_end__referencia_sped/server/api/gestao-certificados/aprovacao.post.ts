import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Não autorizado' });
    }

    if (!body?.id_aluno || !body?.id_turma_contexto) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_aluno e id_turma_contexto são obrigatórios'
        });
    }

    if (typeof body?.aprovado !== 'boolean') {
        throw createError({
            statusCode: 400,
            statusMessage: 'aprovado deve ser boolean'
        });
    }

    const { data, error } = await client.rpc('nxt_upsert_certificacao_contexto', {
        p_id_aluno: body.id_aluno,
        p_id_turma_contexto: body.id_turma_contexto,
        p_aprovado: body.aprovado,
        p_motivo: body.motivo || null,
        p_snapshot_parametrizacao: body.snapshot_parametrizacao || {},
        p_auth_user_id: user.id
    } as any);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data || null;
});
