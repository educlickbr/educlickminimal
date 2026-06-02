import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id_entidade, id_modulo, data_inicio, dias_semana, dias_extras } = body

  if (!id_entidade || !id_modulo || !data_inicio) {
    return { success: false, message: 'Faltam parâmetros obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_calcular_cronograma_aulas', {
    p_id_entidade: id_entidade,
    p_id_modulo: id_modulo,
    p_data_inicio: data_inicio,
    p_dias_semana: dias_semana || [],
    p_dias_extras: dias_extras || []
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
