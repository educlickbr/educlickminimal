import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { ids_processos } = body || {}

  if (!ids_processos || !Array.isArray(ids_processos) || ids_processos.length === 0) {
    return { success: false, message: 'IDs de processos não fornecidos', inscritos: {} }
  }

  const { data, error } = await client.rpc('aca_verificar_inscricoes_lote', {
    p_id_processos: ids_processos,
  } as any)

  if (error) return { success: false, message: error.message, inscritos: {} }

  return data
})
