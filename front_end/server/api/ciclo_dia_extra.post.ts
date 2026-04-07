import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id_ciclo, dias, id_entidade, usuario_id } = body

  if (!id_ciclo || !dias || !Array.isArray(dias)) {
    return { success: false, message: 'Parâmetros obrigatórios faltando' }
  }

  // 1. Apaga existentes
  await client
    .from('aca_ciclo_dia_extra')
    .delete()
    .eq('id_ciclo', id_ciclo)

  if (dias.length === 0) return { success: true }

  // 2. Insere novos
  const payload = dias.map(d => ({
    id_ciclo,
    data: d.data,
    hora_ini: d.hora_ini,
    hora_fim: d.hora_fim,
    observacoes: d.observacoes || null,
    id_entidade,
    criado_por: usuario_id,
    modificado_por: usuario_id
  }))

  const { data, error } = await client
    .from('aca_ciclo_dia_extra')
    .insert(payload as any)
    .select()

  if (error) return { success: false, message: error.message }
  return { success: true, itens: data }
})
