import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/r2/sign-public?id=UUID
 *
 * Gera signed URL pública para download de currículo.
 * Não exige autenticação (uso na página pública).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const id = query.id as string;

    if (!id) {
        throw createError({ statusCode: 400, message: "ID do arquivo é obrigatório." });
    }

    const { data, error } = await (client as any)
        .from("global_arquivos")
        .select("path, bucket")
        .eq("id", id)
        .single();

    if (error || !data) {
        throw createError({ statusCode: 404, message: "Arquivo não encontrado." });
    }

    // Gera signed URL
    const { data: signedData, error: signError } = await (client as any)
        .storage
        .from(data.bucket || "global")
        .createSignedUrl(data.path, 3600); // 1 hora

    if (signError || !signedData?.signedUrl) {
        throw createError({ statusCode: 500, message: "Erro ao gerar link." });
    }

    return { success: true, signedUrl: signedData.signedUrl };
});
