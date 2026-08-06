import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade } = body

  if (!id || !id_entidade) {
    return { success: false, message: 'ID da associação e ID da entidade são obrigatórios' }
  }

  const { data, error } = await (client.rpc as any)('lms_delete_distribuicao', {
    p_id: id,
    p_id_entidade: id_entidade,
  })

  if (error) return { success: false, message: error.message }
  return data
})
