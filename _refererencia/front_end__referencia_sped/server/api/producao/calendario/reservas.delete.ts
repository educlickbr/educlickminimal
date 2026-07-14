import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    const client = await serverSupabaseClient(event);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    // Cloudflare Edge compatibility: Read from Query Params first for DELETE
    const query = getQuery(event);
    let id = query.id as string;

    if (!id) {
        // Fallback to body attempt (safe catch)
        try {
            const body = await readBody(event);
            id = body?.id;
        } catch (e) {
            // Body might be empty/invalid on DELETE
        }
    }

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: "Missing ID" });
    }

    const { error } = await client.rpc("nxt_delete_reserva_sala", {
        p_id: id,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { success: true };
});
