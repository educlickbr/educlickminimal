import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const client = serverSupabaseServiceRole(event)
    const p_id_entidade = '00ca60ea-6667-482d-8a96-09b877707b08'
    const p_area_id = '288d99f4-1b65-460a-9b0a-dd3c7c303c11'
    
    const { data: configs, error } = await client
      .from('aca_form_config')
      .select('*, cmct_pergunta_form(*)')
      .eq('id_entidade', p_id_entidade)
      .eq('area_id', p_area_id)
      .eq('tipo_proc', 'seletivo')
      .eq('tipo_cand', 'estudante')

    return { success: true, configs, error }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})
