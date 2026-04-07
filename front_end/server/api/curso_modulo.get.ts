import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_curso = typeof query.id_curso === 'string' ? query.id_curso : undefined

  if (!id_curso) {
    return { success: false, message: 'id_curso é obrigatório' }
  }

  const { data, error } = await client.rpc('aca_get_modulos_do_curso', {
    p_id_curso: id_curso
  } as any)

  if (error) return { success: false, message: error.message }

  return {
    success: true,
    itens: Array.isArray(data) ? data : []
  }
})
