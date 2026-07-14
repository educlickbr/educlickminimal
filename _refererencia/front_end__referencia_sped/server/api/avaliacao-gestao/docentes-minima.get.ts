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

    const query = getQuery(event)
    const busca = query.busca ? String(query.busca) : ''
    const limit = query.limit ? Number(query.limit) : 20

    const client = await serverSupabaseClient(event)

    try {
        const { data, error } = await client
            .rpc('nxt_avl_escolas_docentes_search', {
                p_busca: busca,
                p_limit: limit
            } as any)

        if (error) throw error

        return data || []

    } catch (error: any) {
        console.error('Erro ao buscar docentes avaliadores:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao buscar a lista reduzida de docentes.',
        })
    }
})
