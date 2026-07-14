import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const { p_id_user, p_id_pergunta, p_id_processo, p_resposta_texto } = body;

    if (!p_id_user) {
        throw createError({ statusCode: 400, statusMessage: 'ID do usuário é obrigatório.' });
    }

    if (!p_id_pergunta) {
        throw createError({ statusCode: 400, statusMessage: 'ID da pergunta é obrigatório.' });
    }

    if (!p_id_processo) {
        throw createError({ statusCode: 400, statusMessage: 'ID do processo é obrigatório.' });
    }

    try {
        const { data, error } = await (client.rpc as any)('nxt_upsert_resposta_avaliacao', {
            p_id_user,
            p_id_pergunta,
            p_id_processo,
            p_resposta_texto: p_resposta_texto ?? null
        });

        if (error) throw error;

        return { success: true, data };
    } catch (e: any) {
        console.error('Erro no endpoint resposta-avaliacao:', e);
        throw createError({
            statusCode: e.statusCode || 500,
            statusMessage: e.statusMessage || 'Erro ao salvar resposta de avaliação.'
        });
    }
});
