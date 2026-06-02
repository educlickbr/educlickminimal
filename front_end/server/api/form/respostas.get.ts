import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  
  const { user_expandido_id, pergunta_ids } = query as any

  if (!user_expandido_id || !pergunta_ids) {
    return { success: false, message: 'Parâmetros incompletos' }
  }

  const idsArray = Array.isArray(pergunta_ids) ? pergunta_ids : [pergunta_ids]

  const { data, error } = await client.rpc('aca_get_respostas_usuario', {
    p_id_user_expandido: user_expandido_id,
    p_pergunta_ids: idsArray
  } as any)

  if (error) return { success: false, message: error.message }
  return { success: true, respostas: data }
})
