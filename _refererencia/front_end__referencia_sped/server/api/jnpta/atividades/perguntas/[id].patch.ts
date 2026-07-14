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
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_atualizar_pergunta_atividade", {
            p_id_pergunta: id,
            p_pergunta: body?.pergunta || null,
            p_tipo_resposta: body?.tipo_resposta || null,
            p_obrigatoria: body?.obrigatoria !== undefined ? !!body.obrigatoria : null,
            p_ordem: body?.ordem !== undefined ? body.ordem : null,
            p_ativo: body?.ativo !== undefined ? !!body.ativo : null,
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to update pergunta da atividade",
            });
        }

        return {
            ok: true,
            pergunta: data?.[0] || null,
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/perguntas/[id] PATCH] Error:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || "Internal server error",
        });
    }
});
