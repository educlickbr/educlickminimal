import { fromZonedTime } from 'date-fns-tz'
import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
const TIMEZONE = 'America/Sao_Paulo'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id_declaracao, data_matricula, data_matricula_modificada } = body

    if (!id_declaracao || data_matricula_modificada === undefined) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da declaração e o indicador de alteração são obrigatórios.'
        })
    }

    if (data_matricula_modificada === true && (!data_matricula || !/^\d{4}-\d{2}-\d{2}$/.test(data_matricula))) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Informe uma data de matrícula válida no formato YYYY-MM-DD.'
        })
    }

    const client = await serverSupabaseClient(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Usuário não autenticado.'
        })
    }

    const normalizedDate = data_matricula_modificada === true
        ? fromZonedTime(`${data_matricula} 00:00:00`, TIMEZONE).toISOString()
        : null

    const { error } = await client.rpc('nxt_update_declaracao_data_matricula', {
        p_id_declaracao: id_declaracao,
        p_data_matricula: normalizedDate,
        p_data_matricula_modificada: data_matricula_modificada
    } as any)

    if (error) {
        console.error('Erro ao atualizar data de matrícula da declaração - RPC Error:', JSON.stringify(error, null, 2))
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao atualizar data de matrícula da declaração: ${error.message}`
        })
    }

    return {
        success: true,
        message: data_matricula_modificada
            ? 'Data de matrícula atualizada com sucesso.'
            : 'Data de matrícula restaurada com sucesso.'
    }
})