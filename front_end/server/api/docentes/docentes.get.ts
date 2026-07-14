import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/docentes?id_entidade=X&busca=termo&pagina=1&limite=20
 *
 * Retorna lista paginada de docentes cadastrados.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const id_entidade = (query.id_entidade as string) || "";
    const busca = (query.busca as string) || null;
    const pagina = parseInt(query.pagina as string) || 1;
    const limite = parseInt(query.limite as string) || 20;

    const { data, error } = await client.rpc("aca_get_docentes", {
        p_id_entidade: id_entidade,
        p_busca: busca,
        p_pagina: pagina,
        p_limite: limite,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
