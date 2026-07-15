import { serverSupabaseClient, serverSupabaseServiceRole } from "#supabase/server";

/**
 * POST /api/auth/criar-conta
 * Body: { id_user_expandido, email, codigo, senha }
 *
 * Verifica código, cria auth user (service_role), vincula id_user.
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

    // 1. Verifica código
    const { data: verificado, error: verError } = await client.rpc("aca_verificar_codigo", {
        p_id_user_expandido: body.id_user_expandido,
        p_codigo: body.codigo,
    } as any);

    if (verError || !verificado?.success) {
        throw createError({
            statusCode: 400,
            message: verificado?.message || "Código inválido ou expirado.",
        });
    }

    // 2. Cria auth user (com service_role — admin)
    const adminClient = await serverSupabaseServiceRole(event);
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: body.senha,
        email_confirm: true,
    });

    if (authError || !authData?.user) {
        throw createError({
            statusCode: 500,
            message: authError?.message || "Erro ao criar conta.",
        });
    }

    // 3. Vincula id_user ao user_expandido
    const { error: linkError } = await (adminClient as any)
        .from("user_expandido")
        .update({ id_user: authData.user.id })
        .eq("id", body.id_user_expandido);

    if (linkError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw createError({ statusCode: 500, message: "Erro ao vincular conta." });
    }

    // 4. Atribui papel aca_docente
    const { data: papelData } = await (adminClient as any)
        .from("user_papeis")
        .select("id")
        .eq("nome", "aca_docente")
        .single();

    if (papelData?.id) {
        await (adminClient as any)
            .from("user_papeis_auth")
            .insert({ id_user: authData.user.id, id_papel: papelData.id })
            .maybeSingle();
    }

    return {
        success: true,
        message: "Conta criada com sucesso!",
        email: body.email,
    };
});
