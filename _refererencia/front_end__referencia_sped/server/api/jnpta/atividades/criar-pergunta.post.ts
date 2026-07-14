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

    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_criar_pergunta_atividade", {
            p_id_atividade: body?.id_atividade,
            p_pergunta: body?.pergunta,
            p_tipo_resposta: body?.tipo_resposta || "texto_curto",
            p_obrigatoria: !!body?.obrigatoria,
            p_ordem: body?.ordem || 0,
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to create pergunta da atividade",
            });
        }

        return {
            ok: true,
            pergunta: data?.[0] || null,
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/criar-pergunta POST] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
