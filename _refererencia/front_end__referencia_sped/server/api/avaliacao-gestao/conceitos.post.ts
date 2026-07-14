import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    const { data, error } = await client.rpc("avl_upsert_conceito", {
        p_id_criterio: body.id_criterio,
        p_id_aluno: body.id_aluno,
        p_conceito: body.conceito,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
