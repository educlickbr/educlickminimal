import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade, data_inicio, data_fim, nome_evento, descricao, sobrescrever_calendario, usuario_id } = body

  if (!id_entidade || !data_inicio || !nome_evento) {
    return { success: false, message: 'Entidade, data de início e nome do evento são obrigatórios' }
  }

  const payload: any = {
    id_entidade,
    data_inicio,
    data_fim,
    nome_evento,
    descricao,
    sobrescrever_calendario: !!sobrescrever_calendario,
    modificado_por: usuario_id,
    modificado_em: new Date().toISOString()
  }

  if (id) {
    const { data: updated, error } = await (client as any)
      .from('aca_evento')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, message: error.message }
    return { success: true, item: updated }
  } else {
    payload.criado_por = usuario_id
    const { data: inserted, error } = await (client as any)
      .from('aca_evento')
      .insert(payload)
      .select()
      .single()

    if (error) return { success: false, message: error.message }
    return { success: true, item: inserted }
  }
})
