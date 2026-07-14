import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const { data, error } = await client.rpc("avl_get_avaliacoes", {
        p_ano_semestre: query.ano_semestre ? String(query.ano_semestre) : null,
        p_etapa: query.etapa ? String(query.etapa) : null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
