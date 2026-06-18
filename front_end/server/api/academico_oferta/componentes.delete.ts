// BFF para deletar componente
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade } = body

  const { data, error } = await client.rpc('aca_delete_componente', {
    p_id: id,
    p_id_entidade: id_entidade
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
