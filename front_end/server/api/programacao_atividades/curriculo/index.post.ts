import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await (client.rpc as any)('lms_upsert_operacional', {
    p_id_entidade: body.id_entidade,
    p_id_conteudo: body.id_conteudo,
    p_id_programa: body.id_programa || null,
    p_id_ciclo: body.id_ciclo || null,
    p_id_calendario: body.id_calendario || null,
    p_ativo: body.ativo ?? null,
    p_destaque: body.destaque ?? null,
    p_data_disponivel: body.data_disponivel || null,
    p_data_entrega_limite: body.data_entrega_limite || null,
    p_duracao_minutos: body.duracao_minutos ?? null,
    p_tentativas_permitidas: body.tentativas_permitidas ?? null,
    p_pontuacao_maxima: body.pontuacao_maxima ?? null,
    p_usuario_id: body.usuario_id,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
