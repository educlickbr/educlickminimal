
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
    // body: { id_submissao, status, comentario }

    const { error } = await (client.rpc as any)('nxt_bolsa_submissao_avaliar', {
        p_id_submissao: body.id_submissao,
        p_status: body.status,
        p_comentario: body.comentario || null,
        p_user_id: user.data.user.id
    });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return { message: 'Inscrição avaliada com sucesso' };
});
