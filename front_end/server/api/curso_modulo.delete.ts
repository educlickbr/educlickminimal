import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { id_curso, id_modulo } = body

  if (!id_curso || !id_modulo) {
    return { success: false, message: 'id_curso e id_modulo são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_remove_modulo_do_curso', {
    p_id_curso:  id_curso,
    p_id_modulo: id_modulo
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
