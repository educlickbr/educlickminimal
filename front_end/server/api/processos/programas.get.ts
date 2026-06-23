import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const id_entidade =
        (query.id_entidade as string) ||
        "00ca60ea-6667-482d-8a96-09b877707b08";
    const id_area = (query.id_area as string) || null;
    const ano_semestre = (query.ano_semestre as string) || null;
    const busca = (query.busca as string) || null;

    const { data, error } = await client.rpc("aca_get_processos_filtrados", {
        p_id_entidade: id_entidade,
        p_id_area: id_area,
        p_ano_semestre: ano_semestre,
        p_busca: busca || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
