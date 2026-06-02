import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  
  // Se não vier id_entidade na query, tentamos pegar de um header ou env (fallback)
  const id_entidade = query.id_entidade

  if (!id_entidade) {
    return { success: false, message: 'ID da entidade não fornecido' }
  }

  const { data, error } = await client.rpc('aca_get_programas_publicos', {
    p_id_entidade: id_entidade
  } as any)

  if (error) return { success: false, message: error.message }
  return { success: true, itens: data }
})
