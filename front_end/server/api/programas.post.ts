import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    id,
    id_entidade,
    id_curso,
    id_area,
    descricao,
    ciclos, 
    usuario_id,
    processo_seletivo_inicio,
    processo_seletivo_fim,
    matricula_inicio,
    matricula_fim
  } = body

  if (!id_entidade) {
    return { success: false, message: 'id_entidade é obrigatório' }
  }

  const { data, error } = await client.rpc('aca_upsert_programa', {
    p_id:           id || null,
    p_id_entidade:   id_entidade,
    p_id_curso:      id_curso || null, // Transformado em opcional caso a origem seja módulo
    p_descricao:     descricao ?? null,
    p_usuario_id:    usuario_id || null,
    p_ciclos:        ciclos || null, 
    p_id_area:       id_area || null,
    p_processo_seletivo_inicio: processo_seletivo_inicio || null,
    p_processo_seletivo_fim:    processo_seletivo_fim || null,
    p_matricula_inicio:         matricula_inicio || null,
    p_matricula_fim:            matricula_fim || null
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
