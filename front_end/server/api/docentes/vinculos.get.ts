import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/vinculos?id_docente=X
 *
 * Retorna vínculos de um docente.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const { data, error } = await client.rpc("aca_get_vinculos_docente", {
        p_id_docente: query.id_docente as string,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
