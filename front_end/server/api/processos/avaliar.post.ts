import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const { id_inscricao, campo, valor } = body as {
        id_inscricao: string;
        campo: string;
        valor: string;
    };

    if (!id_inscricao || !campo || !valor) {
        throw createError({ statusCode: 400, message: "Parâmetros obrigatórios: id_inscricao, campo, valor" });
    }

    const { data, error } = await client.rpc("aca_avaliar_inscricao", {
        p_id_inscricao: id_inscricao,
        p_campo: campo,
        p_valor: valor,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
