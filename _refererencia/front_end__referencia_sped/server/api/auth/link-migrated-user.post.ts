import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.email || !body.auth_user_id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email e auth_user_id são obrigatórios'
        })
    }

    const client = await serverSupabaseClient(event)

    // Vincular tudo via RPC (user_expandido + respostas + papeis)
    // A RPC busca o papel_id automaticamente do user_expandido
    const { data, error } = await (client.rpc as any)('nxt_vincular_user_expandido_auth', {
        p_email: body.email
    })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao vincular usuário: ${error.message}`
        })
    }

    return {
        success: true,
        data: data?.[0]
    }
})
