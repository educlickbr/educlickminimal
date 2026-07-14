import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    let userId = body.id_usuario;

    // If no userId in body, resolve from session
    if (!userId) {
        const user = await serverSupabaseUser(event);
        if (user) {
            const authId = user.id || (user as any).sub;
            const { data: profile } = await (client.rpc as any)("get_user_expandido", {
                p_auth_id: authId,
            });
            userId = profile?.user_expandido_id;
        }
    }

    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Could not resolve user_expandido_id",
        });
    }

    // Body: { id_usuario, id_produto, quantidade, data_retirada, data_devolucao }

    const { data, error } = await client.rpc("nxt_create_reserva_batch_v2", {
        p_id_usuario: userId,
        p_id_produto: body.id_produto,
        p_quantidade: body.quantidade,
        p_data_retirada: body.data_retirada,
        p_data_devolucao: body.data_devolucao,
    } as any);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return data;
});
