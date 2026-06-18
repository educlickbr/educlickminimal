import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade, id_modulo, id_componente, titulo_plano, ementa, usuario_id } = body

  const { data, error } = await client.rpc('aca_upsert_plano_de_aula', {
    p_id: id,
    p_id_entidade: id_entidade,
    p_id_modulo: id_modulo,
    p_id_componente: id_componente,
    p_titulo_plano: titulo_plano,
    p_ementa: ementa,
    p_usuario_id: usuario_id
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
