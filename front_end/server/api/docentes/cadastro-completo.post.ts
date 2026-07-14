import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/cadastro-completo
 * Body: {
 *   id_entidade, nome, email,
 *   respostas: { "id_pergunta": "valor", ... }
 * }
 *
 * Cria user_expandido + respostas globais + docente em uma transação.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    if (!body.nome || !body.email) {
        throw createError({
            statusCode: 400,
            message: "Nome e email são obrigatórios.",
        });
    }

    const { data, error } = await client.rpc("aca_criar_docente_completo", {
        p_id_entidade: body.id_entidade,
        p_nome: body.nome,
        p_email: body.email,
        p_valor_hora_aula: body.valor_hora_aula || null,
        p_respostas: body.respostas || {},
        p_criado_por: auth?.id || null,
    } as any);

    if (error) {
        // Traduz erro de duplicate key
        const msg = error.message || "";
        if (msg.includes("unique") || msg.includes("duplicate")) {
            throw createError({
                statusCode: 409,
                message: "Já existe um docente com este email.",
            });
        }
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
