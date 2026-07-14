import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    if (!query.id_turma) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_turma é obrigatório'
        });
    }

    const { data, error } = await client.rpc('nxt_get_certificados_contexto', {
        p_area: query.area ? String(query.area) : null,
        p_ano_semestre: query.ano_semestre ? String(query.ano_semestre) : null,
        p_id_turma: String(query.id_turma),
        p_busca: query.busca ? String(query.busca) : null,
        p_elegibilidade: query.elegibilidade ? String(query.elegibilidade) : 'todos',
        p_page: query.page ? Number(query.page) : 1,
        p_limit: query.limit ? Number(query.limit) : 20
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
        limit: query.limit ? Number(query.limit) : 20,
        pages: 1,
        itens: []
    };
});
