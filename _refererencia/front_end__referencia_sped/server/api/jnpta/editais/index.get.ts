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

    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const anoSemestre = query.ano_semestre as string | undefined;

    try {
        const { data, error } = await client.rpc("nxt_jnpta_editais_listar", {
            p_ano_semestre: anoSemestre || null
        } as any);

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to list editais",
            });
        }

        return {
            ok: true,
            editais: data || [],
        };
    } catch (err: any) {
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err?.message || "Internal server error",
        });
    }
});
