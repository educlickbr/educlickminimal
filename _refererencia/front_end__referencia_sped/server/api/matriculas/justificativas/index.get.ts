
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    if (!user.data.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, error } = await (client.rpc as any)('nxt_justificativa_get_paginado', {
        p_ano_semestre: query.ano_semestre || null,
        p_status: query.status || null,
        p_id_turma: query.id_turma || null,
        p_escopo: query.escopo || null,
        p_limit: limit,
        p_offset: offset,
        p_busca: query.busca || null,
        p_data: query.data ? String(query.data) : null,
    });

    if (error) {
        console.error('Error fetching justificativas painel:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});
