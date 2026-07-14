import { serverSupabaseClient } from "#supabase/server";
import { resolvePublicBaseUrl } from "../../utils/avaliacao-publica";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  const query = getQuery(event);
  const nomeExibicao = typeof query.nome === "string" ? query.nome : "registro";

  if (!token || !UUID_REGEX.test(token)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token inválido",
    });
  }

  const client = await serverSupabaseClient(event);
  const baseUrl = resolvePublicBaseUrl(event);

  const { data, error } = await client.rpc(
    "avl_get_avaliacao_publica_por_token",
    {
      p_token: token,
      p_base_url: baseUrl,
    } as any,
  );

  if (error) {
    console.error("[API] Erro ao buscar avaliação pública:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erro ao buscar avaliação pública",
    });
  }

  const avaliacao = data?.[0] as Record<string, any> | undefined;

  if (!avaliacao) {
    const { data: tokenInfo, error: tokenError } = (await client
      .from("avl_resultado_global")
      .select("token_publico_expira_em, acesso_publico_ativo, publicado")
      .eq("token_publico", token)
      .maybeSingle()) as {
      data: {
        publicado: boolean;
        acesso_publico_ativo: boolean;
        token_publico_expira_em: string;
      } | null;
      error: any;
    };

    if (tokenError) {
      console.error(
        "[API] Erro ao verificar estado do token público:",
        tokenError,
      );
    }

    if (
      tokenInfo?.publicado &&
      tokenInfo?.acesso_publico_ativo &&
      tokenInfo?.token_publico_expira_em
    ) {
      const expirado =
        new Date(tokenInfo.token_publico_expira_em).getTime() <= Date.now();

      if (expirado) {
        return {
          ok: false,
          avaliacao: null,
          message: "Link expirado. Favor gerar um novo.",
          expired: true,
          token_publico_expira_em: tokenInfo.token_publico_expira_em,
        };
      }
    }

    return {
      ok: false,
      avaliacao: null,
      message: "Avaliação indisponível no momento.",
      expired: false,
      token_publico_expira_em: tokenInfo?.token_publico_expira_em || null,
    };
  }

  const { data: nomeData, error: nomeError } = (await client.rpc(
    "avl_get_nome_publico_por_token",
    {
      p_token: token,
      p_nome_exibicao: nomeExibicao,
    } as any,
  )) as { data: Array<{ nome_aluno: string }> | null; error: any };

  if (nomeError) {
    console.error("[API] Erro ao buscar nome público da avaliação:", nomeError);
    throw createError({
      statusCode: 500,
      statusMessage: "Erro ao buscar nome público da avaliação",
    });
  }

  return {
    ok: true,
    avaliacao: {
      ...avaliacao,
      nome_aluno: nomeData?.[0]?.nome_aluno || avaliacao.nome_aluno,
    },
    expired: false,
    token_publico_expira_em: avaliacao.token_publico_expira_em || null,
  };
});
