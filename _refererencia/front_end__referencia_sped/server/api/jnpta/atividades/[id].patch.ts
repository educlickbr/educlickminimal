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
    const id = getRouterParam(event, "id");
    const idAtividade = id || body?.id_atividade || null;
    const client = await serverSupabaseClient(event);

    if (!idAtividade) {
        throw createError({
            statusCode: 400,
            statusMessage: "ID da atividade é obrigatório",
        });
    }

    try {
        // @ts-expect-error - RPC types need regeneration
        const { data, error } = await client.rpc("nxt_jnpta_atualizar_atividade", {
            p_id_atividade: idAtividade,
            p_atividade_nome: body?.atividade_nome || null,
            p_duracao_minutos: body?.duracao_minutos || null,
            p_descricao: body?.descricao || null,
            p_ativo: body?.ativo !== undefined ? body.ativo : null,
            p_ordem: body?.ordem !== undefined ? body.ordem : null,
            p_tem_perguntas: body?.tem_perguntas !== undefined ? !!body.tem_perguntas : null,
        }) as any;

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to update atividade",
            });
        }

        return {
            ok: true,
            atividade: data?.[0] || null,
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades PATCH] Error:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || "Internal server error",
        });
    }
});
