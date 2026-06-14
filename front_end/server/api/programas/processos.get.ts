import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_programa = typeof query.id_programa === 'string' ? query.id_programa : undefined

  if (!id_programa) {
    return { success: false, message: 'id_programa é obrigatório' }
  }

  const { data, error } = await client
    .from('aca_processo_seletivo')
    .select('id, nome_processo, data_inicio, data_fim, matricula_inicio, matricula_fim')
    .eq('id_programa', id_programa)
    .order('data_inicio', { ascending: true })

  if (error) return { success: false, message: error.message }
  return { success: true, itens: data || [] }
})
