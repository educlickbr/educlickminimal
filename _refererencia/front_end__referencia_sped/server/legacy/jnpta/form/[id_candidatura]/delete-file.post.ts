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
    const { fileName, categoria, chave_documento, id_integrante } = body;

    if (!categoria || !chave_documento) {
        throw createError({ statusCode: 400, statusMessage: "Missing categoria or chave_documento" });
    }

    const client = await serverSupabaseClient(event);

    // 1) Try edge delete if fileName provided
    if (fileName) {
        await client.functions.invoke("deletar_arquivos", {
            body: {
                fileName,
                pasta: "jnpta",
            },
        });
    }

    // 2) Nullify in DB
    // @ts-expect-error - RPC types need to be regenerated
    const { data, error } = await client.rpc("nxt_jnpta_form_delete_documento", {
        p_id_candidatura: idCandidatura,
        p_categoria: categoria,
        p_chave_documento: chave_documento,
        p_id_integrante: id_integrante || null,
        p_file_path: fileName || null,
    }) as any;

    if (error || !data?.ok) {
        throw createError({ statusCode: 500, statusMessage: data?.erro || error?.message || "Failed to delete document" });
    }

    return { ok: true };
});
