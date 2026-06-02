import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { id, nova_data, id_entidade, action } = body

  if (!id || !id_entidade || !action) {
    return { success: false, message: 'Faltam parâmetros: id, id_entidade, action.' }
  }

  try {
    let response;

    if (action === 'mover') {
      if (!nova_data) throw new Error('nova_data é obrigatório para mover.')
      response = await client.rpc('aca_mover_aula', {
        p_id_aula:     id,
        p_nova_data:   nova_data,
        p_id_entidade: id_entidade
      } as any)
    } 
    else if (action === 'cancelar') {
      response = await client.rpc('aca_cancelar_aula', {
        p_id_aula:     id,
        p_id_entidade: id_entidade
      } as any)
    }
    else if (action === 'reagendar') {
      if (!nova_data) throw new Error('nova_data é obrigatório para reagendar.')
      response = await client.rpc('aca_reagendar_aula_cancelada', {
        p_id_aula:     id,
        p_nova_data:   nova_data,
        p_id_entidade: id_entidade
      } as any)
    }
    else {
      throw new Error('Ação inválida.')
    }

    if (response.error) throw response.error

    return response.data as { success: boolean; message?: string; novo_id?: string }

  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
