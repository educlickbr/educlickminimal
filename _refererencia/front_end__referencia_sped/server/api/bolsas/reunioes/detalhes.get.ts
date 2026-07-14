import { serverSupabaseClient } from '#supabase/server'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    const query = getQuery(event)
    const ano_semestre = query.ano_semestre as string
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20

    if (!ano_semestre) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Parâmetro ano_semestre obrigatório'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        const { data, error } = await (client.rpc as any)('nxt_get_bolsa_reunioes_detalhes', {
            p_ano_semestre: ano_semestre,
            p_page: page,
            p_limit: limit
        })

        if (error) {
            console.error('Erro ao buscar reuniões:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message
            })
        }

        return data
    } catch (err: any) {
        console.error('Erro:', err)
        if (err.statusCode) throw err
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Erro ao buscar reuniões'
        })
    }
})
