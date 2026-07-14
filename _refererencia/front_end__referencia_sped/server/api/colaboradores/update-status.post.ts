
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id, status } = body;

    if (!id || status === undefined) {
        throw createError({ statusCode: 400, statusMessage: 'Missing required fields' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await (client.rpc as any)('nxt_update_colaborador_status', {
        p_id: id,
        p_status: status
    });

    if (error) {
        console.error('Error updating collaborator status:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return { success: data };
});
