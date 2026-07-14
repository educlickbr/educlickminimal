import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
  // Endpoint público: lista editais para usuários não autenticados.
  // A permissão pública é garantida via RPC SECURITY DEFINER no banco.
  // Mantemos essa abordagem para não depender de SUPABASE_SERVICE_KEY no runtime.
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const anoSemestre = query.ano_semestre as string | undefined

  const { data, error } = await client.rpc('nxt_jnpta_editais_publicos_listar', {
    p_ano_semestre: anoSemestre || null
  } as any)

  if (error) {
    console.error('[API] Erro ao listar editais públicos JNPTA:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar editais públicos'
    })
  }

  return {
    ok: true,
    editais: data || []
  }
})
