import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
    const user = userData.user;

    const { data, error } = await client.rpc("nxt_avl_is_avaliador", {
        p_user_id: user.id,
    } as any);

    if (error) {
        console.error("[is-avaliador] Supabase RPC error:", error);
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { isAvaliador: data === true };
});
