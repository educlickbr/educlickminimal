import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const idAvaliacao = String(query.id_avaliacao || '').trim();

    if (!idAvaliacao) {
        throw createError({ statusCode: 400, statusMessage: 'Parâmetro obrigatório ausente: id_avaliacao.' });
    }

    const status = String(query.status || '').trim() || null;
    const dataInicio = String(query.data_inicio || '').trim() || null;
    const dataFim = String(query.data_fim || '').trim() || null;

    const { data, error } = await (client.rpc as any)('avl_professor_listar_entregas', {
        p_id_avaliacao: idAvaliacao,
        p_status:       status,
        p_data_inicio:  dataInicio,
        p_data_fim:     dataFim,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return Array.isArray(data) ? data : [];
});
