import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const { data, error } = await client.rpc('avl_get_opcoes_nome_impressao')

  if (error) {
    const statusCode = error.message === 'Aluno não encontrado' ? 404 : 500
    throw createError({ statusCode, statusMessage: error.message })
  }

  return {
    ok: true,
    opcoes: data || []
  }
})