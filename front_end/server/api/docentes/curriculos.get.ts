import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/curriculos?id_entidade=X&filtro=todas&pagina=1&limite=20
 *
 * Retorna propostas/currículos recebidos (paginada).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const pagina = parseInt(query.pagina as string) || 1;
    const limite = parseInt(query.limite as string) || 20;

    const { data, error } = await client.rpc("aca_get_propostas_docente", {
        p_id_entidade: query.id_entidade as string,
        p_filtro: (query.filtro as string) || "todas",
        p_pagina: pagina,
        p_limite: limite,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
