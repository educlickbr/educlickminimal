
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id, papel_id } = body;

    if (!id || !papel_id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing required fields' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await (client.rpc as any)('nxt_update_colaborador_papel', {
        p_id: id,
        p_papel_id: papel_id
    });

    if (error) {
        console.error('Error updating collaborator role:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return { success: data };
});
