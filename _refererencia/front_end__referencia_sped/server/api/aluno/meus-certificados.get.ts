import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 12;
    const busca = query.busca ? String(query.busca) : null;

    const { data, error } = await client.rpc('nxt_get_meus_certificados_aprovados', {
        p_page: Number.isFinite(page) ? page : 1,
        p_limit: Number.isFinite(limit) ? limit : 12,
        p_busca: busca
    } as any);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data || {
        total: 0,
        page: 1,
        limit: Number.isFinite(limit) ? limit : 12,
        pages: 1,
        itens: []
    };
});
