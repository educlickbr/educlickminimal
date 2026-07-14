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

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc("nxt_jnpta_listar_minhas_candidaturas") as any;

        if (error) {
            console.error("Error listing candidaturas:", error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to list candidaturas",
            });
        }

        return {
            ok: true,
            candidaturas: data || [],
        };
    } catch (err: any) {
        console.error("Unexpected error listing candidaturas:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || "Internal server error",
        });
    }
});
