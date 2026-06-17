import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  
  const { id_entidade: query_entidade, programa_id, area_id, tipo_proc, tipo_cand } = query as any
  const id_entidade = query_entidade || '00ca60ea-6667-482d-8a96-09b877707b08'

  const { data, error } = await (client.rpc as any)('aca_get_form_config_completo', {
    p_id_entidade: id_entidade,
    p_programa_id: programa_id || null,
    p_area_id: area_id || null,
    p_tipo_proc: tipo_proc || 'seletivo',
    p_tipo_cand: tipo_cand || 'estudante'
  })
  
  if (error) {
    console.error('Erro ao buscar configuração de formulário:', error)
    return { success: false, message: error.message }
  }
  
  return { success: true, blocos: data }
})
