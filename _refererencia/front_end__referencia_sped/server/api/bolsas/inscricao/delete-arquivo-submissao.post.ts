
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
    const { id_submissao } = body;

    if (!id_submissao) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing id_submissao",
        });
    }

    const client = await serverSupabaseClient(event);
    const authorizedUserId = user.id;

    console.log('[DEBUG] deleting file for submission:', id_submissao);
    console.log('[DEBUG] user doing operation:', authorizedUserId);

    // 3. Fetch current file path
    const { data: submission, error: fetchError } = await (client as any)
        .from('bolsa_submissoes')
        .select('arquivo_cad_unico')
        .eq('id', id_submissao)
        .single();

    if (fetchError || !submission) {
        console.error('[DEBUG] Fetch Error:', fetchError);
        console.error('[DEBUG] Submission result:', submission);
        throw createError({
            statusCode: 404,
            statusMessage: "Submission not found. Details: " + (fetchError?.message || "No data returned"),
        });
    }

    const filePath = submission.arquivo_cad_unico;

    // If no file, just return success (idempotent)
    if (!filePath) {
        return { success: true, message: "No file to delete" };
    }

    // 4. Delete from Bunny.net
    const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
    const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const REGION = process.env.BUNNY_REGION || "br";
    const hostname = `${REGION}.storage.bunnycdn.com`;

    if (!STORAGE_ZONE_NAME || !ACCESS_KEY) {
        throw createError({
            statusCode: 500,
            statusMessage: "Server misconfiguration: Storage keys missing",
        });
    }

    // filePath comes as "folder/filename.ext" OR just "filename.ext" (new logic).
    // Bunny needs full URL for DELETE.
    // e.g. https://storage.bunnycdn.com/zone/editais/file

    let normalizedPath = filePath;
    if (!filePath.startsWith('editais/')) {
        normalizedPath = `editais/${filePath}`;
    }

    const url = `https://${hostname}/${STORAGE_ZONE_NAME}/${normalizedPath}`;

    try {
        const bunnyRes = await fetch(url, {
            method: "DELETE",
            headers: {
                "AccessKey": ACCESS_KEY,
            },
        });

        // Bunny returns 200 OK on success. 404 if not found (which is fine for us).
        if (!bunnyRes.ok && bunnyRes.status !== 404) {
            console.error("Bunny Delete Failed:", bunnyRes.status, await bunnyRes.text());
            // We continue to update DB even if Bunny fails? 
            // Ideally yes, to keep DB consistent with user intent, but maybe warn.
            // For strict consistency, we might throw. Let's throw to be safe.
            throw new Error("Failed to delete from storage provider");
        }
    } catch (e) {
        console.error("Bunny Delete Exception:", e);
        throw createError({
            statusCode: 502,
            statusMessage: "Failed to delete file from storage",
        });
    }

    // 5. Update Database via RPC
    // Call RPC: nxt_bolsa_submissao_atualizar_arquivo
    // Parameters: p_id_submissao, p_caminho_arquivo (null for delete)
    // User ID is handled by RPC using auth.uid()

    console.log('[DEBUG] Calling RPC with:', { p_id_submissao: id_submissao, p_caminho_arquivo: null });

    const { error: rpcError } = await (client as any).rpc(
        'nxt_bolsa_submissao_atualizar_arquivo',
        {
            p_id_submissao: id_submissao,
            p_caminho_arquivo: null
        }
    );

    if (rpcError) {
        throw createError({
            statusCode: 500,
            statusMessage: "Database update failed: " + rpcError.message,
        });
    }

    return { success: true, message: "File deleted successfully" };
});
