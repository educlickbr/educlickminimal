
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

    const id = getRouterParam(event, 'id');

    const { error } = await (client.rpc as any)('nxt_edt_edital_delete', {
        p_id: id
    });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return { message: 'Edital excluído com sucesso' };
});
