import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Não autenticado' });
    }

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID do documento é obrigatório' });
    }

    const userId = user?.id || (user as any)?.sub;

    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'ID do usuário ausente' });
    }

    const { data, error } = await (client.rpc as any)('nxt_delete_documento_curso', {
        p_dados: {
            auth_user_id: userId,
            id: id,
        }
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
