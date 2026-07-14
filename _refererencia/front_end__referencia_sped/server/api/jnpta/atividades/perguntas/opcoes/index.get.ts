import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

// GET /api/jnpta/atividades/perguntas/opcoes?id_pergunta=UUID
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const query = getQuery(event);
    const id_pergunta = String(query?.id_pergunta || "");
    if (!id_pergunta) {
        throw createError({ statusCode: 400, statusMessage: "id_pergunta is required" });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client as any)
            .from("jnpta_edital_atividade_pergunta_opcoes")
            .select("id, id_pergunta, label, ordem, ativo, criado_em, modificado_em")
            .eq("id_pergunta", id_pergunta)
            .eq("ativo", true)
            .order("ordem", { ascending: true });

        if (error) throw error;

        return { ok: true, opcoes: data || [] };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/perguntas/opcoes GET] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
