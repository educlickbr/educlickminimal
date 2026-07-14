import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/gerar-codigo
 * Body: { id_user_expandido }
 *
 * Gera um código de verificação de 6 dígitos.
 * Retorna o código (para admin repassar ao docente).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const { data, error } = await client.rpc("aca_gerar_codigo_verificacao", {
        p_id_user_expandido: body.id_user_expandido,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
