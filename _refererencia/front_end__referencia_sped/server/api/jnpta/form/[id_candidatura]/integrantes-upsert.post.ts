import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const idCandidatura = getRouterParam(event, "id_candidatura");
    if (!idCandidatura) {
        throw createError({ statusCode: 400, statusMessage: "Missing id_candidatura" });
    }

    const body = await readBody(event);
    const { id_grupo, ordem, respostas } = body;

    if (!id_grupo || typeof ordem !== "number" || !Array.isArray(respostas)) {
        throw createError({ statusCode: 400, statusMessage: "Missing required fields: id_grupo, ordem, respostas" });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)(
            "nxt_jnpta_upsert_integrante",
            {
                p_id_candidatura: idCandidatura,
                p_id_grupo:       id_grupo,
                p_ordem:          ordem,
                p_respostas:      respostas,
            }
        );

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Erro ao salvar integrante" });
        }

        if (!data?.ok) {
            throw createError({ statusCode: 400, statusMessage: data?.erro || "Não foi possível salvar integrante" });
        }

        return {
            ok:            true,
            id_user_exp:   data.id_user_exp,
            id_integrante: data.id_integrante,
        };
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
