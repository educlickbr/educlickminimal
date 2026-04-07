import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    id_curso,
    id_modulo,
    ordem,
    id_entidade,
    usuario_id
  } = body

  if (!id_curso || !id_modulo || !id_entidade) {
    return { success: false, message: 'id_curso, id_modulo e id_entidade são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_add_modulo_ao_curso', {
    p_id_curso:  id_curso,
    p_id_modulo: id_modulo,
    p_ordem:     ordem ?? 0,
    p_id_entidade: id_entidade,
    p_usuario_id: usuario_id || null
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
