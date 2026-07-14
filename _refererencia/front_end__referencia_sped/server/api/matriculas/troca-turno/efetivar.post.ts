import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id_matricula, id_aluno, id_turma_nova } = body;

    if (!id_matricula || !id_aluno || !id_turma_nova) {
        throw createError({ statusCode: 400, statusMessage: 'Dados incompletos para troca.' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await (client.rpc as any)('nxt_efetuar_troca_turno', {
        p_id_matricula: id_matricula,
        p_id_aluno: id_aluno,
        p_id_turma_nova: id_turma_nova
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
