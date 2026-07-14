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
            statusMessage: "Missing grupo ID",
        });
    }

    const body = await readBody(event);

    const client = await serverSupabaseClient(event);

    try {
        // Call RPC to update group
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_atualizar_grupo', {
            p_id_grupo: id,
            p_dados: body,
        }) as any;

        if (error) {
            console.error('Error updating grupo:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to update grupo',
            });
        }

        if (!data || !data.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || 'Failed to update grupo',
            });
        }

        return data;
    } catch (err: any) {
        console.error('Unexpected error updating grupo:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
