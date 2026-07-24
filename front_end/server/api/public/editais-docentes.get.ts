import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/public/editais-docentes?id_entidade=X
 *
 * Retorna editais ativos para a página pública (filtra só os ativos e com data_fim >= now).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const id_entidade = (query.id_entidade as string) || "00ca60ea-6667-482d-8a96-09b877707b08";

    const { data, error } = await client.rpc("aca_get_editais_publicos", {
        p_id_entidade: id_entidade,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    const result = data as any;
    return { success: true, itens: result?.itens || [] };
});
