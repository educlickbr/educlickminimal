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
    const { id_matricula, id_edital, vigencia_inicio } = body
    const vigenciaInicioNormalizada = vigencia_inicio || null

    // Validação
    if (!id_matricula || !id_edital) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campos obrigatórios: id_matricula, id_edital'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        // Regra de negócio: apenas uma linha por matrícula+edital.
        const { data: existingRows, error: existingError } = await client
            .from('bolsa_atribuicoes')
            .select('id')
            .eq('id_matricula', id_matricula)
            .eq('id_edital', id_edital)
            .limit(1)

        if (existingError) {
            throw createError({
                statusCode: 500,
                statusMessage: existingError.message || 'Erro ao validar atribuição existente'
            })
        }

        if (Array.isArray(existingRows) && existingRows.length > 0) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Já existe atribuição para este aluno neste edital. Edite/encerre/promova a linha existente.'
            })
        }

        // Inserir nova atribuição
        const { data, error } = await (client.from('bolsa_atribuicoes') as any)
            .insert({
                id_matricula,
                id_edital,
                vigencia_inicio: vigenciaInicioNormalizada,
                criado_por: user.id
            })
            .select()
            .single()

        if (error) {
            console.error('Erro ao criar atribuição:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Erro ao criar atribuição'
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
            statusMessage: err.message || 'Erro ao processar requisição'
        })
    }
})
