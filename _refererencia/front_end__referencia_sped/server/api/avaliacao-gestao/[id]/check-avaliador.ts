import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    // Pegar ID da avaliação via rotas /api/educacional/avaliacao/[id]/check-avaliador
    const avaliacaoId = getRouterParam(event, 'id')

    if (!avaliacaoId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da Avaliação Ausente',
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        const { data, error } = await client
            .rpc('nxt_avl_check_avaliador', {
                p_user_id: user.id,
                p_id_avaliacao: avaliacaoId
            } as any)

        if (error) throw error

        return {
            isAvaliador: data || false
        }

    } catch (error: any) {
        console.error('Erro ao checar se usuário é avaliador:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao checar se o usuário é avaliador.',
        })
    }
})
