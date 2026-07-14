import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/public/completar-cadastro-docente
 * Body: { token, nome, respostas }
 *
 * Completa o cadastro do docente após o signUp.
 * Chama RPC SECURITY DEFINER que cria user_expandido + respostas + docente.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    if (!body.token || !body.nome) {
        throw createError({
            statusCode: 400,
            message: "Token e nome são obrigatórios.",
        });
    }

    const { data, error } = await client.rpc("aca_completar_cadastro_docente", {
        p_token: body.token,
        p_nome: body.nome,
        p_respostas: body.respostas || {},
        p_id_user_expandido: body.id_user_expandido || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
