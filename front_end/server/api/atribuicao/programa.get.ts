import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/atribuicao/programa
 * Retorna módulos, componentes e atribuições atuais de um programa.
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const id_programa = query.id_programa as string
  const id_entidade = query.id_entidade as string

  if (!id_programa || !id_entidade) {
    return { success: false, message: 'id_programa e id_entidade são obrigatórios.' }
  }

  try {
    const { data, error } = await client
      .rpc('aca_get_modulos_componentes_por_programa', {
        p_id_programa: id_programa,
        p_id_entidade: id_entidade,
      } as any)

    if (error) throw error

    const result = data as any

    // Vínculos da entidade (para filtrar docentes elegíveis por componente)
    let vinculos: any[] = []
    const { data: vinData, error: errVin } = await client
      .from('aca_docente_vinculo')
      .select('id, id_docente, id_componente, elegivel')

    if (!errVin) {
      vinculos = vinData || []
    }

    return {
      success: true,
      itens: result?.itens || [],
      vinculos,
    }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
