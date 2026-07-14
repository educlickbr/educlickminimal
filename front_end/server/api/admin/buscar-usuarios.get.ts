import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/admin/buscar-usuarios?busca=termo
 *
 * Busca usuários em user_expandido por nome ou email.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const busca = (query.busca as string) || "";

    if (!busca.trim()) {
        return { success: true, itens: [] };
    }

    const { data, error } = await (client as any)
        .from("user_expandido")
        .select("id, nome_completo, email")
        .or(
            `nome_completo.ilike.%${busca}%,email.ilike.%${busca}%`,
        )
        .limit(20);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return { success: true, itens: data || [] };
});
