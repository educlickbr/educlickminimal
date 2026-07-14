import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/inscricoes?id_edital=X&pagina=1&limite=20
 *
 * Retorna inscrições de um edital.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const pagina = parseInt(query.pagina as string) || 1;
    const limite = parseInt(query.limite as string) || 20;

    const { data, error } = await client.rpc("aca_get_inscricoes_edital", {
        p_id_edital: query.id_edital as string,
        p_pagina: pagina,
        p_limite: limite,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
