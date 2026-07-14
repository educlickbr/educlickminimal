import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const id = getRouterParam(event, "id");
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: "ID do edital é obrigatório" });
    }

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need regeneration
        const { data, error } = await client.rpc("nxt_jnpta_editais_excluir", {
            p_id: id,
        }) as any;

        if (error) throw createError({ statusCode: 500, statusMessage: error.message });
        if (!data?.ok) throw createError({ statusCode: 400, statusMessage: data?.erro || "Falha ao excluir edital" });

        return data;
    } catch (err: any) {
        throw createError({
            statusCode: err?.statusCode || 500,
            statusMessage: err?.statusMessage || err?.message || "Internal server error",
        });
    }
});
