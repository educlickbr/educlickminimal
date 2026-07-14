import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  if (!query.id_avaliacao) {
    throw createError({
      statusCode: 400,
      statusMessage: "id_avaliacao é obrigatório",
    });
  }

  const idAvaliacao = String(query.id_avaliacao);

  // 1. Buscar o ano_semestre e id_turma da avaliação atual
  const { data: avData, error: avError } = await client
    .from("avl_avaliacao")
    .select("ano_semestre")
    .eq("id", idAvaliacao)
    .single();

  if (avError || !avData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Avaliacao nao encontrada",
    });
  }

  const { data: turmaData, error: turmaError } = await client
    .from("avl_av_turma")
    .select("id_turma")
    .eq("id_avaliacao", idAvaliacao)
    .single();

  if (turmaError || !turmaData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Turma nao encontrada para esta avaliacao",
    });
  }

  const ano_semestre = (avData as any).ano_semestre as string;
  const id_turma = (turmaData as any).id_turma as string;

  // 2. Buscar todas as avaliacoes do aluno nesse contexto
  const { data: avaliacoes, error } = await client.rpc(
    "avl_get_avaliacoes_aluno",
    {
      p_ano_semestre: ano_semestre,
      p_id_turma: id_turma,
      p_incluir_nao_publicadas: true,
    } as any,
  );

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // 3. Ordenar por etapa na ordem correta
  const ordemEtapas: Record<string, number> = {
    "O que nos Une": 1,
    "Mundo do Trabalho": 2,
    Criação: 3,
    "Relatório Final": 4,
  };

  const todas = Array.isArray(avaliacoes) ? avaliacoes : [];
  const ordenadas = todas.sort(
    (a: any, b: any) =>
      (ordemEtapas[a.etapa] || 99) - (ordemEtapas[b.etapa] || 99),
  );

  return ordenadas;
});
