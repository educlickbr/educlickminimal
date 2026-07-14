import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/inscricoes
 * Body: { id, status }
 *
 * Avalia uma inscrição (aprovar/recusar/suplente).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    const { data, error } = await client.rpc("aca_avaliar_inscricao_docente", {
        p_id: body.id,
        p_status: body.status,
        p_modificado_por: auth?.id || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
