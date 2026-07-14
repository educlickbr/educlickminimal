import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    if (!query.email) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email é obrigatório'
        })
    }

    const client = await serverSupabaseClient(event)

    const { data, error } = await (client.rpc as any)('nxt_checar_email_expandido', {
        p_email: query.email
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }

    return data?.[0] || null
})
