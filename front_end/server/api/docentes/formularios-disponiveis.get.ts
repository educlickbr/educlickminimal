import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/formularios-disponiveis?id_entidade=X&tipo_proc=seletivo
 *
 * Retorna formulários salvos filtrados por tipo_proc e tipo_cand.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const id_entidade = query.id_entidade as string;
    const tipo_proc = (query.tipo_proc as string) || "seletivo";
    const tipo_cand = (query.tipo_cand as string) || "docente";

    if (!id_entidade) {
        throw createError({ statusCode: 400, message: "id_entidade é obrigatório." });
    }

    const { data, error } = await client.rpc("frm_get_formularios_salvos", {
        p_id_entidade: id_entidade,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    // Filtra no BFF para manter a RPC genérica
    const itens = (data?.itens || []).filter(
        (f: any) =>
            f.tipo_proc === tipo_proc &&
            f.tipo_cand === tipo_cand &&
            f.escopo === "global",
    );

    return { success: true, itens };
});
