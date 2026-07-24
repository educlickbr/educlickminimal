import { defineEventHandler, getQuery, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const method = event.method
  const client = await serverSupabaseClient(event)

  try {
    // ── GET /api/atribuicao ─────────────────────────────────
    if (method === 'GET') {
      const query = getQuery(event)
      const id_entidade = query.id_entidade as string
      const ano_semestre = query.ano_semestre as string | undefined

      if (!id_entidade) {
        return { success: false, message: 'id_entidade é obrigatório.' }
      }

      // Programas com ciclos (filtrados por ano_semestre opcional)
      const { data: progData, error: errProg } = await client
        .rpc('aca_get_programas_com_ciclos', {
          p_id_entidade: id_entidade,
          p_ano_semestre: ano_semestre || null,
        } as any)

      if (errProg) throw errProg

      const progResult = progData as any

      // Docentes ativos via RPC leve (id, nome, email apenas)
      let docentesData: any[] = []
      const { data: docentes, error: errDoc } = await client
        .rpc('aca_get_docentes_por_entidade', {
          p_id_entidade: id_entidade,
          p_busca: null,
        } as any)

      if (!errDoc) {
        const parsed = docentes as any
        docentesData = parsed?.itens || []
      } else {
        console.error('[atribuicao] Erro RPC docentes:', errDoc)
      }

      return {
        success: true,
        programas: progResult?.programas || [],
        ano_semestres: progResult?.ano_semestres || [],
        docentes: docentesData,
      }
    }

    // ── POST /api/atribuicao ───────────────────────────────
    if (method === 'POST') {
      const body = await readBody(event)
      const { id_ciclo, id_modulo_componente, id_docente, tipo } = body

      if (!id_ciclo || !id_modulo_componente || !id_docente) {
        return {
          success: false,
          message: 'id_ciclo, id_modulo_componente e id_docente são obrigatórios.',
        }
      }

      const { data, error } = await client
        .rpc('aca_atribuir_docente_ciclo', {
          p_id_ciclo: id_ciclo,
          p_id_modulo_componente: id_modulo_componente,
          p_id_docente: id_docente,
          p_tipo: tipo || 'titular',
        } as any)

      if (error) throw error
      return data as { success: boolean; id?: string; message?: string }
    }

    // ── DELETE /api/atribuicao ─────────────────────────────
    if (method === 'DELETE') {
      const query = getQuery(event)
      const id = query.id as string

      if (!id) {
        return { success: false, message: 'id da atribuição é obrigatório.' }
      }

      const { data, error } = await client
        .rpc('aca_remover_atribuicao_docente', {
          p_id: id,
        } as any)

      if (error) throw error
      return data as { success: boolean; message?: string }
    }

    // ── Method not allowed ──────────────────────────────────
    return { success: false, message: `Método ${method} não suportado.` }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
