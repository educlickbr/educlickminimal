
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
    const id_user_expandido = query.id_user_expandido as string;

    if (!id_user_expandido) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_user_expandido is required'
        });
    }

    const { data, error } = await (client.rpc as any)('nxt_justificativa_get_aluno', {
        p_id_aluno: id_user_expandido
    });

    if (error) {
        console.error('Error fetching minhas justificativas:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    // Aluno não tem acesso ao caminho_ficha enquanto o escopo for 'atestado'.
    // O documento só se torna visível após o avaliador mudar o escopo para 'justificativa'.
    const result = (data || []).map((item: any) => ({
        ...item,
        caminho_ficha: item.escopo === 'atestado' ? null : item.caminho_ficha
    }));

    return result;
});
