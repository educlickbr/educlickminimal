// @ts-nocheck - ofetch type inference excessivamente profunda
import { ref, computed, type Ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";
import { getAnoSemestre } from "../../../utils/ano_semestre";

type JnptaTempo = "primeiro_tempo" | "segundo_tempo";

export function useJnptaCandidaturas(activeTab: Ref<string>) {
  const { showToast } = useToast();

  // ──────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────

  const candidaturas = ref<any[]>([]);
  const isLoading = ref(true);
  const isLoadingDashboard = ref(false);
  const dashboardStats = ref<Record<string, any> | null>(null);
  const anoSemestreCandidaturas = ref<string>(getAnoSemestre());
  const filtroQualTempo = ref<"todos" | JnptaTempo>("todos");
  const incluirRascunhos = ref(false);
  const updatingCandidaturaStatusId = ref<string | null>(null);
  const showDetalhesModal = ref(false);
  const loadingDetalhes = ref(false);
  const detalhesCandidatura = ref<any | null>(null);
  const detalheTab = ref<string>("resumo");
  const hashBaseDocumentos = ref<string | null>(null);
  const openingDocumento = ref<Record<string, boolean>>({});
  const expandedSections = ref<
    Record<
      string,
      {
        integrantes: boolean;
        detalhes: boolean;
        documentos: boolean;
      }
    >
  >({});

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  const toggleSection = (
    id: string,
    section: "integrantes" | "detalhes" | "documentos",
  ) => {
    if (!expandedSections.value[id]) {
      expandedSections.value[id] = {
        integrantes: false,
        detalhes: false,
        documentos: false,
      };
    }

    expandedSections.value[id][section] = !expandedSections.value[id][section];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      enviada: "Enviada",
      em_analise: "Em Análise",
      aprovada: "Aprovada",
      reprovada: "Reprovada",
      suplente: "Suplente",
    };
    return labels[status] || status;
  };

  const getIntegrantePrincipalNome = (item: any) => {
    const primeiro =
      Array.isArray(item?.integrantes) && item.integrantes.length > 0
        ? item.integrantes[0]
        : null;
    if (!primeiro) return null;
    const nome = [primeiro.nome, primeiro.sobrenome]
      .filter(Boolean)
      .join(" ")
      .trim();
    return nome || null;
  };

  const getNomeExibicaoCandidatura = (item: any) => {
    if (item?.qual_tempo === "primeiro_tempo") {
      return (
        getIntegrantePrincipalNome(item) ||
        item?.nome_direcao_artistica ||
        item?.nome_grupo ||
        "Sem identificação"
      );
    }

    return (
      item?.nome_grupo_resposta ||
      item?.nome_grupo ||
      item?.id_grupo ||
      item?.id_candidatura ||
      "Sem identificação"
    );
  };

  const getSubtituloCandidatura = (item: any) => {
    if (item?.qual_tempo === "primeiro_tempo") {
      return `Direção artística: ${item?.nome_direcao_artistica || "Não informado"}`;
    }

    return `Direção artística: ${item?.nome_direcao_artistica || item?.id_direcao_artistica || "Não informado"}`;
  };

  const getTempoLabel = (qualTempo?: string | null) => {
    if (qualTempo === "primeiro_tempo") return "Primeiro Tempo";
    if (qualTempo === "segundo_tempo") return "Segundo Tempo";
    return "Tempo não informado";
  };

  const formatBlocoLabel = (value: string) => {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const normalizeTabKey = (value: string) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "_");

  // ──────────────────────────────────────────────
  // Computeds — Detalhes Modal
  // ──────────────────────────────────────────────

  const detalhesTabs = computed(() => {
    const tabs: Array<{ key: string; label: string }> = [
      { key: "resumo", label: "Resumo" },
    ];
    const qualTempo = detalhesCandidatura.value?.candidatura?.qual_tempo;
    const isPrimeiroTempo = qualTempo === "primeiro_tempo";
    const blocos = Array.isArray(detalhesCandidatura.value?.blocos)
      ? detalhesCandidatura.value.blocos
      : [];
    const blocosNormalizados = new Set(
      blocos.map((b: any) => normalizeTabKey(b?.bloco || "")),
    );

    if (isPrimeiroTempo) {
      tabs.push({ key: "atividades", label: "Atividades" });
    }

    if (!isPrimeiroTempo && detalhesCandidatura.value?.grupo) {
      tabs.push({ key: "direcao_artistica", label: "Direção Artística" });
    }

    if (
      !isPrimeiroTempo &&
      (blocosNormalizados.has("documentos_empresa") ||
        documentosPorCategoria.value.empresa.length > 0)
    ) {
      tabs.push({ key: "documentos_empresa", label: "Documentos Empresa" });
    }

    if (
      !isPrimeiroTempo &&
      (blocosNormalizados.has("documentos_projeto") ||
        documentosPorCategoria.value.projeto.length > 0)
    ) {
      tabs.push({ key: "documentos_projeto", label: "Documentos Projeto" });
    }

    if (
      isPrimeiroTempo &&
      (blocosNormalizados.has("documentos") ||
        documentosPorCategoria.value.candidato.length > 0)
    ) {
      tabs.push({
        key: "documentos_candidato",
        label: "Documentos Candidato",
      });
    }

    const blocosExcluidos = new Set([
      "direcao_artistica",
      "integrantes",
      "documentos",
      "documentos_candidato",
      "documentos_empresa",
      "documentos_projeto",
    ]);

    for (const bloco of blocos) {
      const blocoKey = String(bloco?.bloco || "");
      const normalized = normalizeTabKey(blocoKey);
      if (!blocoKey || blocosExcluidos.has(normalized)) continue;
      tabs.push({ key: blocoKey, label: formatBlocoLabel(blocoKey) });
    }

    if (!isPrimeiroTempo) {
      tabs.push({ key: "integrantes", label: "Integrantes" });
    }
    return tabs;
  });

  const documentosPorCategoria = computed(() => {
    const docs = Array.isArray(detalhesCandidatura.value?.documentos)
      ? detalhesCandidatura.value.documentos
      : [];

    const projeto: any[] = [];
    const empresa: any[] = [];
    const candidato: any[] = [];
    const outros: any[] = [];

    for (const doc of docs) {
      const bloco = normalizeTabKey(String(doc?.bloco || ""));
      if (bloco.includes("documentos_projeto") || bloco.includes("projeto")) {
        projeto.push(doc);
        continue;
      }
      if (bloco.includes("documentos_empresa") || bloco.includes("empresa")) {
        empresa.push(doc);
        continue;
      }
      if (bloco === "documentos" || bloco.includes("documentos_candidato")) {
        candidato.push(doc);
        continue;
      }
      outros.push(doc);
    }

    return { projeto, empresa, candidato, outros };
  });

  const documentosProponente = computed(() => {
    return documentosPorCategoria.value.outros;
  });

  const respostasDirecaoArtisticaTexto = computed(() => {
    const blocos = Array.isArray(detalhesCandidatura.value?.blocos)
      ? detalhesCandidatura.value.blocos
      : [];
    const blocoDirecao = blocos.find(
      (b: any) => normalizeTabKey(b?.bloco || "") === "direcao_artistica",
    );
    const perguntas = Array.isArray(blocoDirecao?.perguntas)
      ? blocoDirecao.perguntas
      : [];

    return perguntas.filter((pergunta: any) => {
      const resposta = String(pergunta?.resposta || "").trim();
      const tipo = String(pergunta?.tipo || "").toLowerCase();
      return resposta && tipo !== "arquivo";
    });
  });

  const respostasPorSlug = computed(() => {
    const map = new Map<string, any>();
    const blocos = Array.isArray(detalhesCandidatura.value?.blocos)
      ? detalhesCandidatura.value.blocos
      : [];

    for (const bloco of blocos) {
      const perguntas = Array.isArray(bloco?.perguntas) ? bloco.perguntas : [];
      for (const pergunta of perguntas) {
        const slug = String(pergunta?.slug || "").trim();
        if (!slug) continue;
        const valor = pergunta?.resposta;
        if (valor == null) continue;
        const texto = String(valor).trim();
        if (!texto) continue;
        if (!map.has(slug)) map.set(slug, valor);
      }
    }

    return map;
  });

  const resumoGrupo = computed(() => {
    return {
      nome_grupo: getResumoValue(
        ["nome_do_grupo", "nome_grupo"],
        ["nome_grupo"],
      ),
      razao_social: getResumoValue(
        ["razao_social", "nome_da_empresa", "nome_empresa"],
        ["razao_social", "nome_empresa"],
      ),
      cnpj: getResumoValue(["cnpj_empresa", "cnpj"], ["cnpj"]),
      email_contato: getResumoValue(["email_contato"], ["email_contato"]),
      telefone_fixo: getResumoValue(["telefone_fixo"], ["telefone_fixo"]),
      telefone_celular: getResumoValue(
        ["telefone_celular_contato", "telefone_celular"],
        ["telefone_celular"],
      ),
      redes_sociais: getResumoValue(
        ["redes_sociais_grupo", "redes_sociais"],
        ["redes_sociais"],
      ),
      cep: getResumoValue(["endereco_cep", "cep"], ["cep"]),
      cidade: getResumoValue(["endereco_cidade", "cidade"], ["cidade"]),
      regiao_administrativa: getResumoValue(
        ["regiao_administrativa"],
        ["regiao_administrativa"],
      ),
      endereco: getResumoValue(
        ["endereco_logradouro", "endereco"],
        ["endereco"],
      ),
      numero: getResumoValue(["endereco_numero", "numero"], ["numero"]),
      complemento: getResumoValue(
        ["endereco_complemento", "complemento"],
        ["complemento"],
      ),
      banco: getResumoValue(["banco_nome", "banco"], ["banco"]),
      agencia: getResumoValue(["agencia_num", "agencia"], ["agencia"]),
      conta_corrente: getResumoValue(
        ["conta_corrente_num", "conta_corrente"],
        ["conta_corrente"],
      ),
      pix: getResumoValue(["pix_chave", "pix"], ["pix"]),
    };
  });

  const resumoIntegrantes = computed(() => {
    const lista = Array.isArray(detalhesCandidatura.value?.integrantes)
      ? detalhesCandidatura.value.integrantes
      : [];
    return lista.map((integrante: any) => {
      const nome = [integrante?.nome, integrante?.sobrenome]
        .filter(Boolean)
        .join(" ")
        .trim();
      return {
        nome: nome || "Integrante sem nome",
        funcao: integrante?.funcao || "-",
      };
    });
  });

  // ──────────────────────────────────────────────
  // Funções — Documentos
  // ──────────────────────────────────────────────

  const getDocumentoNomeExibicao = (doc: any) => {
    return doc?.label || doc?.nome_original || doc?.slug || "Documento";
  };

  const getDocumentoArquivoNomeExibicao = (doc: any) => {
    const nomeOriginal = String(doc?.nome_original || "").trim();
    if (nomeOriginal) return nomeOriginal;
    return "Arquivo anexado";
  };

  const getDocumentoArquivoHash = (doc: any) => {
    const nomeArquivo =
      doc?.nome_arquivo || doc?.resposta || doc?.fileName || "";
    return String(nomeArquivo || "");
  };

  const getDocumentoUrl = (doc: any) => {
    const hashBase = hashBaseDocumentos.value;
    const arquivo = getDocumentoArquivoHash(doc);
    if (!hashBase || !arquivo) return null;
    return `${hashBase}${arquivo}`;
  };

  const getDocumentosDaAba = (tabKey: string) => {
    if (tabKey === "documentos_empresa")
      return documentosPorCategoria.value.empresa;
    if (tabKey === "documentos_projeto")
      return documentosPorCategoria.value.projeto;
    if (tabKey === "documentos_candidato")
      return documentosPorCategoria.value.candidato;
    return [];
  };

  const getTituloAbaDocumentos = (tabKey: string) => {
    if (tabKey === "documentos_empresa") return "Documentos da Empresa";
    if (tabKey === "documentos_projeto") return "Documentos do Projeto";
    return "Documentos do Candidato";
  };

  const openDocumento = async (doc: any, indexKey: string) => {
    const arquivo = getDocumentoArquivoHash(doc);
    if (!arquivo) return;

    openingDocumento.value[indexKey] = true;
    try {
      let hashResult: any = null;
      try {
        hashResult = await ofetch("/api/refresh-hash-jnpta-documentos");
      } catch {
        hashResult = null;
      }
      const base = hashResult?.hash_base || hashBaseDocumentos.value;
      if (!base) return;

      hashBaseDocumentos.value = base;
      window.open(`${base}${arquivo}`, "_blank");
    } finally {
      openingDocumento.value[indexKey] = false;
    }
  };

  // ──────────────────────────────────────────────
  // Funções — Respostas / Resumo
  // ──────────────────────────────────────────────

  const formatCampoResposta = (valor: unknown) => {
    const texto = String(valor ?? "")
      .trim()
      .toLowerCase();
    if (texto === "true") return "Sim";
    if (texto === "false") return "Não";
    return String(valor ?? "");
  };

  const formatLoopIndex = (index: string | number) => {
    if (typeof index === "number") return index + 1;
    const parsed = Number.parseInt(index, 10);
    return Number.isNaN(parsed) ? 1 : parsed + 1;
  };

  const pickFirstFilled = (...values: any[]) => {
    for (const value of values) {
      if (value == null) continue;
      const text = String(value).trim();
      if (text) return value;
    }
    return null;
  };

  const getResumoValue = (slugs: string[], grupoKeys: string[] = []) => {
    const grupo = detalhesCandidatura.value?.grupo || {};
    const fromGrupo = grupoKeys.map((key) => grupo?.[key]);
    const fromRespostas = slugs.map((slug) => respostasPorSlug.value.get(slug));
    return pickFirstFilled(...fromRespostas, ...fromGrupo);
  };

  // ──────────────────────────────────────────────
  // Actions — Candidaturas
  // ──────────────────────────────────────────────

  const handleCandidaturaStatus = async (
    item: any,
    status: "aprovada" | "reprovada" | "suplente",
  ) => {
    const id = item?.id_candidatura || item?.id;
    if (!id) return;

    updatingCandidaturaStatusId.value = id;
    try {
      const response: any = await ofetch(
        `/api/jnpta/candidatura/${id}/status`,
        {
          method: "POST",
          body: { status },
        },
      );

      if (!response?.ok) {
        throw new Error(
          response?.erro || "Falha ao atualizar status da candidatura",
        );
      }

      item.status = status;
      showToast(`Status atualizado para ${getStatusLabel(status)}`, {
        type: "success",
      });
    } catch (e: any) {
      showToast(e?.message || "Erro ao atualizar status da candidatura", {
        type: "error",
      });
    } finally {
      updatingCandidaturaStatusId.value = null;
    }
  };

  const openDetalhesModal = async (item: any) => {
    const id = item?.id_candidatura || item?.id;
    if (!id) return;

    showDetalhesModal.value = true;
    loadingDetalhes.value = true;
    detalhesCandidatura.value = null;
    detalheTab.value = "resumo";

    try {
      const [result, hashResult] = await Promise.all([
        ofetch<any>(`/api/jnpta/candidatura/${id}/detalhes`),
        ofetch<any>("/api/refresh-hash-jnpta-documentos").catch(() => null),
      ]);
      if (!result?.ok) {
        throw new Error(
          result?.erro || "Falha ao carregar detalhes da candidatura",
        );
      }

      detalhesCandidatura.value = result;
      hashBaseDocumentos.value = hashResult?.hash_base || null;
    } catch (e: any) {
      showToast(e?.message || "Erro ao carregar detalhes da candidatura", {
        type: "error",
      });
      showDetalhesModal.value = false;
    } finally {
      loadingDetalhes.value = false;
    }
  };

  const closeDetalhesModal = () => {
    showDetalhesModal.value = false;
    detalhesCandidatura.value = null;
    detalheTab.value = "resumo";
    hashBaseDocumentos.value = null;
  };

  const fetchCandidaturas = async () => {
    isLoading.value = true;
    isLoadingDashboard.value = activeTab.value === "selecionados";

    try {
      const status = undefined;
      const qual_tempo =
        filtroQualTempo.value === "todos" ? undefined : filtroQualTempo.value;
      const include_rascunhos = incluirRascunhos.value;
      const ano_semestre =
        anoSemestreCandidaturas.value === "todos"
          ? undefined
          : anoSemestreCandidaturas.value;

      const result: any = await ofetch("/api/jnpta/candidatura/avaliacao", {
        query: {
          status,
          qual_tempo,
          include_rascunhos,
          ano_semestre,
        },
      });

      candidaturas.value = result?.candidaturas || [];

      if (activeTab.value === "selecionados") {
        const dashboardResult: any = await ofetch("/api/jnpta/dashboard", {
          query: {
            qual_tempo,
            include_rascunhos,
            ano_semestre,
          },
        });
        dashboardStats.value = dashboardResult || null;
      } else {
        dashboardStats.value = null;
      }
    } catch (e: any) {
      console.error("Error loading candidaturas:", e);
      showToast("Erro ao carregar inscrições", { type: "error" });
    } finally {
      isLoading.value = false;
      isLoadingDashboard.value = false;
    }
  };

  const fetchDashboardEditais = async (idEdital?: string) => {
    if (activeTab.value !== "editais") return;

    try {
      const response: any = await ofetch("/api/jnpta/dashboard/editais", {
        query: idEdital ? { id_edital: idEdital } : {},
      });

      return {
        dashboard: response?.dashboard || null,
        id_edital: (response?.dashboard?.id_edital as string) || null,
      };
    } catch (e) {
      console.error("Error loading dashboard editais:", e);
      return { dashboard: null, id_edital: null };
    }
  };

  const handleCandidaturasFiltersChange = () => {
    if (activeTab.value === "editais") return;
    fetchCandidaturas();
  };

  // ──────────────────────────────────────────────
  // Return
  // ──────────────────────────────────────────────

  return {
    // State
    candidaturas,
    isLoading,
    isLoadingDashboard,
    dashboardStats,
    anoSemestreCandidaturas,
    filtroQualTempo,
    incluirRascunhos,
    updatingCandidaturaStatusId,
    showDetalhesModal,
    loadingDetalhes,
    detalhesCandidatura,
    detalheTab,
    hashBaseDocumentos,
    openingDocumento,
    expandedSections,

    // Helpers
    toggleSection,
    getStatusLabel,
    getIntegrantePrincipalNome,
    getNomeExibicaoCandidatura,
    getSubtituloCandidatura,
    getTempoLabel,
    formatBlocoLabel,
    normalizeTabKey,

    // Computeds
    detalhesTabs,
    documentosPorCategoria,
    documentosProponente,
    respostasDirecaoArtisticaTexto,
    respostasPorSlug,
    resumoGrupo,
    resumoIntegrantes,

    // Funções — Documentos
    getDocumentoNomeExibicao,
    getDocumentoArquivoNomeExibicao,
    getDocumentoArquivoHash,
    getDocumentoUrl,
    getDocumentosDaAba,
    getTituloAbaDocumentos,
    openDocumento,

    // Funções — Respostas / Resumo
    formatCampoResposta,
    formatLoopIndex,
    pickFirstFilled,
    getResumoValue,

    // Actions
    handleCandidaturaStatus,
    openDetalhesModal,
    closeDetalhesModal,
    fetchCandidaturas,
    fetchDashboardEditais,
    handleCandidaturasFiltersChange,
  };
}
