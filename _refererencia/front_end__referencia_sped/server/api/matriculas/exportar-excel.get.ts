
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const ano_semestre = query.ano_semestre as string;
    const area = query.area as string;

    if (!ano_semestre) {
        throw createError({ statusCode: 400, statusMessage: 'Ano/Semestre obrigatório' });
    }

    const { data, error } = await client.rpc('nxt_get_exportacao_excel_matriculas_v3', {
        p_ano_semestre: ano_semestre,
        p_area: area || null
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
