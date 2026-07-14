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

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)(
            "nxt_jnpta_get_integrantes",
            { p_id_candidatura: idCandidatura }
        );

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Erro ao carregar integrantes" });
        }

        if (!data?.ok) {
            throw createError({ statusCode: 400, statusMessage: data?.erro || "Não foi possível carregar integrantes" });
        }

        return {
            ok: true,
            qtd_integrantes: data.qtd_integrantes ?? 1,
            integrantes: data.integrantes ?? [],
        };
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
