import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);

    const { data: avaliacoes, error } = await client.rpc("avl_get_avaliacoes_aluno");

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return avaliacoes || [];
});
