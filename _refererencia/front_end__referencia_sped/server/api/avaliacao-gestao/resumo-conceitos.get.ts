import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const client = await serverSupabaseClient(event)

  const idsTurmas: string[] = Array.isArray(query.id_turmas)
    ? (query.id_turmas as string[]).filter(Boolean)
    : typeof query.id_turmas === 'string'
      ? query.id_turmas.split(',').map((v) => v.trim()).filter(Boolean)
      : []

  const anoSemestre = String(query.ano_semestre || '')
  const etapa = String(query.etapa || '')

  if (!idsTurmas.length || !anoSemestre || !etapa) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id_turmas, ano_semestre e etapa são obrigatórios'
    })
  }

  const { data, error } = await client.rpc('avl_get_resumo_conceitos_turmas', {
    p_id_turmas:    idsTurmas,
    p_ano_semestre: anoSemestre,
    p_etapa:        etapa
  } as any)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // A RPC devolve uma linha por (turma, conceito, total).
  // Agrupa aqui para entregar um objeto por turma com contagens por conceito.
  type RpcRow = {
    id_turma:    string
    nome_turma:  string
    cod_turma:   string | null
    id_avaliacao: string | null
    id_criterio:  string | null
    conceito:     string | null
    total:        number
  }

  const turmaIndex: Record<string, {
    id_turma:    string
    nome_turma:  string
    cod_turma:   string | null
    id_avaliacao: string | null
    id_criterio:  string | null
    contagens:   Record<string, number>
  }> = {}

  for (const row of (data || []) as RpcRow[]) {
    if (!turmaIndex[row.id_turma]) {
      turmaIndex[row.id_turma] = {
        id_turma:    row.id_turma,
        nome_turma:  row.nome_turma,
        cod_turma:   row.cod_turma,
        id_avaliacao: row.id_avaliacao,
        id_criterio:  row.id_criterio,
        contagens:   {}
      }
    }
    if (row.conceito && row.total) {
      turmaIndex[row.id_turma].contagens[row.conceito] = Number(row.total)
    }
  }

  // Garante que todas as turmas solicitadas apareçam no resultado,
  // mesmo as que não têm avaliação ou nenhum conceito registrado.
  return idsTurmas.map((id_turma) => turmaIndex[id_turma] ?? {
    id_turma,
    nome_turma:  '',
    cod_turma:   null,
    id_avaliacao: null,
    id_criterio:  null,
    contagens:   {}
  })
})
