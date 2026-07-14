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

    const body = await readBody(event);

    if (!body.id_grupo) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required field: id_grupo",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_criar_candidatura', {
            p_id_grupo: body.id_grupo,
        }) as any;

        if (error) {
            console.error('Error creating candidatura:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to create candidatura',
            });
        }

        if (!data || !data.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || 'Failed to create candidatura',
            });
        }

        return data;
    } catch (err: any) {
        console.error('Unexpected error creating candidatura:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
