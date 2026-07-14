import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const idMatricula = query.id_matricula as string | undefined

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  if (!idMatricula) {
    throw createError({ statusCode: 400, statusMessage: 'id_matricula é obrigatório' })
  }

  const { data, error } = await client.rpc('nxt_get_opcoes_nome_impressao_declaracao', {
    p_id_matricula: idMatricula
  } as any)

  if (error) {
    const statusCode = error.message === 'Matrícula não encontrada' ? 404 : 500
    throw createError({ statusCode, statusMessage: error.message })
  }

  return {
    ok: true,
    opcoes: data || []
  }
})