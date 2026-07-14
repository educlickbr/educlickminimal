import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  if (!query.id_aluno || !query.id_avaliacao_atual) {
    throw createError({
      statusCode: 400,
      statusMessage: "id_aluno e id_avaliacao_atual são obrigatórios",
    });
  }

  const { data, error } = await client.rpc("avl_get_avaliacoes_aluno", {
    p_id_aluno: String(query.id_aluno),
    p_ano_semestre: query.ano_semestre ? String(query.ano_semestre) : null,
    p_id_turma: query.id_turma ? String(query.id_turma) : null,
    p_incluir_nao_publicadas: true,
  } as any);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // Filtra apenas as avaliações anteriores (exclui a avaliação atual)
  const todas = Array.isArray(data) ? data : [];
  const anteriores = todas.filter(
    (item: any) => item.id_avaliacao !== String(query.id_avaliacao_atual),
  );

  return anteriores;
});
