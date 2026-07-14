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
        const { data, error } = await client.rpc("nxt_jnpta_criar_atividade", {
            p_id_edital: body?.id_edital,
            p_atividade_nome: body?.atividade_nome,
            p_duracao_minutos: body?.duracao_minutos || null,
            p_descricao: body?.descricao || null,
            p_ordem: body?.ordem || 0,
            p_tem_perguntas: !!body?.tem_perguntas,
        } as any);

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to create atividade",
            });
        }

        return {
            ok: true,
            atividade: data?.[0] || null,
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades POST] Error:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || "Internal server error",
        });
    }
});
