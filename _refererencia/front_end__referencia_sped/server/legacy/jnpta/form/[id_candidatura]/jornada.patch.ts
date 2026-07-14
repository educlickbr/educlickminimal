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
    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc("nxt_jnpta_form_upsert_jornada", {
            p_id_candidatura: idCandidatura,
            p_dados: body || {},
        }) as any;

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Failed to save jornada" });
        }

        if (!data?.ok) {
            throw createError({ statusCode: 400, statusMessage: data?.erro || "Failed to save jornada" });
        }

        return data;
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
