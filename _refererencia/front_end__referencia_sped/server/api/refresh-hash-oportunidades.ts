import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

/**
 * Endpoint para renovar hash do Bunny.net para a pasta /oportunidades/
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        return {
            hash_base: null,
            error: 'User not authenticated'
        };
    }

    const client = await serverSupabaseClient(event);
    const userId = user.id || (user as any).sub;

    try {
        // Using 'oportunidades' as defined in upload logic
        const { data: hashData, error: hashError } = await client.functions.invoke("hash_app", {
            body: {
                user_id: userId,
                path: "/oportunidades/",
            },
        });

        if (hashError) {
            console.error("Hash generation error:", hashError);
            return {
                hash_base: null,
                error: hashError.message
            };
        }

        return {
            hash_base: hashData?.url || null,
            refreshed_at: new Date().toISOString()
        };
    } catch (err) {
        console.error("Error in /api/refresh-hash-oportunidades:", err);
        return {
            hash_base: null,
            error: (err as any).message
        };
    }
});
