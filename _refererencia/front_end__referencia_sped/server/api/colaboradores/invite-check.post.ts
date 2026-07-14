import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email } = body

    if (!email) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email é obrigatório'
        })
    }

    const client = await serverSupabaseClient(event)

    const { data, error } = await (client.rpc as any)('nxt_checar_status_convite', {
        p_email: email
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }

    const result = data?.[0] || null

    if (!result) {
        return {
            status: 'new',
            userData: null
        }
    }

    if (result.exists_in_auth && result.exists_in_user_expandido) {
        return {
            status: 'exists_full',
            userData: result
        }
    } else if (result.exists_in_auth && !result.exists_in_user_expandido) {
        return {
            status: 'exists_auth_only',
            userData: result
        }
    } else if (!result.exists_in_auth && result.exists_in_user_expandido) {
        return {
            status: 'exists_data_only',
            userData: result
        }
    } else {
        return {
            status: 'new',
            userData: result
        }
    }
})
