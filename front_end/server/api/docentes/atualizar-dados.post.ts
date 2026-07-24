import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/atualizar-dados
 * Body: { id_docente, id_user_expandido, id_entidade, valor_hora_aula, respostas }
 *
 * Atualiza dados do docente (valor_hora_aula + respostas globais).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    if (!body.id_docente || !body.id_user_expandido) {
        throw createError({ statusCode: 400, message: "Dados incompletos." });
    }

    // 1. Atualiza valor_hora_aula
    if (body.valor_hora_aula !== undefined) {
        await client.rpc("aca_set_valor_hora_aula", {
            p_id: body.id_docente,
            p_valor: body.valor_hora_aula,
            p_modificado_por: auth?.id || null,
        } as any);
    }

    // 2. Atualiza respostas das perguntas globais
    if (body.respostas) {
        for (const [perguntaId, resposta] of Object.entries(body.respostas)) {
            if (resposta) {
                await client.rpc("aca_upsert_resposta_form", {
                    p_id_entidade: body.id_entidade,
                    p_id_user_expandido: body.id_user_expandido,
                    p_id_pergunta: perguntaId,
                    p_resposta: resposta,
                    p_usuario_id: auth?.id || null,
                } as any);
            }
        }
    }

    return { success: true };
});
