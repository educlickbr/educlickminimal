import { serverSupabaseClient } from "#supabase/server";

/**
 * DELETE /api/docentes/editais?id=X&id_entidade=Y
 *
 * Exclui um edital.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const { data, error } = await client.rpc("aca_delete_edital_docente", {
        p_id: query.id as string,
        p_id_entidade: query.id_entidade as string,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
