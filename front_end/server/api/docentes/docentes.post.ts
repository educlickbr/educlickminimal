import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/docentes
 * Body: { id_entidade, id_user_expandido }
 *
 * Cria ou reativa um docente.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    const { data, error } = await client.rpc("aca_upsert_docente", {
        p_id_entidade: body.id_entidade,
        p_id_user_expandido: body.id_user_expandido,
        p_criado_por: auth?.id || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
