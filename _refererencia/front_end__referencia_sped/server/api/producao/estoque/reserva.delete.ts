import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);

    // IDs passed as query params (?ids=a&ids=b or ?ids=a,b).
    // Avoids reading body on DELETE which throws in Cloudflare Workers.
    const query = getQuery(event);
    const raw = query.ids;
    let ids: string[];

    if (Array.isArray(raw)) {
        ids = (raw as string[]).filter(Boolean);
    } else if (typeof raw === 'string' && raw.trim()) {
        ids = raw.split(',').map((id) => id.trim()).filter(Boolean);
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Missing ids' });
    }

    const { error } = await client.rpc('nxt_delete_reserva', {
        p_ids: ids,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { success: true };
});
