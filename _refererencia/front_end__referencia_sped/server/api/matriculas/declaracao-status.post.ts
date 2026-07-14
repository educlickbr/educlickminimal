import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id_declaracao, aprovado } = body

    if (!id_declaracao || aprovado === undefined) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da declaração e status (aprovado) são obrigatórios.'
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

    const { error } = await client.rpc('nxt_update_declaracao_status', {
        p_id_declaracao: id_declaracao,
        p_aprovado: aprovado
    } as any)

    if (error) {
        console.error('Erro ao atualizar status da declaração - RPC Error:', JSON.stringify(error, null, 2))
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao atualizar status da declaração: ${error.message}`
        })
    }

    return { success: true, message: `Declaração ${aprovado ? 'aprovada' : 'reprovada'} com sucesso.` }
})
