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
    const { id_integrante } = body;

    if (!id_integrante) {
        throw createError({ statusCode: 400, statusMessage: "Missing id_integrante" });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)(
            "nxt_jnpta_delete_integrante",
            {
                p_id_candidatura: idCandidatura,
                p_id_integrante:  id_integrante,
            }
        );

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Erro ao remover integrante" });
        }

        if (!data?.ok) {
            throw createError({ statusCode: 400, statusMessage: data?.erro || "Não foi possível remover integrante" });
        }

        return { ok: true };
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
