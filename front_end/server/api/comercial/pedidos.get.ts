import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined
  const status = typeof query.status === 'string' ? query.status : undefined
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  // Se o usuário está logado, busca o user_expandido.id dele
  let id_usuario: string | null = null
  const { data: sessionData } = await client.auth.getSession()
  const userId = sessionData?.session?.user?.id
  if (userId) {
    const { data: userEx } = await client
      .from('user_expandido')
      .select('id')
      .eq('id_user', userId)
      .maybeSingle() as any
    if (userEx?.id) {
      id_usuario = userEx.id
    }
  }

  const { data, error } = await client.rpc('com_get_pedidos', {
    p_id_entidade: id_entidade,
    p_id_usuario: id_usuario,
    p_status: status || null,
    p_pagina: page,
    p_limite: limit,
  } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
