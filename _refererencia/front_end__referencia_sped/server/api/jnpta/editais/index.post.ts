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

    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need regeneration
        const { data, error } = await client.rpc("nxt_jnpta_editais_criar", {
            p_edital_titulo: body?.edital_titulo,
            p_edital_descricao: body?.edital_descricao,
            p_arquivo_edital: body?.arquivo_edital,
            p_ano_semestre: body?.ano_semestre,
            p_qual_tempo: body?.qual_tempo || null,
            p_dt_inicio: body?.dt_inicio,
            p_dt_fim: body?.dt_fim,
            p_publicado: !!body?.publicado,
        }) as any;

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to create edital",
            });
        }

        if (!data?.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || "Failed to create edital",
            });
        }

        return data;
    } catch (err: any) {
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err?.message || "Internal server error",
        });
    }
});
