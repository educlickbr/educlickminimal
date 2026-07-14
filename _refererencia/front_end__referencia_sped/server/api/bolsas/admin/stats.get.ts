import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const client = await serverSupabaseClient(event)

    const { data, error } = await (client.rpc as any)('nxt_get_bolsa_submissoes_stats', {
        p_ano_semestre: query.ano_semestre
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }

    return data
})
