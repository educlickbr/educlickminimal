import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id_conteudo, id_entidade, id_matricula } = getQuery(event)

  if (!id_conteudo || !id_entidade || !id_matricula) {
    throw createError({ statusCode: 400, message: 'id_conteudo, id_entidade e id_matricula são obrigatórios' })
  }

  const { data, error } = await (client.rpc as any)('lms_get_avaliacao_para_aluno', {
    p_id_conteudo: id_conteudo,
    p_id_entidade: id_entidade,
    p_id_matricula: id_matricula,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
