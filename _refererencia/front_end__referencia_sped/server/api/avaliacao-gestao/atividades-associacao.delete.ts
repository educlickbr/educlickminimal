import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    const idEntrega = String(body?.id_entrega || '').trim();

    if (!idEntrega) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Parâmetro obrigatório ausente: id_entrega.',
        });
    }

    const { data, error } = await (client.rpc as any)('avl_remover_associacao_atividade', {
        p_id_entrega: idEntrega,
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row?.removido) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Associação não encontrada ou já foi removida.',
        });
    }

    return { removido: true, id_entrega: idEntrega };
});
