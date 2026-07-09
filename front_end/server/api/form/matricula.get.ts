import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/form/matricula
 * Verifica se o usuário já possui matrícula para um programa
 * Query: id_programa, id_entidade
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const { id_programa, id_entidade } = query as { id_programa?: string; id_entidade?: string }

  if (!id_programa || !id_entidade) {
    return { success: false, message: 'id_programa e id_entidade são obrigatórios', matricula: null }
  }

  const { data: sessionData } = await client.auth.getSession()
  const user = sessionData?.session?.user
  if (!user?.id) {
    return { success: false, message: 'Usuário não autenticado', matricula: null }
  }

  // Busca user_expandido pelo auth.uid()
  const { data: userEx } = await client
    .from('user_expandido')
    .select('id')
    .eq('id_user', user.id)
    .maybeSingle() as any

  if (!userEx?.id) {
    return { success: false, message: 'Usuário não encontrado', matricula: null }
  }

  // Verifica se já existe matrícula
  const { data: matricula } = await client
    .from('aca_matricula')
    .select('id, id_programa, criado_em, id_pedido')
    .eq('id_programa', id_programa)
    .eq('id_usuario', userEx.id)
    .maybeSingle() as any

  return {
    success: true,
    matricula: matricula || null,
    jaExiste: !!matricula,
  }
})
