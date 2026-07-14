import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        return {
            hash_base: null,
            error: 'User not authenticated',
        };
    }

    const client = await serverSupabaseClient(event);
    const userId = user.id || (user as any).sub;

    try {
        const { data: hashData, error: hashError } = await client.functions.invoke('hash_app', {
            body: {
                user_id: userId,
                path: '/avaliacao/',
            },
        });

        if (hashError) {
            return {
                hash_base: null,
                error: hashError.message,
            };
        }

        return {
            hash_base: hashData?.url || null,
            refreshed_at: new Date().toISOString(),
        };
    } catch (err) {
        return {
            hash_base: null,
            error: (err as any).message,
        };
    }
});
