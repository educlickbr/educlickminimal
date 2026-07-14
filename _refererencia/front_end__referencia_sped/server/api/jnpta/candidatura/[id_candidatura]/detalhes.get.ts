import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

type PerguntaMeta = {
  id: string;
  slug: string | null;
  label: string | null;
  tipo: string | null;
  bloco: string | null;
  ordem: number | null;
  opcoes: any;
  primeiro_tempo: boolean;
  segundo_tempo: boolean;
};

type RespostaPrincipal = {
  id_pergunta: string;
  resposta?: string | null;
  resposta_texto?: string | null;
  resposta_valor?: string | null;
  resposta_json?: any;
};

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const idCandidatura = getRouterParam(event, "id_candidatura");
  if (!idCandidatura) {
    throw createError({ statusCode: 400, statusMessage: "Missing id_candidatura" });
  }

  const client = await serverSupabaseClient(event);

  try {
    const { data: listaData, error: listaError } = await (client.rpc as any)(
      "nxt_jnpta_listar_candidaturas_avaliacao",
      { p_status: null, p_include_rascunhos: true }
    );

    if (listaError) {
      throw createError({
        statusCode: 500,
        statusMessage: listaError.message || "Erro ao carregar candidatura",
      });
    }

    const candidaturas: any[] = Array.isArray(listaData) ? listaData : [];
    const candidatura = candidaturas.find((item) => item?.id_candidatura === idCandidatura);

    if (!candidatura) {
      throw createError({ statusCode: 404, statusMessage: "Candidatura não encontrada" });
    }

    let qualTempo: string | null = candidatura?.qual_tempo || null;
    const idEdital = candidatura?.id_edital || null;

    if (!qualTempo && idEdital) {
      const { data: editalData } = await client
        .from("jnpta_editais")
        .select("qual_tempo")
        .eq("id", idEdital)
        .maybeSingle();

      const editalAny: any = editalData;
      qualTempo = editalAny?.qual_tempo || null;
    }

// PRIMEIRO: Buscar dados do formulário
    const { data: formData, error: formError } = await (client.rpc as any)(
      "nxt_jnpta_form_get",
      { p_id_candidatura: idCandidatura }
    );

    if (formError) {
      throw createError({
        statusCode: 500,
        statusMessage: formError.message || "Erro ao carregar respostas do formulário",
      });
    }

    // SEGUNDO: Buscar integrantes mais completos
    const { data: integrantesData, error: integrantesError } = await (client.rpc as any)(
      "nxt_jnpta_get_integrantes",
      { p_id_candidatura: idCandidatura }
    );

    let integrantesCompletos: any[] = [];
    if (!integrantesError && integrantesData?.ok) {
      integrantesCompletos = integrantesData?.integrantes || [];
    } else {
      // Fallback para integrantes básicos da candidatura
      integrantesCompletos = candidatura?.integrantes || [];
      
      // Tentar enriquecer com dados das respostas do formulário
      if (integrantesCompletos.length > 0 && formData?.respostas_principal) {
        integrantesCompletos = await Promise.all(
          integrantesCompletos.map(async (integrante) => {
            const respostasIntegrante = formData.respostas_principal.filter(
              (r: any) => r.id_user_expandido === integrante.id_user
            );
            
            // Buscar CPF e telefone das respostas
            let cpf = null;
            let telefone = null;
            
            // Buscar metadados das perguntas para este integrante
            if (respostasIntegrante.length > 0) {
              const idsPerguntas = respostasIntegrante.map((r: any) => r.id_pergunta);
              const { data: perguntasIntegrante } = await client
                .from("jnpta_perguntas_formulario")
                .select("id, slug, tipo")
                .in("id", idsPerguntas);

              const perguntasIntegranteList: Array<{ id: string; slug: string | null; tipo: string | null }> =
                Array.isArray(perguntasIntegrante) ? perguntasIntegrante : [];

              if (perguntasIntegranteList.length > 0) {
                for (const resposta of respostasIntegrante) {
                  const pergunta = perguntasIntegranteList.find((p) => p.id === resposta.id_pergunta);
                  if (!pergunta) continue;
                  
                  const valor = resposta.resposta_texto || resposta.resposta;
                  if (!valor) continue;
                  
                  // Identificar CPF
                  if (pergunta.slug?.toLowerCase().includes('cpf')) {
                    cpf = valor;
                  }
                  // Identificar telefone
                  if (pergunta.slug?.toLowerCase().includes('telefone') || pergunta.tipo === 'telefone') {
                    telefone = valor;
                  }
                }
              }
            }
            
            return {
              ...integrante,
              cpf,
              telefone
            };
          })
        );
      }
    }

    // Enriquecer integrantes com campos vindos das respostas (quando disponíveis)
    if (integrantesCompletos.length > 0) {
      const respostasIntegrantes = integrantesCompletos
        .flatMap((integrante: any) => (Array.isArray(integrante?.respostas) ? integrante.respostas : []));

      const idsPerguntasIntegrantes = Array.from(
        new Set(
          respostasIntegrantes
            .map((r: any) => r?.id_pergunta)
            .filter((id: any): id is string => !!id)
        )
      );

      let perguntaIntegranteById = new Map<string, { slug: string | null; tipo: string | null; label: string | null }>();
      if (idsPerguntasIntegrantes.length > 0) {
        const { data: perguntasIntegrantesData } = await client
          .from("jnpta_perguntas_formulario")
          .select("id, slug, label, tipo")
          .in("id", idsPerguntasIntegrantes);

        const perguntasIntegrantes = Array.isArray(perguntasIntegrantesData)
          ? perguntasIntegrantesData
          : [];

        perguntaIntegranteById = new Map(
          perguntasIntegrantes.map((p: any) => [
            p.id,
            { slug: p.slug ?? null, tipo: p.tipo ?? null, label: p.label ?? null },
          ])
        );
      }

      const pickBySlug = (respostas: any[], matcher: (slug: string, tipo: string) => boolean): string | null => {
        for (const resposta of respostas) {
          const perguntaMeta = perguntaIntegranteById.get(resposta?.id_pergunta);
          const slug = String(perguntaMeta?.slug || '').toLowerCase();
          const tipo = String(perguntaMeta?.tipo || '').toLowerCase();
          if (!slug && !tipo) continue;

          const valor = resposta?.resposta_texto ?? resposta?.resposta ?? null;
          const texto = valor == null ? '' : String(valor).trim();
          if (!texto) continue;

          if (matcher(slug, tipo)) return texto;
        }
        return null;
      };

      integrantesCompletos = integrantesCompletos.map((integrante: any) => {
        const respostas = Array.isArray(integrante?.respostas) ? integrante.respostas : [];

        const cpfResposta = pickBySlug(respostas, (slug) => slug.includes('cpf'));
        const telefoneResposta = pickBySlug(respostas, (slug, tipo) => slug.includes('telefone') || tipo === 'telefone');

        const respostasDetalhes = respostas
          .map((resposta: any) => {
            const perguntaMeta = perguntaIntegranteById.get(resposta?.id_pergunta);
            const tipo = String(perguntaMeta?.tipo || '').toLowerCase();
            const valor = resposta?.resposta_texto ?? resposta?.resposta ?? null;
            const texto = valor == null ? '' : String(valor).trim();

            if (!texto) return null;
            if (tipo === 'arquivo') return null;

            return {
              id_pergunta: resposta?.id_pergunta,
              slug: perguntaMeta?.slug || null,
              label: perguntaMeta?.label || perguntaMeta?.slug || 'Campo',
              valor: texto,
            };
          })
          .filter(Boolean);

        return {
          ...integrante,
          cpf: integrante?.cpf || cpfResposta || null,
          telefone: integrante?.telefone || telefoneResposta || null,
          respostas_detalhes: respostasDetalhes,
        };
      });
    }

    // TERCEIRO: Processar respostas do formulário
    const respostasPrincipal: RespostaPrincipal[] = Array.isArray(formData?.respostas_principal)
      ? formData.respostas_principal
      : [];

    const idsPerguntas = Array.from(
      new Set(
        respostasPrincipal
          .map((resposta) => resposta?.id_pergunta)
          .filter((id): id is string => !!id)
      )
    );

    let perguntasMeta: PerguntaMeta[] = [];
    if (idsPerguntas.length > 0) {
      const { data: perguntasData, error: perguntasError } = await client
        .from("jnpta_perguntas_formulario")
        .select("id, slug, label, tipo, bloco, ordem, opcoes, primeiro_tempo, segundo_tempo")
        .in("id", idsPerguntas);

      if (perguntasError) {
        throw createError({
          statusCode: 500,
          statusMessage: perguntasError.message || "Erro ao carregar metadados das perguntas",
        });
      }

      perguntasMeta = Array.isArray(perguntasData) ? (perguntasData as PerguntaMeta[]) : [];

      if (qualTempo === "primeiro_tempo") {
        perguntasMeta = perguntasMeta.filter((pergunta) => pergunta.primeiro_tempo);
      } else if (qualTempo === "segundo_tempo") {
        perguntasMeta = perguntasMeta.filter((pergunta) => pergunta.segundo_tempo);
      }
    }

    const perguntaById = new Map(perguntasMeta.map((pergunta) => [pergunta.id, pergunta]));

    // Extrair documentos das respostas tipo 'arquivo'
    const documentos: any[] = [];
    const blocosMap = new Map<string, any[]>();
    
    // Também extrair dados da empresa das respostas dos blocos dados_grupo, endereco, etc.
    const dadosEmpresaComputados: any = {};
    
    for (const resposta of respostasPrincipal) {
      const pergunta = perguntaById.get(resposta.id_pergunta);
      if (!pergunta) continue;

      const valor =
        resposta.resposta_texto ?? resposta.resposta ?? resposta.resposta_valor ?? resposta.resposta_json ?? null;

      // Se for pergunta tipo arquivo e tem resposta, adicionar aos documentos
      if (pergunta.tipo === 'arquivo' && valor) {
        const nomeOriginal = resposta.resposta_json?.nome_original || 
                           resposta.resposta_json?.originalName || 
                           null;
        documentos.push({
          id_pergunta: pergunta.id,
          slug: pergunta.slug,
          label: pergunta.label,
          bloco: pergunta.bloco,
          nome_arquivo: valor,
          nome_original: nomeOriginal,
          tipo: 'arquivo'
        });
      }

      // Capturar dados da empresa das respostas (dinâmico)
      if (pergunta.bloco === 'dados_grupo' || pergunta.bloco === 'endereco') {
        if (pergunta.slug && valor) {
          dadosEmpresaComputados[pergunta.slug] = valor;
        }
      }

      // Adicionar também aos blocos para visualização por bloco
      const bloco = pergunta.bloco || "outros";
      if (!blocosMap.has(bloco)) blocosMap.set(bloco, []);

      blocosMap.get(bloco)?.push({
        id_pergunta: pergunta.id,
        slug: pergunta.slug,
        label: pergunta.label,
        tipo: pergunta.tipo,
        ordem: pergunta.ordem ?? 0,
        opcoes: pergunta.opcoes,
        resposta: valor,
      });
    }

    // Mesclar dados básicos do grupo com dados dinâmicos das respostas
    const grupoCompleto = {
      ...(formData?.grupo || candidatura?.grupo || {}),
      ...dadosEmpresaComputados
    };

    const blocos = Array.from(blocosMap.entries())
      .map(([bloco, perguntas]) => ({
        bloco,
        perguntas: perguntas.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
      }))
      .sort((a, b) => a.bloco.localeCompare(b.bloco));

    let atividades: any[] = [];
    if (qualTempo === "primeiro_tempo") {
      const { data: atividadesData, error: atividadesError } = await (client.rpc as any)(
        "nxt_jnpta_avaliacao_get_atividades_respostas",
        { p_id_candidatura: idCandidatura }
      );

      if (!atividadesError) {
        const atividadesPayload = atividadesData?.atividades;
        atividades = Array.isArray(atividadesPayload) ? atividadesPayload : [];
      }
    }

    return {
      ok: true,
      candidatura: {
        ...candidatura,
        qual_tempo: qualTempo,
      },
      grupo: grupoCompleto,
      integrantes: integrantesCompletos,
      documentos,
      blocos,
      atividades,
    };
  } catch (err: any) {
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || "Internal server error",
    });
  }
});
