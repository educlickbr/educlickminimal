import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

/**
 * Endpoint para upload de documentos (arquivo) na aba "Documentos Empresa"
 * 
 * Body: { fileBase64, fileName (UUID), originalName, slug }
 * Salva em jnpta_respostas_formulario:
 * - resposta_texto: UUID do arquivo (ex: '550e8400-e29b-41d4-a716-446655440000.pdf')
 * - resposta_json: { nome_original: 'meu_documento.pdf' }
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody(event);
    const { fileBase64, fileName, originalName, slug, idCandidatura } = body;

    if (!fileBase64 || !fileName || !originalName || !slug || !idCandidatura) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required fields: fileBase64, fileName, originalName, slug, idCandidatura"
        });
    }

    const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
    const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const REGION = process.env.BUNNY_REGION || "br";

    if (!STORAGE_ZONE_NAME || !ACCESS_KEY) {
        throw createError({
            statusCode: 500,
            statusMessage: "Server misconfiguration: Storage keys missing"
        });
    }

    try {
        // 1. Convert base64 to binary and upload to Bunny
        const binaryData = Buffer.from(fileBase64, "base64");
        const hostname = `${REGION}.storage.bunnycdn.com`;
        const normalizedPath = "jnpta_documentos";
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
            throw createError({
                statusCode: 502,
                statusMessage: `Bunny upload failed: ${errorText}`
            });
        }

        // 2. Save in jnpta_respostas_formulario via RPC
        const client = await serverSupabaseClient(event);

        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc("nxt_jnpta_form_upsert_respostas_principal", {
            p_id_candidatura: idCandidatura,
            p_respostas: [
                {
                    slug,
                    resposta_texto: fileName,
                    resposta_json: { nome_original: originalName }
                }
            ]
        }) as any;

        if (error || !data?.ok) {
            throw createError({
                statusCode: 500,
                statusMessage: data?.erro || error?.message || "Failed to save document response"
            });
        }

        return {
            ok: true,
            fileName,
            originalName
        };
    } catch (err: any) {
        console.error("Error in /api/jnpta/form/upload-doc:", err);
        throw createError({
            statusCode: 500,
            statusMessage: `Upload failed: ${err.message}`
        });
    }
});
