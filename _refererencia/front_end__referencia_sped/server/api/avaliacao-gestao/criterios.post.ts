import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    const { data: dataCriterios, error } = await client.rpc("avl_upsert_criterio", {
        p_id_avaliacao: body.id_avaliacao,
        p_criterio: body.criterio,
        p_ordem: body.ordem ?? 0,
        p_id: body.id ?? null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    // Após salvar/atualizar o critério que veio no request, garante que existe o "Conceito Final"
    const { data: existingConceitoFinal, error: errCheck } = await client.rpc("avl_get_criterios", {
        p_id_avaliacao: String(body.id_avaliacao),
    } as any) as { data: any[] | null, error: any };

    if (!errCheck && existingConceitoFinal) {
        const hasConceitoFinal = existingConceitoFinal.some((c: any) => c.criterio === "Conceito Final");
        if (!hasConceitoFinal) {
            await client.rpc("avl_upsert_criterio", {
                p_id_avaliacao: body.id_avaliacao,
                p_criterio: "Conceito Final",
                p_ordem: 99,
                p_id: null,
            } as any);
        }
    }

    return dataCriterios;
});
