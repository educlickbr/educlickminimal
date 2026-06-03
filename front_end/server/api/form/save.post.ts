import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo'

function formatBrazilTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const body = await readBody(event)
  
  const { id_entidade, id_user_expandido, id_pergunta, resposta, id_arquivo } = body

  if (!id_entidade || !id_user_expandido || !id_pergunta) {
    return { success: false, message: 'Dados incompletos para salvamento' }
  }

  // Interceptar salvamento de dados do sistema (user_expandido)
  if (id_pergunta.startsWith('sys-')) {
    const fieldMap: Record<string, string> = {
      'sys-nome': 'nome',
      'sys-sobrenome': 'sobrenome',
      'sys-email': 'email'
    }
    
    const dbField = fieldMap[id_pergunta]
    if (dbField) {
      const { error: updErr } = await client.rpc('aca_update_user_sys_fields', {
        p_id_user_expandido: id_user_expandido,
        p_field: dbField,
        p_value: resposta
      }as any)
        
      if (updErr) {
        console.error('Erro ao atualizar user_expandido:', updErr)
        return { success: false, message: updErr.message, details: updErr }
      }
      return { success: true, salvo_em: formatBrazilTime(new Date()) }
    }
  }

  const { data, error } = await client.rpc('aca_upsert_resposta_form', {
    p_id_entidade: id_entidade,
    p_id_user_expandido: id_user_expandido,
    p_id_pergunta: id_pergunta,
    p_resposta: resposta,
    p_id_arquivo: id_arquivo || null,
    p_usuario_id: id_user_expandido
  } as any)

  if (error) {
    console.error('Erro RPC Supabase:', error)
    return { success: false, message: error.message, details: error }
  }
  
  return { success: true, ...(data as any) }
})
