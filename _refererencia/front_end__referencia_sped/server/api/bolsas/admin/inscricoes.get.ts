
import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const query = getQuery(event);
    const {
        ano_semestre,
        id_edital,
        busca,
        status,
        page = 1,
        limit = 20
    } = query;

    if (!ano_semestre) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Ano/Semestre é obrigatório',
        });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await (client.rpc as any)('nxt_get_bolsa_submissoes_admin', {
        p_ano_semestre: ano_semestre,
        p_id_edital: id_edital || null,
        p_busca: busca || null,
        p_status: status || null,
        p_page: Number(page),
        p_limit: Number(limit)
    });

    if (error) {
        console.error('Error fetching admin subs:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return data;
});
