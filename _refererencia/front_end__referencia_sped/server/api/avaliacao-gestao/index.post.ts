import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const client = await serverSupabaseClient(event);

  const { data, error } = await (client.rpc as any)("avl_upsert_avaliacao", {
    p_id: body.id ?? null,
    p_ano_semestre: body.ano_semestre ?? null,
    p_etapa: body.etapa ?? null,
    p_id_avaliador_1: body.id_avaliador_1 ?? null,
    p_id_avaliador_2: body.id_avaliador_2 ?? null,
  });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // Se for criação (sem id), já cria o "Conceito Final" automaticamente
  if (!body.id && data?.id) {
    const { error: errConceitoFinal } = await (client.rpc as any)(
      "avl_upsert_criterio",
      {
        p_id_avaliacao: data.id,
        p_criterio: "Conceito Final",
        p_ordem: 99,
        p_id: null,
      },
    );

    if (errConceitoFinal) {
      // A avaliação foi criada — o Conceito Final é um extra, não quebra o fluxo
      console.error("Erro ao criar Conceito Final:", errConceitoFinal);
    }
  }

  return data;
});
