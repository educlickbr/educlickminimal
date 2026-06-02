import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const id_entidade = query.id_entidade

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const { data, error } = await client
    .rpc('frm_get_formularios_salvos', { p_id_entidade: id_entidade } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
