import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const id_ciclo = typeof query.id_ciclo === 'string' ? query.id_ciclo : undefined

  if (!id_ciclo) return { success: false, message: 'id_ciclo obrigatório' }

  const { data, error } = await client
    .from('aca_ciclo_dia_semana')
    .select('*')
    .eq('id_ciclo', id_ciclo)

  if (error) return { success: false, message: error.message }
  
  const mapped = (data as any[] || []).map((d: any) => ({
    ...d,
    dia_sem: d.n_dia_sem // Map to frontend expected key
  }))
  
  return { success: true, itens: mapped }
})
