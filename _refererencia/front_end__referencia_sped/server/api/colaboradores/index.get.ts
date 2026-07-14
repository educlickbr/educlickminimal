
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const {
        busca,
        page = 1,
        limit = 20
    } = query;

    const client = await serverSupabaseClient(event);

    const { data, error } = await (client.rpc as any)('nxt_get_colaboradores_paginado', {
        p_busca: busca || null,
        p_page: Number(page),
        p_limit: Number(limit)
    });

    if (error) {
        console.error('Error fetching collaborators:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return data;
});
