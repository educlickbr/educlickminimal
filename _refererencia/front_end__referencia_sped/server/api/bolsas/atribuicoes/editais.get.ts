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

    if (!ano_semestre) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Parâmetro ano_semestre obrigatório'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        const { data, error } = await client
            .from('bolsa_editais')
            .select('id, titulo, ano_semestre, data_inicio, data_fim, is_publicado, publicado_em')
            .eq('ano_semestre', ano_semestre)
            .order('data_inicio', { ascending: false })

        if (error) {
            console.error('Erro ao buscar editais:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message
            })
        }

        return data || []
    } catch (err: any) {
        console.error('Erro:', err)
        if (err.statusCode) throw err
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Erro ao buscar editais'
        })
    }
})
