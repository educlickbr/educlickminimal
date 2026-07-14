import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

/**
 * BFF: Meus Documentos
 * Busca paginada e filtrada por nome via RPC dedicada.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);
    const query = getQuery(event);
    const pagina = Number.parseInt(String(query.pagina ?? '1'), 10);
    const limite = Number.parseInt(String(query.limite ?? '20'), 10);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Não autorizado' });
    }

    const userId = user.id || (user as any).sub;
    const { data, error } = await (client.rpc as any)('nxt_get_meus_documentos_curso', {
        p_auth_user_id: userId,
        p_busca: query.busca && query.busca !== 'null' ? String(query.busca) : null,
        p_pagina: Number.isNaN(pagina) ? 1 : pagina,
        p_limite: Number.isNaN(limite) ? 20 : limite
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
