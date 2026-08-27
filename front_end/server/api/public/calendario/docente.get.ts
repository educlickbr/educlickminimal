import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_docente = query.id_docente as string
  if (!id_docente) {
    return { success: false, message: 'id_docente é obrigatório' }
  }

  try {
    const { data, error } = await client.rpc('aca_get_calendario_docente_publico', {
      p_id_docente: id_docente
    } as any)

    if (error) throw error
    return data as { success: boolean; docente?: any; aulas?: any[]; message?: string }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
