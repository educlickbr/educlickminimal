import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const id_modulo = typeof query.id_modulo === 'string' ? query.id_modulo : undefined

  if (!id_modulo) {
    return { success: false, message: 'id_modulo é obrigatório' }
  }

  const { data, error } = await client.rpc('aca_get_planos_por_modulo', {
    p_id_modulo: id_modulo
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
