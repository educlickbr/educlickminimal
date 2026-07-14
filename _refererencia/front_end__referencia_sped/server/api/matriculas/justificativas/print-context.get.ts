import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    if (!user.data.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const query = getQuery(event);
    const idUserExpandido = String(query.id_user_expandido || '');
    const idTurma = String(query.id_turma || '');

    if (!idUserExpandido || !idTurma) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_user_expandido e id_turma sao obrigatorios'
        });
    }

    const { data, error } = await (client.rpc as any)('nxt_justificativa_get_print_context', {
        p_id_aluno: idUserExpandido,
        p_id_turma: idTurma
    });

    if (error) {
        console.error('Error fetching justificativa print context:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!row) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Contexto de impressao nao encontrado'
        });
    }

    return row;
});
