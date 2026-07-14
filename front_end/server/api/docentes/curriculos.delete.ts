import { serverSupabaseClient } from "#supabase/server";

/**
 * DELETE /api/docentes/curriculos?id=X
 *
 * Exclui uma proposta.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const { data, error } = await client.rpc("aca_delete_proposta_docente", {
        p_id: query.id as string,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
