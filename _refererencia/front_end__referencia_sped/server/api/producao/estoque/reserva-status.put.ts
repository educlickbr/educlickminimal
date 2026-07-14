import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    // Body: { ids: string[], status: string }

    const updates = body.ids.map((id: string) =>
        client.rpc("nxt_update_reserva_status_v2", {
            p_id_reserva: id,
            p_novo_status: body.status,
        } as any)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const error = results.find(r => r.error)?.error;
    const data = results.map(r => r.data);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return data;
});
