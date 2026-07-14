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
    const id_atividade = String(query?.id_atividade || "");
    if (!id_atividade) {
        throw createError({
            statusCode: 400,
            statusMessage: "id_atividade is required",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_listar_perguntas_atividade", {
            p_id_atividade: id_atividade,
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to list perguntas da atividade",
            });
        }

        return {
            ok: true,
            perguntas: data || [],
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/perguntas GET] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
