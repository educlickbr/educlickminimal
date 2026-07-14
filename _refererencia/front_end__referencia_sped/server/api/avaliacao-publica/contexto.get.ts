import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token ? String(query.token) : null;

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token e obrigatorio",
    });
  }

  const client = await serverSupabaseClient(event);

  // 1. Encontrar a avaliacao pelo token publico
  const resultadoRes = (await client
    .from("avl_resultado_global")
    .select("id_avaliacao, id_aluno")
    .eq("token_publico", token)
    .single()) as {
    data: { id_avaliacao: string; id_aluno: string } | null;
    error: any;
  };

  if (resultadoRes.error || !resultadoRes.data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Avaliacao nao encontrada",
    });
  }

  const idAvaliacao = resultadoRes.data.id_avaliacao;
  const idAluno = resultadoRes.data.id_aluno;

  // 2. Buscar ano_semestre e id_turma
  const { data: avData } = await client
    .from("avl_avaliacao")
    .select("ano_semestre")
    .eq("id", idAvaliacao)
    .single();

  const { data: turmaData } = await client
    .from("avl_av_turma")
    .select("id_turma")
    .eq("id_avaliacao", idAvaliacao)
    .single();

  const anoSemestre = (avData as any)?.ano_semestre || null;
  const idTurma = (turmaData as any)?.id_turma || null;

  // 3. Buscar todas as avaliacoes do aluno nesse contexto
  const { data: avaliacoes, error } = await client.rpc(
    "avl_get_avaliacoes_aluno",
    {
      p_id_aluno: idAluno,
      p_ano_semestre: anoSemestre,
      p_id_turma: idTurma,
      p_incluir_nao_publicadas: true,
    } as any,
  );

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // 4. Ordenar por etapa
  const ordemEtapas: Record<string, number> = {
    "O que nos Une": 1,
    "Mundo do Trabalho": 2,
    Criacao: 3,
    "Relatório Final": 4,
  };

  const todas = Array.isArray(avaliacoes) ? avaliacoes : [];
  const ordenadas = todas.sort(
    (a: any, b: any) =>
      (ordemEtapas[a.etapa] || 99) - (ordemEtapas[b.etapa] || 99),
  );

  return { ok: true, avaliacoes: ordenadas };
});
