import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/componentes?id_entidade=X
 *
 * Retorna componentes disponíveis para vínculo.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const { data, error } = await client.rpc("aca_get_componentes_para_vinculo", {
        p_id_entidade: query.id_entidade as string,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
