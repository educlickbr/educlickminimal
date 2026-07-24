import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/auth/criar-conta
 * Body: { id_user_expandido, email, codigo, senha }
 *
 * 1. Verifica código (RPC SECURITY DEFINER)
 * 2. Retorna sucesso — o cliente faz o signUp e depois vincula papel
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    if (!body.id_user_expandido || !body.email || !body.codigo || !body.senha) {
        throw createError({ statusCode: 400, message: "Dados incompletos." });
    }

    if (body.senha.length < 6) {
        throw createError({ statusCode: 400, message: "Senha deve ter no mínimo 6 caracteres." });
    }

    // 1. Verifica código (RPC SECURITY DEFINER — funciona sem auth)
    const { data, error } = await (client as any).rpc("aca_verificar_codigo", {
        p_id_user_expandido: body.id_user_expandido,
        p_codigo: body.codigo,
    });

    const verificado = data as any;

    if (error || !verificado?.success) {
        throw createError({
            statusCode: 400,
            message: verificado?.message || "Código inválido ou expirado.",
        });
    }

    // Retorna sucesso — o cliente faz o signUp e depois vincula papel
    return {
        success: true,
        message: "Código verificado!",
        id_user_expandido: body.id_user_expandido,
        email: body.email,
    };
});
