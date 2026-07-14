import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/gerar-convite
 * Body: { id_entidade, email? }
 *
 * Gera um link único de autocadastro para docente.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    const { data, error } = await client.rpc("aca_gerar_convite_docente", {
        p_id_entidade: body.id_entidade,
        p_email: body.email || null,
        p_criado_por: auth?.id || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
