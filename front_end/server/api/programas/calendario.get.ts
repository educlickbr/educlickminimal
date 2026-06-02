import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_programa = query.id_programa as string
  const id_entidade = query.id_entidade as string

  if (!id_entidade || !id_programa) {
    return { success: false, message: 'Faltam parâmetros requeridos (id_entidade, id_programa).' }
  }

  try {
    const { data, error } = await client.rpc('aca_get_calendario_programa', {
      p_id_programa: id_programa,
      p_id_entidade: id_entidade
    }as any)

    if (error) throw error

    // A RPC já retorna { success, itens }
    return data as { success: boolean; itens?: any[]; message?: string }

  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
