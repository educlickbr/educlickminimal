import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const id_aluno = (query.id_aluno as string) || null
    const status = (query.status as string) || null
    const ano_semestre = (query.ano_semestre as string) || null
    const area = (query.area as string) || null
    const id_turma = (query.id_turma as string) || null
    const turno = (query.turno as string) || null
    const busca = (query.busca as string) || null

    const client = await serverSupabaseClient(event)

    // Cast to any to bypass type check on RPC params until types are regenerated
    const { data, error } = await client.rpc('nxt_get_declaracoes', {
        p_id_aluno: id_aluno,
        p_status_filtro: status,
        p_ano_semestre: ano_semestre,
        p_area: area,
        p_id_turma: id_turma,
        p_turno: turno,
        p_busca: busca
    } as any)

    if (error) {
        console.error('Erro detalhado RPC:', JSON.stringify(error, null, 2))
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao buscar histórico: ${error.message || JSON.stringify(error)}`
        })
    }

    return data
})
