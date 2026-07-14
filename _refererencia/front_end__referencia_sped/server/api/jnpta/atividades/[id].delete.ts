import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const id = getRouterParam(event, "id");
    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need regeneration
        const { data, error } = await client.rpc("nxt_jnpta_deletar_atividade", {
            p_id_atividade: id,
        }) as any;

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to delete atividade",
            });
        }

        return {
            ok: true,
            deleted: data,
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades DELETE] Error:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || "Internal server error",
        });
    }
});
