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

    const id = getRouterParam(event, "id");
    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_deletar_pergunta_atividade", {
            p_id_pergunta: id,
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to delete pergunta da atividade",
            });
        }

        return {
            ok: !!data,
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/perguntas/[id] DELETE] Error:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || "Internal server error",
        });
    }
});
