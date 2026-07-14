import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/vinculos
 * Body: { id_docente, vinculos: [{ id_componente, elegivel }] }
 *
 * Salva lote de vínculos (substitui todos).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    const { data, error } = await client.rpc("aca_upsert_vinculos_docente", {
        p_id_docente: body.id_docente,
        p_vinculos: body.vinculos,
        p_criado_por: auth?.id || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
