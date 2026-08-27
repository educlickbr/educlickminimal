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
    else if (action === 'atualizar_detalhes') {
      response = await client.rpc('aca_atualizar_aula_detalhes', {
        p_id_aula:             id,
        p_id_entidade:         id_entidade,
        p_id_componente:       body.id_componente || null,
        p_id_docente_override: body.id_docente_override || null,
        p_observacao:          body.observacao || null,
        p_sub_turma:           body.sub_turma || null
      } as any)
    }
    else if (action === 'swap') {
      if (!body.id_aula_2) throw new Error('id_aula_2 é obrigatório para permuta (swap).')
      response = await client.rpc('aca_swap_aulas', {
        p_id_aula_1:   id,
        p_id_aula_2:   body.id_aula_2,
        p_id_entidade: id_entidade
      } as any)
    }
    else if (action === 'dividir') {
      response = await client.rpc('aca_dividir_aula', {
        p_id_aula:         id,
        p_id_entidade:     id_entidade,
        p_id_componente_b: body.id_componente_b || null,
        p_id_docente_b:    body.id_docente_b || null
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
