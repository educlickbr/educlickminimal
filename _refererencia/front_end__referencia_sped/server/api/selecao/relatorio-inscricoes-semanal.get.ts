import { serverSupabaseClient } from '#supabase/server';
import { eventHandler, getQuery, createError } from 'h3';

export default eventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const ano_semestre = query.ano_semestre as string;
    const area = query.area as string;
    const tipo_candidatura = (query.tipo_candidatura as string) || 'estudante';
    const id_turma = (query.id_turma as string) || null;

    if (!ano_semestre) {
        throw createError({ statusCode: 400, statusMessage: 'Ano/Semestre obrigatório' });
    }

    if (!area) {
        throw createError({ statusCode: 400, statusMessage: 'Área obrigatória' });
    }

    const { data, error } = await client.rpc('nxt_get_relatorio_inscricoes_semanal_pdf_v1', {
        p_ano_semestre: ano_semestre,
        p_area: area,
        p_tipo_candidatura: tipo_candidatura,
        p_id_turma: id_turma
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
