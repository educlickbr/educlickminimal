import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    id,
    id_entidade,
    id_curso,
    descricao,
    usuario_id
  } = body

  if (!id_entidade || !id_curso) {
    return { success: false, message: 'id_entidade e id_curso são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_upsert_programa', {
    p_id:           id || null,
    p_id_entidade:   id_entidade,
    p_id_curso:      id_curso,
    p_descricao:     descricao ?? null,
    p_usuario_id:    usuario_id || null
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
