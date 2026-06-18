import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

// POST /api/modulo_componente
// Adiciona ou atualiza um componente dentro de um módulo

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    id_modulo,
    id_componente,
    id_entidade,
    carga_horaria,
    ordem,
    obrigatorio,
    usuario_id
  } = body

  if (!id_modulo || !id_componente || !id_entidade) {
    return { success: false, message: 'id_modulo, id_componente e id_entidade são obrigatórios' }
  }

  const { data, error } = await client.rpc('aca_add_componente_ao_modulo', {
    p_id_modulo:     id_modulo,
    p_id_componente: id_componente,
    p_id_entidade:   id_entidade,
    p_carga_horaria: carga_horaria ?? null,
    p_ordem:         ordem ?? 0,
    p_obrigatorio:   obrigatorio ?? true,
    p_usuario_id:    usuario_id ?? null
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
