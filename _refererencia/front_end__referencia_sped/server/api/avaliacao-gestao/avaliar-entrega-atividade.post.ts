import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const idEntrega = String(body?.id_entrega || '').trim();
    const status    = String(body?.status    || '').trim();
    const feedback  = body?.feedback != null ? String(body.feedback).trim() : null;

    if (!idEntrega || !status) {
        throw createError({ statusCode: 400, statusMessage: 'Parâmetros obrigatórios ausentes: id_entrega e status.' });
    }

    if (!['Aprovado', 'Reprovado'].includes(status)) {
        throw createError({ statusCode: 400, statusMessage: 'Status inválido: use Aprovado ou Reprovado.' });
    }

    const { data, error } = await (client.rpc as any)('avl_professor_avaliar_entrega', {
        p_id_entrega: idEntrega,
        p_status:     status,
        p_feedback:   feedback || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    const result = Array.isArray(data) ? data[0] : data;
    return { ok: result?.ok ?? true, id_entrega: idEntrega, status_novo: status };
});
