import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_ciclo = query.id_ciclo as string
  if (!id_ciclo) {
    return { success: false, message: 'id_ciclo é obrigatório' }
  }

  try {
    const { data, error } = await client.rpc('aca_get_calendario_ciclo_publico', {
      p_id_ciclo: id_ciclo
    } as any)

    if (error) throw error
    return data as { success: boolean; ciclo?: any; aulas?: any[]; message?: string }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
