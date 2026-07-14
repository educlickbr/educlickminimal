import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const id_turma = query.id_turma as string;

    if (!id_turma) {
        throw createError({ statusCode: 400, statusMessage: 'ID da turma é obrigatório.' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await (client.rpc as any)('nxt_get_turmas_troca_turno', {
        p_id_turma: id_turma
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
