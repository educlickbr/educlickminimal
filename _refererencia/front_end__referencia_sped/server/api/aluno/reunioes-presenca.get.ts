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
    const { id_matricula, ano_semestre } = query

    if (!id_matricula) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_matricula é obrigatório'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        const { data, error } = await (client.rpc as any)('nxt_get_presenca_reunioes_aluno', {
            p_id_matricula: id_matricula,
            p_ano_semestre: ano_semestre || new Date().getFullYear() + 'Is'
        })

        if (error) throw error

        return data ?? { is_bolsista: false, data: [] }
    } catch (error: any) {
        console.error('Erro ao buscar presença em reuniões:', error)

        return {
            is_bolsista: false,
            data: []
        }
    }
})
