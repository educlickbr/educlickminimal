import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    id,
    id_entidade,
    id_modulo,
    id_programa,
    descricao,
    data_ini,
    data_fim,
    usuario_id
  } = body

  if (!id_entidade || !id_modulo) {
    return { success: false, message: 'id_entidade e id_modulo são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_upsert_ciclo_v1', {
    p_id:           id || null,
    p_id_entidade:   id_entidade,
    p_id_modulo:     id_modulo,
    p_id_programa:   id_programa || null,
    p_descricao:     descricao || null,
    p_data_ini:      data_ini || null,
    p_data_fim:      data_fim || null,
    p_usuario_id:    usuario_id || null
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
