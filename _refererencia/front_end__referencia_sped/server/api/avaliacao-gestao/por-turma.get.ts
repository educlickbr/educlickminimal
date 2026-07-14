import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const { data, error } = await client.rpc("avl_get_avaliacao_por_turma", {
        p_id_turma: String(query.id_turma),
        p_etapa: String(query.etapa),
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    // Retorna o primeiro resultado (ou null se não houver avaliação vinculada)
    return Array.isArray(data) ? (data[0] ?? null) : data;
});
