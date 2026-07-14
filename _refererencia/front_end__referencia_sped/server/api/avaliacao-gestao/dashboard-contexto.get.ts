import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const client = await serverSupabaseClient(event)

  const idsTurmas = Array.isArray(query.id_turmas)
    ? query.id_turmas.map((value) => String(value)).filter(Boolean)
    : typeof query.id_turmas === 'string'
      ? query.id_turmas.split(',').map((value) => value.trim()).filter(Boolean)
      : []

  if (!idsTurmas.length || !query.ano_semestre || !query.etapa) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id_turmas, ano_semestre e etapa são obrigatórios'
    })
  }

  const { data, error } = await client.rpc('avl_get_dashboard_contexto_turmas', {
    p_id_turmas: idsTurmas,
    p_ano_semestre: String(query.ano_semestre),
    p_etapa: String(query.etapa)
  } as any)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data || []
})