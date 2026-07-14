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

    const body = await readBody(event)
    const { id_atribuicao } = body

    if (!id_atribuicao) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campo obrigatório: id_atribuicao'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        const { data: atribuicao, error: findError } = await (client.from('bolsa_atribuicoes') as any)
            .select('id, vigencia_fim')
            .eq('id', id_atribuicao)
            .single()

        if (findError || !atribuicao) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Atribuição não encontrada'
            })
        }

        if (!atribuicao.vigencia_fim) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Esta atribuição já está ativa'
            })
        }

        const { data, error } = await (client.from('bolsa_atribuicoes') as any)
            .update({
                vigencia_fim: null,
                motivo_inativacao: null,
                modificado_por: user.id,
                modificado_em: new Date().toISOString().slice(0, 19)
            })
            .eq('id', id_atribuicao)
            .select('id, id_matricula, id_edital, vigencia_inicio, vigencia_fim, motivo_inativacao')
            .single()

        if (error) {
            console.error('Erro ao reativar atribuição:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Erro ao reativar bolsa'
            })
        }

        return {
            success: true,
            data
        }
    } catch (err: any) {
        console.error('Erro:', err)
        if (err.statusCode) throw err
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Erro ao processar reativação'
        })
    }
})
