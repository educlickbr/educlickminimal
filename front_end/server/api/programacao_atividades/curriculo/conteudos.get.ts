import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_programa, id_entidade, escopo_tipo, escopo_id } = getQuery(event)

  if (!id_programa || !id_entidade || !escopo_tipo || !escopo_id) {
    throw createError({ statusCode: 400, message: 'id_programa, id_entidade, escopo_tipo e escopo_id são obrigatórios' })
  }

  const { data, error } = await (client.rpc as any)('lms_get_curriculo_conteudos', {
    p_id_programa: id_programa,
    p_id_entidade: id_entidade,
    p_escopo_tipo: escopo_tipo,
    p_escopo_id: escopo_id,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
