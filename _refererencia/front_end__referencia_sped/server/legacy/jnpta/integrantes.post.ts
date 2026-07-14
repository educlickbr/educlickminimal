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

    // Validate required fields
    if (!body.id_grupo || !body.id_user || !body.funcao) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required fields: id_grupo, id_user, funcao",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        // Call RPC to add integrante
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_adicionar_integrante', {
            p_id_grupo: body.id_grupo,
            p_id_user: body.id_user,
            p_funcao: body.funcao,
            p_ordem: body.ordem || 1,
        }) as any;

        if (error) {
            console.error('Error adding integrante:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to add integrante',
            });
        }

        if (!data || !data.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || 'Failed to add integrante',
            });
        }

        return data;
    } catch (err: any) {
        console.error('Unexpected error adding integrante:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
