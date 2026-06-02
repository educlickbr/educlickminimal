import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  
  if (!query.id_entidade) {
      throw createError({ statusCode: 400, message: 'Faltam parâmetros de entidade' })
  }

  const { data, error } = await client
    .rpc('frm_get_form_config', {
      p_id_entidade: query.id_entidade,
      p_area_id: query.area_id || null,
      p_programa_id: query.programa_id || null,
      p_tipo_proc: query.tipo_proc || 'matricula',
      p_tipo_cand: query.tipo_cand || 'estudante'
    } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
