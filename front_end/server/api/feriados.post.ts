import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id, id_entidade, data, nome, recorrente_anual, usuario_id } = body

  // Log para depuração caso precise
  // console.log('Feriado Payload:', body)

  if (!data || !nome) {
    return { success: false, message: 'Data e nome são obrigatórios' }
  }

  // Preparamos o payload padrão (sem ID para não conflitar no update)
  const payload: any = {
    id_entidade: id_entidade || null, // Garante NULL se vier string vazia do front
    data,
    nome,
    recorrente_anual: !!recorrente_anual,
    modificado_por: usuario_id,
    modificado_em: new Date().toISOString()
  }

  if (id) {
    // Modo Edição - Forçamos 'as any' para evitar erro de tipo se a tabela for nova
    const { data: updated, error } = await (client as any)
      .from('aca_feriado')
      .update(payload) 
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, message: error.message }
    return { success: true, item: updated }
  } else {
    // Modo Inserção
    payload.criado_por = usuario_id
    const { data: inserted, error } = await (client as any)
      .from('aca_feriado')
      .insert(payload)
      .select()
      .single()

    if (error) return { success: false, message: error.message }
    return { success: true, item: inserted }
  }
})
