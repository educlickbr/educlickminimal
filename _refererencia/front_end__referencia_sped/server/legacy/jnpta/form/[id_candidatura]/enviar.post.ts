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

    // @ts-expect-error - RPC types need to be regenerated
    const { data, error } = await client.rpc("nxt_jnpta_enviar_candidatura", {
        p_id_candidatura: idCandidatura,
    }) as any;

    if (error || !data?.ok) {
        throw createError({ statusCode: 500, statusMessage: data?.erro || error?.message || "Failed to submit candidatura" });
    }

    return data;
});
