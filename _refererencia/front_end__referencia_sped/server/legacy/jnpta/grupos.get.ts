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
        // Call RPC to list user's groups
        const { data, error } = await client.rpc('nxt_jnpta_listar_meus_grupos');

        if (error) {
            console.error('Error listing grupos:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to list grupos',
            });
        }

        return {
            ok: true,
            grupos: data || [],
        };
    } catch (err: any) {
        console.error('Unexpected error listing grupos:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
