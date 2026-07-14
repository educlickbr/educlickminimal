import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const body = await readBody(event);
    const id = String(body?.id || '').trim();
    const filePath = String(body?.filePath || '').trim();

    if (!id || !filePath) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields (id, filePath)',
        });
    }

    const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
    const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const REGION = process.env.BUNNY_REGION || 'br';

    if (!STORAGE_ZONE_NAME || !ACCESS_KEY) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Server misconfiguration: Storage keys missing',
        });
    }

    const normalizedPath = filePath.replace(/^\/+/, '');
    const hostname = `${REGION}.storage.bunnycdn.com`;
    const bunnyUrl = `https://${hostname}/${STORAGE_ZONE_NAME}/${normalizedPath}`;

    try {
        const bunnyRes = await fetch(bunnyUrl, {
            method: 'DELETE',
            headers: {
                AccessKey: ACCESS_KEY,
            },
        });

        // Bunny can return 404 if file was already removed; keep flow idempotent.
        if (!bunnyRes.ok && bunnyRes.status !== 404) {
            const errorText = await bunnyRes.text();
            throw createError({
                statusCode: 502,
                statusMessage: `Bunny delete failed: ${errorText}`,
            });
        }
    } catch (err: any) {
        if (err?.statusCode) throw err;
        throw createError({
            statusCode: 502,
            statusMessage: `Upload Service Failed: ${err?.message || 'Delete failed'}`,
        });
    }

    const client = await serverSupabaseClient(event);
    const { error } = await (client
        .from('avl_atividade_recuperacao') as any)
        .update({ arquivo_apoio: null } as any)
        .eq('id', id);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { success: true };
});
