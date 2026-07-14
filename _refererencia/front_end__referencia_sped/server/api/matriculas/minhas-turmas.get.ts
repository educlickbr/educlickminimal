
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

    // Get user_expandido_id from the session metadata if available, 
    // or we might need to fetch it. Ideally, the frontend passes it or we get it from context.
    // However, looking at other endpoints, we often trust the frontend or get it from a 'me' call. 
    // But for security, we should get it from the logged in user.
    // Let's check how `api/me` does it or if we can rely on `client.rpc`.
    // Actually, `nxt_get_minhas_turmas` takes `p_id_user_expandido`. 
    // To be safe, we should probably get the user_expandido_id associated with the auth.uid().
    // Use `nxt_get_user_expandido` or similar if exists, or just query user_expandido table.
    // For now, let's assume the frontend passes the ID for flexibility (like admins viewing content), 
    // OR if strict, we fetch it. 
    // The user request says: "então o front manda o user expandido do aluno (que está no pinia)"
    // So I will accept a query param `id_user_expandido`.

    const query = getQuery(event);
    const id_user_expandido = query.id_user_expandido as string;

    if (!id_user_expandido) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_user_expandido is required'
        });
    }

    const { data, error } = await (client.rpc as any)('nxt_get_minhas_turmas', {
        p_id_user_expandido: id_user_expandido
    });

    if (error) {
        console.error('Error fetching minhas turmas:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});
