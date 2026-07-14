import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const { p_id_turma, p_id_user } = body;

    if (!p_id_turma) {
        throw createError({ statusCode: 400, statusMessage: 'ID da turma é obrigatório.' });
    }

    if (!p_id_user) {
        throw createError({ statusCode: 400, statusMessage: 'ID do usuário é obrigatório.' });
    }

    try {
        const { data, error } = await (client.rpc as any)('nxt_upsert_matricula', {
            p_id_turma,
            p_id_user
        });

        if (error) throw error;

        return { success: true, data };
    } catch (e: any) {
        console.error('Erro no endpoint matricular:', e);
        throw createError({
            statusCode: e.statusCode || 500,
            statusMessage: e.statusMessage || 'Erro ao efetuar matrícula.'
        });
    }
});
