import { serverSupabaseClient } from "#supabase/server";

/**
 * DELETE /api/docentes/docentes?id=X&ativo=false
 *
 * Ativa/desativa um docente.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const auth = event.context.user;

    const { data, error } = await client.rpc("aca_toggle_docente", {
        p_id: query.id as string,
        p_ativo: query.ativo === "true",
        p_modificado_por: auth?.id || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
