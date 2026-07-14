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
    const { id_atribuicao, vigencia_fim, motivo_inativacao } = body

    if (!id_atribuicao || !vigencia_fim || !motivo_inativacao?.trim()) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campos obrigatórios: id_atribuicao, vigencia_fim e motivo_inativacao'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        const { data: atribuicao, error: findError } = await (client.from('bolsa_atribuicoes') as any)
            .select('id, vigencia_inicio, vigencia_fim')
            .eq('id', id_atribuicao)
            .single()

        if (findError || !atribuicao) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Atribuição não encontrada'
            })
        }

        const inicio = new Date(atribuicao.vigencia_inicio)
        const fim = new Date(vigencia_fim)

        if (Number.isNaN(fim.getTime())) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Data de encerramento inválida'
            })
        }

        if (fim < inicio) {
            throw createError({
                statusCode: 400,
                statusMessage: 'A data de encerramento não pode ser menor que a vigência de início'
            })
        }

        const { data, error } = await (client.from('bolsa_atribuicoes') as any)
            .update({
                vigencia_fim: fim.toISOString().slice(0, 19),
                motivo_inativacao: String(motivo_inativacao).trim(),
                modificado_por: user.id,
                modificado_em: new Date().toISOString().slice(0, 19)
            })
            .eq('id', id_atribuicao)
            .select('id, id_matricula, id_edital, vigencia_inicio, vigencia_fim, motivo_inativacao')
            .single()

        if (error) {
            console.error('Erro ao encerrar atribuição:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Erro ao encerrar bolsa'
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
            statusMessage: err.message || 'Erro ao processar encerramento'
        })
    }
})
