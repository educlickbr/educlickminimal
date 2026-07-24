import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/auth/verificar-email?email=X
 *
 * Verifica se o email existe em user_expandido e se
 * o usuário ainda não tem conta (id_user IS NULL).
 * Usa RPC SECURITY DEFINER para bypassar RLS.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const email = (query.email as string || "").trim().toLowerCase();

    if (!email) {
        return { existe: false, pode_criar_conta: false };
    }

    const { data, error } = await client.rpc("auth_verificar_email", {
        p_email: email,
    } as any);

    if (error || !data) {
        return { existe: false, pode_criar_conta: false };
    }

    return data;
});
