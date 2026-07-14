import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const { p_processo_id } = body;

    if (!p_processo_id) {
        throw createError({ statusCode: 400, statusMessage: 'ID do processo é obrigatório.' });
    }

    try {
        const { data, error } = await (client.rpc as any)('nxt_delete_inscricao_processo', {
            p_processo_id
        });

        if (error) throw error;

        return { success: true, data };
    } catch (e: any) {
        console.error('Erro no endpoint deletar-inscricao:', e);
        throw createError({
            statusCode: e.statusCode || 500,
            statusMessage: e.statusMessage || 'Erro ao deletar inscrição do processo.'
        });
    }
});
