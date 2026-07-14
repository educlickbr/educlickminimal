import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    const { id_processo, matricula_suplente, dt_ini_mat_sup, dt_fim_mat_sup } = body;

    if (!id_processo) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do processo é obrigatório'
        });
    }

    const { data, error } = await client.rpc('nxt_upsert_matricula_excepcional', {
        p_id_processo: id_processo,
        p_matricula_suplente: matricula_suplente,
        p_dt_ini_mat_sup: matricula_suplente ? dt_ini_mat_sup : null,
        p_dt_fim_mat_sup: matricula_suplente ? dt_fim_mat_sup : null
    });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});