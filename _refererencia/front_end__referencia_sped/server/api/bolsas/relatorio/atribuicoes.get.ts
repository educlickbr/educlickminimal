import { serverSupabaseClient } from '#supabase/server'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const ano_semestre = Array.isArray(query.ano_semestre) ? query.ano_semestre[0] : query.ano_semestre
    const mesRaw = Array.isArray(query.mes) ? query.mes[0] : query.mes
    const id_edital = Array.isArray(query.id_edital) ? query.id_edital[0] : query.id_edital
    const id_turma = Array.isArray(query.id_turma) ? query.id_turma[0] : query.id_turma
    const mes = Number(mesRaw)
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    if (!ano_semestre || Number.isNaN(mes) || mes < 1 || mes > 12) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ano_semestre e mes são obrigatórios'
        })
    }

    try {
        const client = await serverSupabaseClient(event)
        const { data, error } = await (client as any).rpc(
            'nxt_get_relatorio_atribuicoes_bolsas',
            {
                p_ano_semestre: ano_semestre,
                p_mes: mes,
                p_id_edital: id_edital || null,
                p_id_turma: id_turma || null
            }
        )

        if (error) {
            throw error
        }

        return {
            success: true,
            data: data || []
        }
    } catch (err: any) {
        console.error('[relatorio] Erro ao buscar relatório:', err)
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Erro ao buscar relatório de atribuições'
        })
    }
})
