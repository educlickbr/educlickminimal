import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/matriculas/inativar
 *
 * Altera o status de uma matrícula (inativar, cancelar, reativar).
 * Body: { id: UUID, status: 'inativa' | 'cancelada' | 'ativa' }
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const id = body?.id as string;
    const status = (body?.status as string) || "inativa";

    if (!id) {
        throw createError({
            statusCode: 400,
            message: "id é obrigatório",
        });
    }

    const { data, error } = await client.rpc("aca_inativar_matricula", {
        p_id: id,
        p_status: status,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
