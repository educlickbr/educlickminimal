export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const fileBase64 = String(body?.fileBase64 || '').trim();
    const fileName = String(body?.fileName || '').trim();
    const originalName = String(body?.originalName || fileName).trim();

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
        console.error('Bunny.net keys missing in .env');
        throw createError({
            statusCode: 500,
            statusMessage: 'Server misconfiguration: Storage keys missing',
        });
    }

    const binaryData = Buffer.from(fileBase64, 'base64');
    const hostname = `${REGION}.storage.bunnycdn.com`;
    const normalizedPath = `avaliacao/atividades`;
    const safeFileName = encodeURIComponent(fileName);
    const bunnyUrl = `https://${hostname}/${STORAGE_ZONE_NAME}/${normalizedPath}/${safeFileName}`;

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
            console.error('Bunny Upload Failed:', bunnyRes.status, errorText);
            throw new Error(`Bunny Storage Error: ${errorText}`);
        }
    } catch (err: any) {
        console.error('Server-Side Upload Exception:', err);
        throw createError({
            statusCode: 502,
            statusMessage: `Upload Service Failed: ${err.message}`,
        });
    }

    return {
        success: true,
        fileName: safeFileName,
        originalName,
        path: `${normalizedPath}/${safeFileName}`,
    };
});