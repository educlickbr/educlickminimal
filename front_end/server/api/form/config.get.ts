import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  
  const { id_entidade, programa_id, area_id, tipo_proc, tipo_cand } = query as any

  if (!id_entidade) {
    return { success: false, message: 'ID da entidade não fornecido' }
  }

  const { data, error } = await (client.rpc as any)('aca_get_form_config_completo', {
    p_id_entidade: id_entidade,
    p_programa_id: programa_id || null,
    p_area_id: area_id || null,
    p_tipo_proc: tipo_proc || 'seletivo',
    p_tipo_cand: tipo_cand || 'estudante'
  })
  
  console.log('--- DBG config.get.ts ---')
  console.log('Params:', { id_entidade, programa_id, area_id, tipo_proc, tipo_cand })
  console.log('Data:', data)
  console.log('Error:', error)
  console.log('---------------------------')

  if (error) return { success: false, message: error.message }
  return { success: true, blocos: data }
})
