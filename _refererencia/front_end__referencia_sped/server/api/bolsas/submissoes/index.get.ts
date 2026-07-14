
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

    const query = getQuery(event);
    const id_edital = query.id_edital as string;

    if (!id_edital) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do edital é obrigatório'
        });
    }

    const { data, error } = await (client.rpc as any)('nxt_bolsa_submissao_get_by_edital', {
        p_id_edital: id_edital,
        p_status: query.status || null
    });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});
