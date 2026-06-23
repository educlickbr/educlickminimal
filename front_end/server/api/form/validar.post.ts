import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { id_entidade, area_id, programa_id, tipo_proc, tipo_cand, user_expandido_id } = body || {}

  if (!id_entidade || !user_expandido_id) {
    return { success: false, message: 'Parâmetros incompletos' }
  }

  const { data, error } = await client.rpc('aca_validar_form_obrigatorio', {
    p_id_entidade: id_entidade,
    p_area_id: area_id || null,
    p_programa_id: programa_id || null,
    p_tipo_proc: tipo_proc || 'seletivo',
    p_tipo_cand: tipo_cand || 'estudante',
    p_user_expandido_id: user_expandido_id,
  } as any)

  if (error) return { success: false, message: error.message }

  return data
})
