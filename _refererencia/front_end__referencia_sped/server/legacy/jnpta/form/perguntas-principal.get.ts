import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await client.rpc("nxt_jnpta_form_get_perguntas_principal") as any;

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Failed to load perguntas" });
        }

        return {
            ok: true,
            perguntas: data || [],
        };
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
