import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    // 1. Auth Check (Admin)
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    // 2. Read Body
    const body = await readBody(event);
    const { fileBase64, fileName, originalName, id_pergunta, id_turma, targetUserId } = body;

    // id_turma is OPTIONAL now
    if (!fileBase64 || !fileName || !id_pergunta || !targetUserId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required fields (fileBase64, fileName, id_pergunta, targetUserId)",
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
    // For consistency, keep the user path or whatever structure is used. 
    // The previous one used "usr".
    const normalizedPath = "usr";
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
        console.error("Server-Side Upload Exception:", err);
        throw createError({
            statusCode: 502,
            statusMessage: `Upload Service Failed: ${err.message}`,
        });
    }

    // 4. Save Metadata to DB via RPC (Admin context)
    const client = await serverSupabaseClient(event);

    // Construct p_respostas array
    const p_respostas = [{
        id_pergunta: id_pergunta,
        resposta: fileName, // The UUID filename
        nome_arquivo_original: originalName,
    }];

    // Call new RPC
    const { data, error } = await (client as any).rpc(
        "nxt_salvar_respostas_usuario",
        {
            p_id_usuario: null, // Rely on user_expandido_id
            p_respostas: p_respostas,
            p_user_expandido_id: targetUserId,
            p_id_turma: id_turma || null
        }
    );

    if (error) {
        console.error("RPC Error:", error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    if (data && data.sucesso === false) {
        throw createError({
            statusCode: 400,
            statusMessage: data.mensagem || "Erro ao salvar resposta no banco de dados.",
        });
    }

    return { success: true, fileName };
});
