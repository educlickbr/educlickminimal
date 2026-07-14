
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    // Validar se o usuário está logado
    if (!user.data.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const { data, error } = await (client.rpc as any)('nxt_opt_oportunidade_get_paginado', {
        p_ano_semestre: query.ano_semestre || null,
        p_page: page,
        p_limit: limit,
        p_public_view: query.public_view === 'true'
    });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});
