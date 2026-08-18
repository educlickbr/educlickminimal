import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = (await serverSupabaseClient(event)) as any
  const body = await readBody(event)

  const { id_conteudo, id_entidade, id_matricula } = body
  if (!id_conteudo || !id_entidade || !id_matricula) {
    throw createError({ statusCode: 400, message: 'id_conteudo, id_entidade e id_matricula são obrigatórios' })
  }

  // Upsert direto com RLS — as policies "estudante insert/update own" de
  // lms_progresso_aluno garantem que o aluno só toca a própria matrícula.
  const { error } = await client.from('lms_progresso_aluno').upsert(
    {
      id_entidade,
      id_conteudo,
      id_matricula,
      concluido: true,
      visto_em: new Date().toISOString(),
    },
    { onConflict: 'id_conteudo,id_matricula' },
  )

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
