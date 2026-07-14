import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const client = await serverSupabaseClient(event)

  if (!query.id_avaliacao || !query.id_turma) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id_avaliacao e id_turma são obrigatórios'
    })
  }

  const { data, error } = await client.rpc('avl_get_dashboard_turma', {
    p_id_avaliacao: String(query.id_avaliacao),
    p_id_turma: String(query.id_turma)
  } as any)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return Array.isArray(data) ? (data[0] ?? null) : data
})