import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/editais?id_entidade=X
 *
 * Retorna lista de editais com contagem de inscrições.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const { data, error } = await client.rpc("aca_get_editais_docente", {
        p_id_entidade: query.id_entidade as string,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
