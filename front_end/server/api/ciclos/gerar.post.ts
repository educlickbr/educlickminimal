import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id_entidade, id_ciclo, usuario_id } = body

  if (!id_entidade || !id_ciclo) {
    return { success: false, message: 'ID da Entidade e ID do Ciclo são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_gerar_calendario_ciclo', {
    p_id_entidade: id_entidade,
    p_id_ciclo: id_ciclo,
    p_usuario_id: usuario_id
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
