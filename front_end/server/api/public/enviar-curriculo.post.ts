import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/public/enviar-curriculo
 * Body: { id_entidade, nome, email, telefone?, minibio?, id_curriculo?, id_edital? }
 *
 * Endpoint público para envio de currículo (Trabalhe Conosco).
 * Não exige autenticação.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    if (!body.nome || !body.email) {
        throw createError({
            statusCode: 400,
            message: "Nome e email são obrigatórios.",
        });
    }

    const { data, error } = await client.rpc("aca_inserir_proposta_publica", {
        p_id_entidade: body.id_entidade,
        p_nome: body.nome,
        p_email: body.email,
        p_telefone: body.telefone || null,
        p_minibio: body.minibio || null,
        p_id_curriculo: body.id_curriculo || null,
        p_id_edital: body.id_edital || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
