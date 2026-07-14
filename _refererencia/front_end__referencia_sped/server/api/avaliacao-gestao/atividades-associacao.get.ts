import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const idAvaliacao = String(query.id_avaliacao || '').trim();
    const idAluno = String(query.id_aluno || '').trim();

    if (!idAvaliacao || !idAluno) {
        throw createError({ statusCode: 400, statusMessage: 'Parâmetros obrigatórios ausentes: id_avaliacao e id_aluno.' });
    }

    const idAtividade = String(query.id_atividade || '').trim();

    const pageSize = Math.min(Math.max(parseInt(String(query.page_size || '10'), 10) || 10, 1), 50);
    const page = Math.max(parseInt(String(query.page || '1'), 10) || 1, 1);
    const offset = (page - 1) * pageSize;

    const { data, error } = await (client.rpc as any)('avl_get_atividades_recuperacao_catalogo', {
        p_id_avaliacao: idAvaliacao,
        p_id_aluno: idAluno,
        p_ano_semestre: query.ano_semestre ? String(query.ano_semestre).trim() : null,
        p_id_turma: query.id_turma ? String(query.id_turma).trim() : null,
        p_criado_por_busca: query.criado_por_busca ? String(query.criado_por_busca).trim() : null,
        p_limite: pageSize,
        p_offset: offset,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    const rows = Array.isArray(data) ? data : [];

    // When a specific atividade is requested (readonly/consultive mode) filter client-side
    const filtered = idAtividade ? rows.filter((r: any) => String(r.id || '') === idAtividade) : rows;

    const total = filtered.length > 0 ? Number(filtered[0].total_count ?? rows.length) : 0;

    return { itens: filtered, total, page, pageSize };
});