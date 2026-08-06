import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id_conteudo, id_bloco } = body

  if (!id_conteudo || !id_bloco) {
    return { success: false, message: 'id_conteudo e id_bloco são obrigatórios' }
  }

  const { data, error } = await (client.rpc as any)('lms_desassociar_conteudo_bloco', {
    p_id_conteudo: id_conteudo,
    p_id_bloco: id_bloco,
  })

  if (error) return { success: false, message: error.message }
  return data
})
