import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {

    // Return form structure for Collaborator Registration
    const { email, nome, sobrenome, processo, tipo } = getQuery(event)

    // Call the new RPC to get the dynamic form structure
    const client = await serverSupabaseClient(event)

    try {
        const { data, error } = await client.rpc('nxt_get_form_cadastro', {
            p_email: email ? String(email) : null,
            p_tipo_processo: processo ? String(processo) : null,
            p_tipo_candidatura: tipo ? String(tipo) : null
        } as any)

        if (error) {
            console.error('Error fetching form:', error)
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao carregar formulário de cadastro.'
            })
        }

        return data
    } catch (err: any) {
        console.error('API Error:', err)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao carregar formulário.'
        })
    }


})
