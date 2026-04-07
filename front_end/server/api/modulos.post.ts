import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade, nome_modulo, descricao, carga_horaria, usuario_id } = body

  const { data, error } = await client.rpc('aca_upsert_modulo', {
    p_id: id,
    p_id_entidade: id_entidade,
    p_nome_modulo: nome_modulo,
    p_descricao: descricao,
    p_carga_horaria: carga_horaria ?? null,
    p_usuario_id: usuario_id
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})

