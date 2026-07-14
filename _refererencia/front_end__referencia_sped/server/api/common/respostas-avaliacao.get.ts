import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const { area, tipo_candidatura, id_turma, id_user_expandido, id_processo } = query;

    // Validate required params
    if (!area || !tipo_candidatura || !id_turma || !id_user_expandido || !id_processo) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Parâmetros obrigatórios ausentes: area, tipo_candidatura, id_turma, id_user_expandido, id_processo'
        });
    }

    try {
        const { data, error } = await (client as any).rpc('nxt_get_perguntas_avaliacao_com_respostas', {
            p_area: String(area),
            p_tipo_candidatura: String(tipo_candidatura),
            p_id_turma: String(id_turma),
            p_id_user_expandido: String(id_user_expandido),
            p_id_processo: String(id_processo)
        });

        if (error) throw error;

        return { success: true, data: data };

    } catch (error: any) {
        console.error('Erro ao buscar respostas de avaliação:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao buscar respostas de avaliação.',
            data: error.message
        });
    }
});
