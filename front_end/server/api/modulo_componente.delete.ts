import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

// DELETE /api/modulo_componente
// Remove a associação de um componente a um módulo

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { id_modulo, id_componente } = body

  if (!id_modulo || !id_componente) {
    return { success: false, message: 'id_modulo e id_componente são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_remove_componente_do_modulo', {
    p_id_modulo:     id_modulo,
    p_id_componente: id_componente
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
