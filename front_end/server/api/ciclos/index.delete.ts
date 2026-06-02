import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade } = body

  if (!id || !id_entidade) {
    return { success: false, message: 'Parâmetros obrigatórios (id, id_entidade) faltando' }
  }

  try {
    const { data, error } = await client
      .rpc('aca_delete_ciclo' as any, {
        p_id_entidade: id_entidade,
        p_id_ciclo: id
      }as any)

    if (error) throw new Error(error.message)
    
    // O RPC retorna um JSONB: { success: boolean, message: string }
    if (data && typeof data === 'object') {
        const result = data as any;
        if (!result.success) return { success: false, message: result.message }
        return { success: true, message: result.message }
    }

    return { success: true, message: 'Ciclo acadêmico excluído com sucesso.' }

  } catch (error: any) {
    return { success: false, message: error.message || 'Erro inesperado ao excluir ciclo' }
  }
})
