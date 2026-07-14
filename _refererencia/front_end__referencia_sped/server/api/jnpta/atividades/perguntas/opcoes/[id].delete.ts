import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

// DELETE /api/jnpta/atividades/perguntas/opcoes/:id
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const id = getRouterParam(event, "id");
    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_deletar_opcao_pergunta", {
            p_id_opcao: id,
        });

        if (error) throw error;

        return { ok: !!data };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/perguntas/opcoes/[id] DELETE] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
