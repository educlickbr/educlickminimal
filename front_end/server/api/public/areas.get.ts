import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  
  const id_entidade = query.id_entidade || '00ca60ea-6667-482d-8a96-09b877707b08'

  const { data, error } = await client.rpc('aca_get_areas_publicas', {
    p_id_entidade: id_entidade
  } as any)

  if (error) {
    console.error('Erro ao buscar áreas públicas:', error)
    return { success: false, message: error.message }
  }
  
  return { success: true, itens: data }
})
