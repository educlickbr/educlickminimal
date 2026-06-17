import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Voltamos para serverSupabaseClient. Com as permissões de 'anon' na RPC
  // e SECURITY DEFINER no banco, ele conseguirá ler os dados mesmo sem Service Role.
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  
  // Fallback para id_entidade (educlick_modelo) caso não seja fornecido
  const id_entidade = query.id_entidade || '00ca60ea-6667-482d-8a96-09b877707b08'

  const { data, error } = await client.rpc('aca_get_programas_publicos', {
    p_id_entidade: id_entidade
  } as any)

  if (error) {
    console.error('Erro ao buscar programas públicos:', error)
    return { success: false, message: error.message }
  }
  
  return { success: true, itens: data }
})
