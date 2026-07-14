import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const client = await serverSupabaseClient(event)

    const { data, error } = await (client.rpc as any)('nxt_get_exportacao_excel_bolsas_v3', {
        p_id_edital: query.id_edital
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }

    return data
})
