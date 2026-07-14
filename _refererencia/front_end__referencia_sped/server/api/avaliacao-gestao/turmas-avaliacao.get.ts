import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const { data, error } = await client.rpc("avl_get_turmas_avaliacao", {
        p_id_avaliacao: String(query.id_avaliacao),
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data || [];
});
