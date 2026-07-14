import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    if (!user.data.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);
    const { id, escopo } = body;
    const allowedEscopo = new Set(['atestado', 'justificativa']);

    if (!id || !escopo) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing ID or escopo'
        });
    }

    if (!allowedEscopo.has(escopo)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid escopo'
        });
    }

    const { error } = await (client.rpc as any)('nxt_justificativa_update_escopo', {
        p_id: id,
        p_escopo: escopo,
        p_user_id: user.data.user.id
    });

    if (error) {
        console.error('Error updating escopo:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return { success: true };
});
