import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const { area, tipo_candidatura, tipo_processo, user_id } = query;

    // Validate required params
    if (!area || !tipo_candidatura || !tipo_processo || !user_id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Parâmetros obrigatórios ausentes: area, tipo_candidatura, tipo_processo, user_id'
        });
    }

    try {
        const { data, error } = await (client as any).rpc('nxt_get_respostas_nao_arquivos_area', {
            p_area: String(area),
            p_tipo_candidatura: String(tipo_candidatura),
            p_tipo_processo: String(tipo_processo),
            p_user_id: String(user_id)
        });

        if (error) throw error;

        return { success: true, data: data };

    } catch (error: any) {
        console.error('Erro ao buscar respostas:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao buscar respostas.',
            data: error.message
        });
    }
});
