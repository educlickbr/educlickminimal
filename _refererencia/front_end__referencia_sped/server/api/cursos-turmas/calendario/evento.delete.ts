import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    if (!query.id) {
        throw createError({
            statusCode: 400,
            message: "Parâmetro 'id' obrigatório",
        });
    }

    const { data, error } = await client.rpc("nxt_delete_calendario_evento", {
        p_id: query.id,
    } as any);

    if (error) {
        throw createError({
            statusCode: 500,
            message: error.message,
        });
    }

    return data;
});
