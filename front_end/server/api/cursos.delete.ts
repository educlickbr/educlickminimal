// BFF para deletar curso educacional
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade } = body

  if (!id || !id_entidade) {
    return { success: false, message: 'ID do curso e ID da entidade são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_delete_curso', {
    p_id: id,
    p_id_entidade: id_entidade
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
