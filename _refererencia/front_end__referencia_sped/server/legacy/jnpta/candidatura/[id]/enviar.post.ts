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
            statusMessage: "Missing candidatura ID",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        // Call RPC to submit candidatura
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_enviar_candidatura', {
            p_id_candidatura: id,
        }) as any;

        if (error) {
            console.error('Error submitting candidatura:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to submit candidatura',
            });
        }

        if (!data || !data.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || 'Failed to submit candidatura',
            });
        }

        return data;
    } catch (err: any) {
        console.error('Unexpected error submitting candidatura:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
