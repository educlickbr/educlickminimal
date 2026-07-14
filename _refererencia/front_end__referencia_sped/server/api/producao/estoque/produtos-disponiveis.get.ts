import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const busca = query.busca ? String(query.busca) : null;
    const data_retirada = query.data_retirada ? String(query.data_retirada) : null;
    const data_devolucao = query.data_devolucao ? String(query.data_devolucao) : null;

    const { data, error } = await client.rpc("nxt_get_produtos_disponiveis_v2", {
        p_busca: busca,
        p_inicio: data_retirada,
        p_fim: data_devolucao
    } as any);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    // json_agg() returns NULL when no rows match — normalize to empty array
    return data ?? [];
});
