import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/auth/verificar-email?email=X
 *
 * Verifica se o email existe em user_expandido e se
 * o usuário ainda não tem conta (id_user IS NULL).
 * Usado pela tela de login para onboarding inline.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const email = (query.email as string || "").trim().toLowerCase();

    if (!email) {
        return { existe: false, pode_criar_conta: false };
    }

    const { data, error } = await (client as any)
        .from("user_expandido")
        .select("id, nome_completo, id_user")
        .eq("email", email)
        .maybeSingle();

    if (error || !data) {
        return { existe: false, pode_criar_conta: false };
    }

    return {
        existe: true,
        pode_criar_conta: !data.id_user,
        nome: data.nome_completo || "",
        id_user_expandido: data.id,
    };
});
