import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    return { success: false, message: 'Usuário não autenticado', inscricao: null }
  }

  const body = await readBody(event)
  const { id_processo, tipo_proc, tipo_cand } = body || {}

  if (!id_processo || !tipo_proc || !tipo_cand) {
    return { success: false, message: 'Dados incompletos (id_processo, tipo_proc, tipo_cand)', inscricao: null }
  }

  const { data, error } = await (client.rpc as any)('aca_criar_inscricao', {
    p_id_processo: id_processo,
    p_tipo_processo: tipo_proc,
    p_tipo_candidatura: tipo_cand,
  })

  if (error) {
    console.error('Erro ao criar inscrição:', error)
    return { success: false, message: error.message, inscricao: null }
  }

  // data é um array (RETURNS TABLE), pegamos o primeiro
  const inscricao = Array.isArray(data) && data.length > 0 ? data[0] : null

  return { success: true, inscricao }
})
