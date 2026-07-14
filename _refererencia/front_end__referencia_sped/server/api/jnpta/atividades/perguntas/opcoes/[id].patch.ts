import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

// PATCH /api/jnpta/atividades/perguntas/opcoes/:id
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_atualizar_opcao_pergunta", {
            p_id_opcao: id,
            p_label: body?.label ?? null,
            p_ordem: body?.ordem !== undefined ? body.ordem : null,
            p_ativo: body?.ativo !== undefined ? !!body.ativo : null,
        });

        if (error) throw error;

        return { ok: true, opcao: data?.[0] || null };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/perguntas/opcoes/[id] PATCH] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
