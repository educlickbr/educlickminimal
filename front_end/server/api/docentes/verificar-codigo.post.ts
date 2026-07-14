import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/verificar-codigo
 * Body: { id_user_expandido, codigo }
 *
 * Verifica o código de 6 dígitos informado.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const { data, error } = await client.rpc("aca_verificar_codigo", {
        p_id_user_expandido: body.id_user_expandido,
        p_codigo: body.codigo,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
