import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    id,
    id_entidade,
    nome_curso,
    descricao,
    id_area,
    usuario_id
  } = body

  if (!id_entidade || !nome_curso) {
    return { success: false, message: 'id_entidade e nome_curso são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_upsert_curso', {
    p_id:           id || null,
    p_id_entidade:   id_entidade,
    p_nome_curso:    nome_curso,
    p_descricao:     descricao ?? null,
    p_id_area:       id_area || null,
    p_usuario_id:    usuario_id || null
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
