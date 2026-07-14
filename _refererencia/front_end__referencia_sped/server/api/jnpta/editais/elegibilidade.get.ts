import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface EditalElegibilidade {
  has_enviada: boolean
  id_candidatura_enviada: string | null
  has_rascunho: boolean
  id_candidatura_rascunho: string | null
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    return {
      ok: true,
      authenticated: false,
      editais: {} as Record<string, EditalElegibilidade>,
    }
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await (client.rpc as any)(
    'nxt_jnpta_elegibilidade_editais',
    { p_id_edital: null },
  )

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao consultar elegibilidade da Jornada.',
      data: error,
    })
  }

  if (!data?.ok) {
    return {
      ok: true,
      authenticated: true,
      editais: {} as Record<string, EditalElegibilidade>,
    }
  }

  const editais = (data?.editais || {}) as Record<string, EditalElegibilidade>

  return {
    ok: true,
    authenticated: true,
    editais,
  }
})