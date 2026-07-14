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
    const { id_atribuicao, vigencia_inicio } = body

    if (!id_atribuicao) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campo obrigatório: id_atribuicao'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        const { data: atribuicao, error: findError } = await (client.from('bolsa_atribuicoes') as any)
            .select('id, id_matricula, id_edital, vigencia_inicio, vigencia_fim')
            .eq('id', id_atribuicao)
            .single()

        if (findError || !atribuicao) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Suplência não encontrada'
            })
        }

        if (atribuicao.vigencia_inicio) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Esta atribuição já foi promovida'
            })
        }

        if (atribuicao.vigencia_fim) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Não é possível promover atribuição encerrada'
            })
        }

        const inicio = typeof vigencia_inicio === 'string' && vigencia_inicio.trim().length > 0
            ? vigencia_inicio
            : new Date().toISOString().slice(0, 19)

        // Garante apenas uma atribuição ativa por matrícula+edital.
        const now = Date.now()
        const { data: existingAtivoRows } = await (client.from('bolsa_atribuicoes') as any)
            .select('id, vigencia_fim')
            .eq('id_matricula', atribuicao.id_matricula)
            .eq('id_edital', atribuicao.id_edital)
            .neq('id', id_atribuicao)
            .not('vigencia_inicio', 'is', null)

        const hasAtivo = Array.isArray(existingAtivoRows) && existingAtivoRows.some((row: any) => {
            if (!row?.vigencia_fim) return true
            const fim = new Date(row.vigencia_fim).getTime()
            return Number.isFinite(fim) && fim > now
        })

        if (hasAtivo) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Já existe atribuição ativa para este aluno neste edital'
            })
        }

        const { data, error } = await (client.from('bolsa_atribuicoes') as any)
            .update({
                vigencia_inicio: inicio,
                modificado_por: user.id,
                modificado_em: new Date().toISOString().slice(0, 19)
            })
            .eq('id', id_atribuicao)
            .select('id, id_matricula, id_edital, vigencia_inicio, vigencia_fim')
            .single()

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Erro ao promover suplência'
            })
        }

        return {
            success: true,
            data
        }
    } catch (err: any) {
        console.error('Erro ao promover suplência:', err)
        if (err.statusCode) throw err
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Erro ao promover suplência'
        })
    }
})
