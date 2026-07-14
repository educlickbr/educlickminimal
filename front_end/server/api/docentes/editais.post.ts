import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/editais
 * Body: { id_entidade, nome, descricao, data_ini, data_fim, status, id_form_config, id? }
 *
 * Cria ou atualiza um edital.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const auth = event.context.user;

    const { data, error } = await client.rpc("aca_upsert_edital_docente", {
        p_id_entidade: body.id_entidade,
        p_nome: body.nome,
        p_descricao: body.descricao || null,
        p_data_ini: body.data_ini || null,
        p_data_fim: body.data_fim || null,
        p_status: body.status || "ativo",
        p_id_form_config: body.id_form_config || null,
        p_criado_por: auth?.id || null,
        p_id: body.id || null,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
