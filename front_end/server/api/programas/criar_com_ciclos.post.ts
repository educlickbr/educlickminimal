import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  const { 
    id_entidade, id_curso, id_area, descricao, ciclos, estrategia, usuario_id, descricoes,
    processo_seletivo_inicio, processo_seletivo_fim, matricula_inicio, matricula_fim,
    processos
  } = body

  if (!id_entidade || !ciclos || ciclos.length === 0) {
    return { success: false, message: 'Dados incompletos para geração do programa.' }
  }

  const { data, error } = await client.rpc('aca_create_programas_lote', {
    p_id_entidade: id_entidade,
    p_id_curso: id_curso,
    p_id_area: id_area || null,
    p_descricao: descricao || '',
    p_ciclos: ciclos,
    p_estrategia: estrategia || 'unica',
    p_usuario_id: usuario_id,
    p_descricoes: descricoes || null,
    p_processo_seletivo_inicio: processo_seletivo_inicio || null,
    p_processo_seletivo_fim:    processo_seletivo_fim || null,
    p_matricula_inicio:         matricula_inicio || null,
    p_matricula_fim:            matricula_fim || null,
    p_processos:                Array.isArray(processos) ? processos : null
  } as any)

  if (error) return { success: false, message: error.message }
  return data
})
