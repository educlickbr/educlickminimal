import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { id } = body

  if (!id) {
    return { success: false, message: 'ID é obrigatório' }
  }

  const { error } = await client
    .from('aca_feriado')
    .delete()
    .eq('id', id)

  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Feriado excluído com sucesso' }
})
