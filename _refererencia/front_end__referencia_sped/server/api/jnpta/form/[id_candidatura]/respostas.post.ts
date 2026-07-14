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
    const respostas = body?.respostas;

    if (!Array.isArray(respostas)) {
        throw createError({ statusCode: 400, statusMessage: "respostas must be an array" });
    }

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc("nxt_jnpta_form_upsert_respostas_principal", {
            p_id_candidatura: idCandidatura,
            p_respostas: respostas,
        }) as any;

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Failed to save respostas" });
        }

        if (!data?.ok) {
            throw createError({ statusCode: 400, statusMessage: data?.erro || "Failed to save respostas" });
        }

        return data;
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
