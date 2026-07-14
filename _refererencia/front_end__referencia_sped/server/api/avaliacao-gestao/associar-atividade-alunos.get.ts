import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const idTurma = String(query.id_turma || '').trim();
    const etapa = String(query.etapa || '').trim();
    const anoSemestre = String(query.ano_semestre || '').trim();

    if (!idTurma || !etapa) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Parâmetros obrigatórios ausentes: id_turma e etapa.',
        });
    }

    const { data: avaliacaoData, error: avaliacaoError } = await (client.rpc as any)('avl_get_avaliacao_por_turma', {
        p_id_turma: idTurma,
        p_etapa: etapa,
    } as any);

    if (avaliacaoError) {
        throw createError({ statusCode: 500, statusMessage: avaliacaoError.message });
    }

    const avaliacao: any = Array.isArray(avaliacaoData) ? (avaliacaoData[0] ?? null) : avaliacaoData;

    if (!avaliacao?.id_avaliacao) {
        return {
            avaliacao: null,
            alunos: [],
        };
    }

    const { data: alunosRaw, error: alunosError } = await (client.rpc as any)(
        'nxt_get_estudantes_matriculados_turma_filtros',
        {
            p_ano_semestre: anoSemestre || null,
            p_turno: null,
            p_curso: null,
            p_busca: null,
            p_genero: null,
            p_raca: null,
            p_renda: null,
            p_id_turma: idTurma,
            p_area: 'Regulares',
            p_status: 'Ativa',
            p_page: 1,
            p_limit: 200,
        }
    );

    if (alunosError) {
        throw createError({ statusCode: 500, statusMessage: alunosError.message });
    }

    const alunosBase = alunosRaw?.alunos || (Array.isArray(alunosRaw) ? alunosRaw : []);

    const { data: conceitosTurma, error: conceitosError } = await (client.rpc as any)('avl_get_conceitos_turma', {
        p_id_avaliacao: String(avaliacao.id_avaliacao),
        p_id_turma: idTurma,
    } as any);

    if (conceitosError) {
        throw createError({ statusCode: 500, statusMessage: conceitosError.message });
    }

    const conceitoFinalMap = new Map<string, string>();

    for (const row of (conceitosTurma as any[]) || []) {
        const idAluno = String((row as any)?.id_aluno || '').trim();
        if (!idAluno) continue;

        const conceitos = Array.isArray((row as any)?.conceitos) ? (row as any).conceitos : [];
        const conceitoFinal = conceitos.find((item: any) => String(item?.criterio || '').trim() === 'Conceito Final');
        const valor = String(conceitoFinal?.conceito || '').trim();

        if (valor) {
            conceitoFinalMap.set(idAluno, valor);
        }
    }

    const { data: entregasData, error: entregasError } = await (client.rpc as any)(
        'avl_get_entregas_por_avaliacao',
        { p_id_avaliacao: String(avaliacao.id_avaliacao) }
    );

    if (entregasError) {
        throw createError({ statusCode: 500, statusMessage: entregasError.message });
    }

    // Map: id_aluno → first entrega found (one association shown per student)
    const entregaMap = new Map<string, { id_entrega: string; id_atividade: string; titulo_atividade: string; status_avaliacao: string }>();
    for (const row of (entregasData as any[]) || []) {
        const idAluno = String(row?.id_aluno || '').trim();
        if (idAluno && !entregaMap.has(idAluno)) {
            entregaMap.set(idAluno, {
                id_entrega: row.id_entrega,
                id_atividade: row.id_atividade,
                titulo_atividade: row.titulo_atividade,
                status_avaliacao: row.status_avaliacao,
            });
        }
    }

    const alunosFiltrados = alunosBase
        .map((aluno: any) => {
            const idAluno = String(aluno?.aluno_id || aluno?.id_aluno || aluno?.id || '').trim();
            const conceitoFinal = conceitoFinalMap.get(idAluno) || null;
            const atividadeAssociada = entregaMap.get(idAluno) || null;
            return {
                ...aluno,
                conceito_final: conceitoFinal,
                atividade_associada: atividadeAssociada,
            };
        })
        .filter((aluno: any) => aluno.conceito_final === 'Aprovado(a) com Ressalvas');

    return {
        avaliacao,
        alunos: alunosFiltrados,
    };
});
