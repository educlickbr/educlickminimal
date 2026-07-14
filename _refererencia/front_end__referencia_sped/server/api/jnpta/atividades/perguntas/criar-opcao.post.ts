import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

// POST /api/jnpta/atividades/perguntas/criar-opcao
// Body: { id_pergunta, label, ordem? }
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_criar_opcao_pergunta", {
            p_id_pergunta: body?.id_pergunta,
            p_label: body?.label,
            p_ordem: body?.ordem ?? 0,
        });

        if (error) throw error;

        return { ok: true, opcao: data?.[0] || null };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/perguntas/criar-opcao POST] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
