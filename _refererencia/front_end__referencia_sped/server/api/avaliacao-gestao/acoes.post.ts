import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    // Excluir critério
    if (body.excluir) {
        const { error } = await client.rpc("avl_excluir_criterio", {
            p_id: body.id,
        } as any);
        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message });
        }
        return { ok: true };
    }

    // Vincular/desvincular turma
    const { error } = await client.rpc("avl_vincular_turma", {
        p_id_avaliacao: body.id_avaliacao,
        p_id_turma: body.id_turma,
        p_desvincular: body.desvincular ?? false,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { ok: true };
});
