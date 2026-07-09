import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await client
    .from('com_config_gateway')
    .select('*')
    .eq('id_entidade', id_entidade)
    .single() as any

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found (ok, ainda não configurado)
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true, data: data || null }
})
