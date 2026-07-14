
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    // 1. Auth Check
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    // 2. Read Body
    const body = await readBody(event);
    const { fileBase64, fileName } = body;

    if (!fileBase64 || !fileName) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required fields (fileBase64, fileName)",
        });
    }

    // 3. Upload to Bunny.net Direct (Server-Side)
    const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
    const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const REGION = process.env.BUNNY_REGION || "br";

    if (!STORAGE_ZONE_NAME || !ACCESS_KEY) {
        console.error("Bunny.net keys missing in .env");
        throw createError({
            statusCode: 500,
            statusMessage: "Server misconfiguration: Storage keys missing",
        });
    }

    // Decode Base64 to Buffer
    const binaryData = Buffer.from(fileBase64, "base64");

    const hostname = `${REGION}.storage.bunnycdn.com`;
    // Using 'gestao_faltas' as requested for semantic organization
    const normalizedPath = "secretaria";

    // Ensure filename is safe
    const safeFileName = encodeURIComponent(fileName);

    const bunnyUrl =
        `https://${hostname}/${STORAGE_ZONE_NAME}/${normalizedPath}/${safeFileName}`;

    try {
        const bunnyRes = await fetch(bunnyUrl, {
            method: "PUT",
            headers: {
                "AccessKey": ACCESS_KEY,
                "Content-Type": "application/octet-stream",
            },
            body: binaryData,
        });

        if (!bunnyRes.ok) {
            const errorText = await bunnyRes.text();
            console.error("Bunny Upload Failed:", bunnyRes.status, errorText);
            throw new Error(`Bunny Storage Error: ${errorText}`);
        }
    } catch (err: any) {
        console.error("Server-Side Upload Exception:", err);
        throw createError({
            statusCode: 502,
            statusMessage: `Upload Service Failed: ${err.message}`,
        });
    }

    // 4. Return success and location (no DB save here, just return path/name)
    // The path stored in DB will be 'gestao_faltas/filename' or just 'filename' if we standardized the path in the app.
    // Storing full relative path is safer: `gestao_faltas/${safeFileName}`

    return {
        success: true,
        fileName: safeFileName,
        path: `${normalizedPath}/${safeFileName}`
    };
});
