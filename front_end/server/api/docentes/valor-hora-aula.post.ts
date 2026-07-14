import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/valor-hora-aula
 * Body: { id, valor }  (valor em centavos, ex: 5000 = R$ 50,00)
 *
 * Atualiza o valor da hora/aula de um docente.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    const { data, error } = await client.rpc("aca_set_valor_hora_aula", {
        p_id: body.id,
        p_valor: Math.round(body.valor || 0),
        p_modificado_por: auth?.id || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
