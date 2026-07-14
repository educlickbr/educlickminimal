import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  if (!body?.id_avaliacao || !body?.id_turma) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id_avaliacao e id_turma são obrigatórios'
    })
  }

  const { data: dashboardData, error: dashboardError } = await client.rpc('avl_get_dashboard_turma', {
    p_id_avaliacao: body.id_avaliacao,
    p_id_turma: body.id_turma
  } as any)

  if (dashboardError) {
    throw createError({ statusCode: 500, statusMessage: dashboardError.message })
  }

  const dashboard = Array.isArray(dashboardData) ? (dashboardData[0] ?? null) : dashboardData

  if (!dashboard || !dashboard.total_alunos) {
    throw createError({ statusCode: 404, statusMessage: 'Nenhuma avaliação encontrada para a turma selecionada' })
  }

  if (Number(dashboard.total_nao_elegiveis_publicacao || 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Existem avaliações pendentes de preenchimento ou validação para este contexto',
      data: {
        pendencias: dashboard.pendencias || [],
        dashboard
      }
    } as any)
  }

  const { data, error } = await client.rpc('avl_publicar_resultados_lote', {
    p_id_avaliacao: body.id_avaliacao,
    p_id_turma: body.id_turma
  } as any)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return Array.isArray(data) ? (data[0] ?? null) : data
})