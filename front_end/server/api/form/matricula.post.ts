import { serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/form/matricula
 * Cria matrícula acadêmica (via RPC aca_criar_matricula)
 * Body: id_entidade, id_programa, id_usuario
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id_entidade, id_programa, id_usuario } = body as {
    id_entidade?: string
    id_programa?: string
    id_usuario?: string
  }

  if (!id_entidade || !id_programa || !id_usuario) {
    return { success: false, message: 'id_entidade, id_programa e id_usuario são obrigatórios', matricula: null }
  }

  const { data: sessionData } = await client.auth.getSession()
  const user = sessionData?.session?.user
  if (!user?.id) {
    return { success: false, message: 'Usuário não autenticado', matricula: null }
  }

  const { data, error } = await client.rpc('aca_criar_matricula', {
    p_id_entidade: id_entidade,
    p_id_programa: id_programa,
    p_id_usuario: id_usuario,
    p_id_pedido: null,
    p_usuario_id: id_usuario,
  } as any)

  if (error) {
    console.error('Erro ao criar matrícula:', error)
    return { success: false, message: error.message, matricula: null }
  }

  return { success: true, matricula: (data as any) || null }
})
