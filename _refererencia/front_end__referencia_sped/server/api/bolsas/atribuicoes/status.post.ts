import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);
    const idsMatriculas = Array.isArray(body?.id_matriculas)
        ? body.id_matriculas.filter((id: unknown) => typeof id === 'string' && id.length > 0)
        : [];
    const anoSemestre = typeof body?.ano_semestre === 'string' ? body.ano_semestre : '';
    const idTurma = typeof body?.id_turma === 'string' ? body.id_turma : null;

    if (idsMatriculas.length === 0) {
        return { statusByMatricula: {} };
    }

    if (!anoSemestre) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campo obrigatório: ano_semestre'
        });
    }

    const client = await serverSupabaseClient(event);

    let page = 1;
    let pages = 1;
    const limit = 1000;
    const idsComBolsa = new Set<string>();

    do {
        const { data, error } = await (client.rpc as any)('nxt_get_bolsa_atribuicoes_admin', {
            p_ano_semestre: anoSemestre,
            p_id_turma: idTurma,
            p_busca: null,
            p_status: 'Atribuídos',
            p_page: page,
            p_limit: limit
        });

        if (error) {
            console.error('Erro ao consultar status de bolsas por matrícula:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Erro ao consultar status de bolsas'
            });
        }

        const alunos = Array.isArray(data?.alunos) ? data.alunos : [];
        for (const aluno of alunos) {
            const id = typeof aluno?.id_matricula === 'string' ? aluno.id_matricula : '';
            if (id) idsComBolsa.add(id);
        }

        pages = Number(data?.pages || 1);
        page += 1;
    } while (page <= pages && page <= 50);

    const statusByMatricula = Object.fromEntries(
        idsMatriculas.map((id: string) => [id, idsComBolsa.has(id)])
    );

    return { statusByMatricula };
});
