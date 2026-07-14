import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const body = await readBody(event);
    const { fileBase64, fileName } = body;

    if (!fileBase64 || !fileName) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields (fileBase64, fileName)',
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

    const binaryData = Buffer.from(fileBase64, 'base64');
    const hostname = `${REGION}.storage.bunnycdn.com`;
    const folder = 'avaliacao/entregas';
    const safeFileName = encodeURIComponent(fileName);
    const bunnyUrl = `https://${hostname}/${STORAGE_ZONE_NAME}/${folder}/${safeFileName}`;

    try {
        const bunnyRes = await fetch(bunnyUrl, {
            method: 'PUT',
            headers: {
                AccessKey: ACCESS_KEY,
                'Content-Type': 'application/octet-stream',
            },
            body: binaryData,
        });

        if (!bunnyRes.ok) {
            const errorText = await bunnyRes.text();
            throw new Error(`Bunny Storage Error: ${errorText}`);
        }
    } catch (err: any) {
        throw createError({
            statusCode: 502,
            statusMessage: `Upload Service Failed: ${err.message}`,
        });
    }

    return {
        success: true,
        path: `${folder}/${safeFileName}`,
    };
});
