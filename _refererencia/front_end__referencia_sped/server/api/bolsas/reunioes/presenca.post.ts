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
    const { id_reuniao, id_atribuicao, presenca, observacoes } = body
    const allowedStatuses = ['presente', 'falta', 'abonada', 'justificada']

    // Validação
    if (!id_reuniao || !id_atribuicao || presenca === undefined) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campos obrigatórios: id_reuniao, id_atribuicao e presenca'
        })
    }

    if (presenca !== null && !allowedStatuses.includes(presenca)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'presenca deve ser um dos valores: presente, falta, abonada, justificada ou null'
        })
    }

    const client = await serverSupabaseClient(event)

    try {
        // Verificar se já existe registro de presença
        const { data: existing } = await (client.from('bolsa_reunioes_presenca') as any)
            .select('id')
            .eq('id_reuniao', id_reuniao)
            .eq('id_atribuicao', id_atribuicao)
            .single()

        if (existing) {
            // Atualizar
            const { data, error } = await (client.from('bolsa_reunioes_presenca') as any)
                .update({
                    presenca,
                    observacoes,
                    modificado_por: user.id,
                    modificado_em: new Date().toISOString().slice(0, 19)
                })
                .eq('id_reuniao', id_reuniao)
                .eq('id_atribuicao', id_atribuicao)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar presença:', error)
                throw createError({
                    statusCode: 500,
                    statusMessage: error.message
                })
            }

            return { success: true, data, isUpdate: true }
        } else {
            // Inserir
            const { data, error } = await (client.from('bolsa_reunioes_presenca') as any)
                .insert({
                    id_reuniao,
                    id_atribuicao,
                    presenca,
                    observacoes,
                    criado_por: user.id
                })
                .select()
                .single()

            if (error) {
                console.error('Erro ao criar presença:', error)
                throw createError({
                    statusCode: 500,
                    statusMessage: error.message
                })
            }

            return { success: true, data, isUpdate: false }
        }
    } catch (err: any) {
        console.error('Erro:', err)
        if (err.statusCode) throw err
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Erro ao processar presença'
        })
    }
})
