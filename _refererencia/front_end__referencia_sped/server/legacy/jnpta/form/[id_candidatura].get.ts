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
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc("nxt_jnpta_form_get", {
            p_id_candidatura: idCandidatura,
        }) as any;

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Failed to load form" });
        }

        if (!data?.ok) {
            throw createError({ statusCode: 403, statusMessage: data?.erro || "Not allowed" });
        }

        return data;
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
