import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await client
    .rpc('frm_upsert_form_config', {
      p_id_entidade: body.id_entidade,
      p_area_id: body.area_id || null,
      p_programa_id: body.programa_id || null,
      p_tipo_proc: body.tipo_proc || 'matricula',
      p_tipo_cand: body.tipo_cand || 'estudante',
      p_old_area_id: body.old_area_id !== undefined ? body.old_area_id : null,
      p_old_programa_id: body.old_programa_id !== undefined ? body.old_programa_id : null,
      p_old_tipo_proc: body.old_tipo_proc || null,
      p_old_tipo_cand: body.old_tipo_cand || null,
      p_items: body.items || []
    } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
