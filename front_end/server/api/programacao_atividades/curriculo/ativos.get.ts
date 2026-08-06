import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_programa, id_entidade } = getQuery(event)

  if (!id_programa || !id_entidade) {
    throw createError({ statusCode: 400, message: 'id_programa e id_entidade são obrigatórios' })
  }

  const { data, error } = await client
    .from('lms_conteudo_operacional')
    .select('id, id_conteudo, ativo, destaque')
    .eq('id_programa', id_programa)
    .eq('id_entidade', id_entidade)
    .is('id_ciclo', null)
    .is('id_calendario', null)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { itens: data || [] }
})
