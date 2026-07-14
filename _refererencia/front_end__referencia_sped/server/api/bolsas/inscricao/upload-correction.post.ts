
import { serverSupabaseClient } from '#supabase/server';
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
    const { id_submissao, fileBase64, fileName } = body;

    if (!id_submissao || !fileBase64 || !fileName) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required fields",
        });
    }

    // 3. Upload to Bunny.net
    const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
    const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const REGION = process.env.BUNNY_REGION || "br";
    const hostname = `${REGION}.storage.bunnycdn.com`;
    const normalizedPath = "editais"; // Use same folder as original uploads

    if (!STORAGE_ZONE_NAME || !ACCESS_KEY) {
        throw createError({
            statusCode: 500,
            statusMessage: "Server misconfiguration: Storage keys missing",
        });
    }

    const binaryData = Buffer.from(fileBase64, "base64");
    const safeFileName = encodeURIComponent(fileName);
    const bunnyUrl = `https://${hostname}/${STORAGE_ZONE_NAME}/${normalizedPath}/${safeFileName}`;

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
        console.error("Upload Exception:", err);
        throw createError({
            statusCode: 502,
            statusMessage: `Upload Service Failed: ${err.message}`,
        });
    }

    const newFilePath = `${normalizedPath}/${safeFileName}`;

    // 4. Update Database via RPC
    const client = await serverSupabaseClient(event);
    const userId = user.id;

    const { error: rpcError } = await (client as any).rpc(
        'nxt_bolsa_submissao_atualizar_arquivo',
        {
            p_id_submissao: id_submissao,
            p_caminho_arquivo: safeFileName // Store only filename as requested
        }
    );

    if (rpcError) {
        // Try to cleanup file if DB update fails? 
        // For now, just error.
        throw createError({
            statusCode: 500,
            statusMessage: "Database update failed: " + rpcError.message,
        });
    }

    return {
        success: true,
        message: "File uploaded successfully",
        filePath: safeFileName
    };
});
