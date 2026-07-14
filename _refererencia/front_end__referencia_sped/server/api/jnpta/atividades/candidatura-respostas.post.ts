import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const query = getQuery(event);
    const id_candidatura = query.candidatura as string;

    if (!id_candidatura) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing candidatura parameter",
        });
    }

    const body = await readBody(event);
    const respostas = body?.respostas;

    if (!Array.isArray(respostas)) {
        throw createError({
            statusCode: 400,
            statusMessage: "respostas must be an array",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_form_upsert_respostas_atividade", {
            p_id_candidatura: id_candidatura,
            p_respostas: respostas,
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to save respostas de atividades",
            });
        }

        if (!data?.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || "Falha ao salvar respostas de atividades",
            });
        }

        return {
            ok: true,
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/candidatura-respostas POST] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
