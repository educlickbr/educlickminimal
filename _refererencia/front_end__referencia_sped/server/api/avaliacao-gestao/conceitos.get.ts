import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const { data, error } = await client.rpc("avl_get_conceitos_turma", {
        p_id_avaliacao: String(query.id_avaliacao),
        p_id_turma: String(query.id_turma),
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
