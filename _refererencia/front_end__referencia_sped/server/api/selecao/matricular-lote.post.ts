import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    // 1. Validar método
    if (event.node.req.method !== 'POST') {
        throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
    }

    try {
        const client = await serverSupabaseClient(event)
        const body = await readBody(event)

        const { id_turma, ids_processos } = body

        if (!id_turma) {
            throw createError({ statusCode: 400, statusMessage: 'ID da turma é obrigatório.' })
        }

        if (!ids_processos || !Array.isArray(ids_processos) || ids_processos.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'Nenhum estudante selecionado para matrícula.' })
        }

        // 3. Executar RPC
        const { data: rawData, error } = await client.rpc('nxt_upsert_matricula_lote', {
            p_id_turma: id_turma,
            p_ids_processos: ids_processos
        } as any)

        const data = rawData as any

        if (error) {
            console.error('Erro na RPC de matrícula em lote:', error)
            throw createError({ statusCode: 500, statusMessage: 'Erro ao processar matrículas.' })
        }

        // Verifica retorno amigavel da function que trata try/catch
        if (data && data.success === false) {
            console.error('Erro tratado na RPC:', data.error_message)
            throw createError({ statusCode: 500, statusMessage: data.error_message || 'Erro do banco.' })
        }

        return {
            success: true,
            message: 'Matrículas efetuadas com sucesso.',
            data
        }

    } catch (e: any) {
        console.error('Erro no endpoint matricular-lote:', e)
        throw createError({
            statusCode: e.statusCode || 500,
            statusMessage: e.statusMessage || 'Erro interno no servidor'
        })
    }
})
