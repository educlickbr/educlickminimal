import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const query = getQuery(event);
    const idGrupo = typeof query.id_grupo === "string" ? query.id_grupo : null;

    if (!idGrupo) {
        throw createError({ statusCode: 400, statusMessage: "Missing id_grupo" });
    }

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data: ctxData, error: ctxError } = await client.rpc("nxt_jnpta_form_get_or_create_draft", {
            p_id_grupo: idGrupo,
        }) as any;

        if (ctxError) {
            throw createError({ statusCode: 500, statusMessage: ctxError.message || "Failed to resolve form context" });
        }

        if (!ctxData?.ok || !ctxData?.id_candidatura) {
            throw createError({ statusCode: 400, statusMessage: ctxData?.erro || "Failed to resolve candidatura" });
        }

        const idCandidatura = ctxData.id_candidatura;

        // @ts-expect-error - RPC types need to be regenerated
        const { data: formData, error: formError } = await client.rpc("nxt_jnpta_form_get", {
            p_id_candidatura: idCandidatura,
        }) as any;

        if (formError) {
            throw createError({ statusCode: 500, statusMessage: formError.message || "Failed to load form" });
        }

        if (!formData?.ok) {
            throw createError({ statusCode: 403, statusMessage: formData?.erro || "Not allowed" });
        }

        return {
            ...formData,
            id_candidatura: idCandidatura,
            id_jornada: ctxData.id_jornada,
            id_grupo: ctxData.id_grupo,
        };
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
