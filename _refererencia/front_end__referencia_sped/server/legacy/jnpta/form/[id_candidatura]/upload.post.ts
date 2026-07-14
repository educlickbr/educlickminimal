import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const idCandidatura = getRouterParam(event, "id_candidatura");
    if (!idCandidatura) {
        throw createError({ statusCode: 400, statusMessage: "Missing id_candidatura" });
    }

    const body = await readBody(event);
    const { fileBase64, fileName, originalName, categoria, chave_documento, id_integrante, mime_type, tamanho_bytes } = body;

    if (!fileBase64 || !fileName || !originalName || !categoria || !chave_documento) {
        throw createError({ statusCode: 400, statusMessage: "Missing required upload fields" });
    }

    const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
    const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const REGION = process.env.BUNNY_REGION || "br";

    if (!STORAGE_ZONE_NAME || !ACCESS_KEY) {
        throw createError({ statusCode: 500, statusMessage: "Server misconfiguration: Storage keys missing" });
    }

    const binaryData = Buffer.from(fileBase64, "base64");
    const hostname = `${REGION}.storage.bunnycdn.com`;
    const normalizedPath = "jnpta";
    const safeFileName = encodeURIComponent(fileName);
    const bunnyUrl = `https://${hostname}/${STORAGE_ZONE_NAME}/${normalizedPath}/${safeFileName}`;

    const bunnyRes = await fetch(bunnyUrl, {
        method: "PUT",
        headers: {
            AccessKey: ACCESS_KEY,
            "Content-Type": "application/octet-stream",
        },
        body: binaryData,
    });

    if (!bunnyRes.ok) {
        const errorText = await bunnyRes.text();
        throw createError({ statusCode: 502, statusMessage: `Upload failed: ${errorText}` });
    }

    const client = await serverSupabaseClient(event);

    // Save in documentos table
    // @ts-expect-error - RPC types need to be regenerated
    const { data, error } = await client.rpc("nxt_jnpta_form_upsert_documentos", {
        p_id_candidatura: idCandidatura,
        p_documentos: [
            {
                categoria,
                chave_documento,
                id_integrante: id_integrante || null,
                arquivo_path: fileName,
                arquivo_nome_original: originalName,
                mime_type: mime_type || null,
                tamanho_bytes: tamanho_bytes || null,
                metadata: { origem: "upload_api" },
            },
        ],
    }) as any;

    if (error || !data?.ok) {
        throw createError({ statusCode: 500, statusMessage: data?.erro || error?.message || "Failed to persist document" });
    }

    return { ok: true, fileName };
});
