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

    const client = await serverSupabaseClient(event);

    try {
        // Call RPC to get group details
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_get_grupo_detalhes', {
            p_id_grupo: id,
        }) as any;

        if (error) {
            console.error('Error fetching grupo details:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to fetch grupo details',
            });
        }

        if (!data || !data.ok) {
            throw createError({
                statusCode: 404,
                statusMessage: data?.erro || 'Grupo not found',
            });
        }

        return data;
    } catch (err: any) {
        console.error('Unexpected error fetching grupo details:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
