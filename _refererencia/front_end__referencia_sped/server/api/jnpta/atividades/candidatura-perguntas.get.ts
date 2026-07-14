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
    const id_edital = query.edital as string;
    const id_candidatura = query.candidatura as string;

    if (!id_edital || !id_candidatura) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing edital or candidatura parameters",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)("nxt_jnpta_form_get_atividades_perguntas", {
            p_id_edital: id_edital,
            p_id_candidatura: id_candidatura,
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to load perguntas de atividades",
            });
        }

        if (!data?.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || "Falha ao carregar perguntas de atividades",
            });
        }

        return {
            ok: true,
            atividades: data?.atividades || [],
        };
    } catch (err: any) {
        console.error("[/api/jnpta/atividades/candidatura-perguntas GET] Error:", err);
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err.message || "Internal server error",
        });
    }
});
