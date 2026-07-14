import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    const idAvaliacao = String(body?.id_avaliacao || '').trim();
    const idAluno = String(body?.id_aluno || '').trim();
    const idAtividade = String(body?.id_atividade || '').trim();

    if (!idAvaliacao || !idAluno || !idAtividade) {
        throw createError({ statusCode: 400, statusMessage: 'Parâmetros obrigatórios ausentes: id_avaliacao, id_aluno e id_atividade.' });
    }

    const { data, error } = await (client.rpc as any)('avl_associar_atividade_recuperacao', {
        p_id_avaliacao: idAvaliacao,
        p_id_aluno: idAluno,
        p_id_atividade: idAtividade,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    const result = Array.isArray(data) ? (data[0] || null) : data;

    return {
        ...(result || {}),
        message: result?.ja_existia ? 'Atividade já estava associada a este aluno.' : 'Atividade associada com sucesso.',
    };
});