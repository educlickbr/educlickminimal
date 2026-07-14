
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const ano_semestre = query.ano_semestre as string;
    const area = query.area as string;
    const id_turma = query.id_turma as string | null;
    const tipo_candidatura = (query.tipo_candidatura as string) || 'estudante';

    if (!ano_semestre) {
        throw createError({ statusCode: 400, statusMessage: 'Ano/Semestre obrigatório' });
    }

    const { data, error } = await client.rpc('nxt_get_exportacao_excel_seletivo_v3', {
        p_ano_semestre: ano_semestre,
        p_area: area || null,
        p_id_turma: id_turma || null,
        p_tipo_candidatura: tipo_candidatura
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
