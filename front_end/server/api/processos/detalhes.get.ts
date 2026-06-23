import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/processos/detalhes?id_inscricao=UUID
 *
 * Retorna tudo para o modal de detalhes:
 * - Config do formulário (blocos + perguntas)
 * - Respostas do usuário
 * - Dados da inscrição (programa, processo, área)
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const query = getQuery(event);
  const id_inscricao = query.id_inscricao as string;

  if (!id_inscricao) {
    throw createError({
      statusCode: 400,
      message: "id_inscricao é obrigatório",
    });
  }

  // 1. Buscar inscrição com dados do processo e programa
  const { data: inscricao, error: errInsc } = await client
    .from("aca_processo_seletivo_inscricoes")
    .select(
      `
            id, criado_em, tipo_candidatura, status_dados, status_documentacao, status_candidatura,
            id_usuario, id_processo, id_programa,
            user:user_expandido!aca_processo_seletivo_inscricoes_id_usuario_fkey(nome_completo, email),
            processo:aca_processo_seletivo!aca_processo_seletivo_inscricoes_id_processo_fkey(
                id, nome_processo,
                programa:aca_programa(id, descricao, id_area, id_entidade)
            )
        `,
    )
    .eq("id", id_inscricao)
    .single();

  if (errInsc || !inscricao) {
    throw createError({ statusCode: 404, message: "Inscrição não encontrada" });
  }

  const processo = (inscricao as any).processo;
  const programa = processo?.programa;
  const id_entidade = programa?.id_entidade;
  const programa_id = inscricao.id_programa;
  const area_id = programa?.id_area;

  // 2. Buscar config do formulário (hierarquia: programa → área)
  const { data: blocos, error: errConfig } = await client.rpc(
    "aca_get_form_config_completo",
    {
      p_id_entidade: id_entidade,
      p_programa_id: programa_id,
      p_area_id: area_id,
      p_tipo_proc: "seletivo",
      p_tipo_cand: (inscricao as any).tipo_candidatura || "estudante",
    } as any,
  );

  if (errConfig) {
    throw createError({ statusCode: 500, message: errConfig.message });
  }

  // 3. Coletar ids das perguntas
  const perguntas: any[] = [];
  for (const bloco of (blocos as any[]) || []) {
    for (const p of bloco.perguntas || []) {
      perguntas.push(p);
    }
  }
  const perguntaIds = perguntas.map((p) => p.pergunta_id);

  // 4. Buscar respostas do usuário
  let respostas: Record<string, any> = {};
  if (perguntaIds.length > 0) {
    const { data: respData, error: errResp } = await client.rpc(
      "aca_get_respostas_usuario",
      {
        p_id_user_expandido: inscricao.id_usuario,
        p_pergunta_ids: perguntaIds,
      } as any,
    );

    if (!errResp && respData) {
      for (const [pid, val] of Object.entries(
        respData as Record<string, any>,
      )) {
        respostas[pid] = (val as any).resposta;
        if ((val as any).id_arquivo) {
          respostas[pid + "_id_arquivo"] = (val as any).id_arquivo;
        }
      }
    }
  }

  return {
    success: true,
    inscricao: {
      id: inscricao.id,
      criado_em: inscricao.criado_em,
      tipo_candidatura: (inscricao as any).tipo_candidatura,
      status_dados: (inscricao as any).status_dados,
      usuario: (inscricao as any).user,
    },
    processo: {
      id: processo.id,
      nome_processo: processo.nome_processo,
      programa_nome: programa?.descricao || "",
    },
    blocos,
    perguntas,
    respostas,
  };
});
