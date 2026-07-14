import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const query = getQuery(event);
    const idEdital = typeof query.id_edital === "string" ? query.id_edital : null;

    if (!idEdital) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing id_edital",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_listar_atividades", {
            p_id_edital: idEdital,
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to list atividades",
            });
        }

        return {
            ok: true,
            atividades: data || [],
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades GET] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err?.message || "Internal server error",
        });
    }
});
