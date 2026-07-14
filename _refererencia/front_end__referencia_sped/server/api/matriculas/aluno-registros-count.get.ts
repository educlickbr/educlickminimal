import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    if (!query.id_aluno) {
        throw createError({
            statusCode: 400,
            statusMessage: 'O ID do aluno é obrigatório'
        })
    }

    const client = await serverSupabaseClient(event)

    const { data, error } = await (client.rpc as any)('nxt_mc_get_contagem_registros_aluno', {
        p_id_aluno: query.id_aluno
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar contagem de registros do aluno: ' + error.message
        })
    }

    return data
})
