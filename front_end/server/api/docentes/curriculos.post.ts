import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/curriculos
 * Body: { id, acao: "visto" | "considerar" | "dispensar" | "enviar_proposta" }
 *
 * Marca proposta como vista, considerada, dispensada, ou insere nova proposta.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    let result;

    if (body.acao === "enviar_proposta") {
        const { data, error } = await client.rpc("aca_inserir_proposta_publica", {
            p_id_entidade: body.id_entidade,
            p_nome: body.nome,
            p_email: body.email,
            p_telefone: body.telefone || null,
            p_minibio: body.minibio || null,
            p_id_curriculo: body.id_curriculo || null,
            p_id_edital: body.id_edital || null,
        } as any);
        if (error) throw createError({ statusCode: 500, message: error.message });
        return data;
    }

    if (body.acao === "visto") {
        const { data, error } = await client.rpc("aca_marcar_visto_proposta", {
            p_id: body.id,
        } as any);
        if (error) throw createError({ statusCode: 500, message: error.message });
        result = data;
    } else {
        const { data, error } = await client.rpc("aca_considerar_proposta", {
            p_id: body.id,
            p_considerado: body.acao === "considerar",
        } as any);
        if (error) throw createError({ statusCode: 500, message: error.message });
        result = data;
    }

    return result;
});
