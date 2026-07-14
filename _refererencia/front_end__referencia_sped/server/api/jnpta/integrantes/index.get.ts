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

    const { id_grupo } = getQuery(event);

    if (!id_grupo) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing id_grupo query parameter",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_listar_integrantes', {
            p_id_grupo: id_grupo,
        }) as any;

        if (error) {
            console.error('Error listing integrantes:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to list integrantes',
            });
        }

        return {
            ok: true,
            integrantes: data || [],
        };
    } catch (err: any) {
        console.error('Unexpected error listing integrantes:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
