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

    const id = getRouterParam(event, 'id');
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing integrante ID",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        // Call RPC to remove integrante
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_remover_integrante', {
            p_id_integrante: id,
        }) as any;

        if (error) {
            console.error('Error removing integrante:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to remove integrante',
            });
        }

        if (!data || !data.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || 'Failed to remove integrante',
            });
        }

        return data;
    } catch (err: any) {
        console.error('Unexpected error removing integrante:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
