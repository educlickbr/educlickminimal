import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/matriculas/turmas?id_entidade=UUID
 *
 * Retorna turmas (ciclos) disponíveis para o filtro da página de matrículas.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const id_entidade =
        (query.id_entidade as string) ||
        "00ca60ea-6667-482d-8a96-09b877707b08";

    const { data, error } = await client.rpc(
        "aca_get_turmas_para_matriculas",
        {
            p_id_entidade: id_entidade,
        } as any,
    );

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
