import { $fetch as ofetch } from "ofetch";
import { formatInTimeZone } from "date-fns-tz";
import { buildProtectedFileUrl } from "~/utils/protected-file-url";
import { useToast } from "../../../composables/useToast";

const JUSTIFICATIVA_TIMEZONE = "America/Sao_Paulo";

export function useMatriculasJustificativas() {
  const { showToast } = useToast();
  const justificativas = ref<any[]>([]);
  const isLoading = ref(false);
  const processingId = ref<string | null>(null);
  const editingAvaliacaoId = ref<string | null>(null);
  const avaliacaoDraft = ref("");

  const editingDateId = ref<string | null>(null);
  const savingDateId = ref<string | null>(null);
  const dateDrafts = reactive<Record<string, { inicio: string; fim: string }>>(
    {},
  );

  const limit = 20;
  const paginacao = ref({
    pagina_atual: 1,
    qtd_paginas: 0,
    qtd_total: 0,
  });

  const enrichComBolsaStatus = async (
    lista: any[],
    anoSemestre: string,
    idTurma: string | null,
  ) => {
    if (!Array.isArray(lista) || lista.length === 0) return [];
    const idsMatricula = lista
      .map((item) => item?.id_matricula)
      .filter((id) => typeof id === "string" && id.length > 0);
    if (idsMatricula.length === 0)
      return lista.map((item) => ({ ...item, tem_bolsa_ativa: false }));

    try {
      const payload = await ofetch("/api/bolsas/atribuicoes/status", {
        method: "POST",
        body: {
          id_matriculas: idsMatricula,
          ano_semestre: anoSemestre,
          id_turma: idTurma,
        },
      });
      const statusByMatricula = payload?.statusByMatricula || {};
      return lista.map((item) => ({
        ...item,
        tem_bolsa_ativa: Boolean(statusByMatricula[item?.id_matricula]),
      }));
    } catch (error) {
      console.error(
        "Erro ao carregar status de bolsas nas justificativas:",
        error,
      );
      return lista.map((item) => ({ ...item, tem_bolsa_ativa: false }));
    }
  };

  const fetchJustificativas = async (
    anoSemestre: string,
    filters: {
      curso: string;
      status_justificativa: string;
      escopo: string;
      busca_atestado: string;
      data_atestado: string;
    },
    page = 1,
  ) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch("/api/matriculas/justificativas", {
        params: {
          ano_semestre: anoSemestre,
          id_turma: filters.curso || null,
          status: filters.status_justificativa || null,
          escopo: filters.escopo || null,
          busca: filters.busca_atestado || null,
          data: filters.data_atestado || null,
          page,
          limit,
        },
      });
      const rawData = data || [];
      justificativas.value = await enrichComBolsaStatus(
        rawData,
        anoSemestre,
        filters.curso || null,
      );
      const total = rawData.length > 0 ? Number(rawData[0].total_count) : 0;
      paginacao.value = {
        pagina_atual: page,
        qtd_paginas: Math.ceil(total / limit),
        qtd_total: total,
      };
    } catch (e) {
      console.error("Erro ao buscar justificativas:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const updateStatus = async (
    id: string,
    status: "Em Análise" | "Aprovado" | "Reprovado",
    avaliacao_submissao?: string,
  ) => {
    processingId.value = id;
    try {
      await ofetch("/api/matriculas/justificativas/update-status", {
        method: "POST",
        body: { id, status, avaliacao_submissao },
      });
      showToast(`Status atualizado para ${status}.`, { type: "success" });
      // Atualiza localmente (spread para garantir reatividade)
      const idx = justificativas.value.findIndex((j: any) => j.id === id);
      if (idx !== -1) {
        justificativas.value[idx] = { ...justificativas.value[idx], status };
      }
    } catch (e: any) {
      console.error("Erro ao atualizar status:", e);
      showToast("Erro ao atualizar status.", { type: "error" });
    } finally {
      processingId.value = null;
    }
  };

  const saveAvaliacao = async (id: string) => {
    processingId.value = id;
    try {
      await ofetch("/api/matriculas/justificativas/update-avaliacao", {
        method: "POST",
        body: { id, avaliacao_submissao: avaliacaoDraft.value },
      });
      showToast("Avaliação atualizada.", { type: "success" });
      const idx = justificativas.value.findIndex((j: any) => j.id === id);
      if (idx !== -1)
        justificativas.value[idx].avaliacao_submissao = avaliacaoDraft.value;
      editingAvaliacaoId.value = null;
    } catch (e: any) {
      console.error("Erro ao salvar avaliação:", e);
      showToast("Erro ao salvar avaliação.", { type: "error" });
    } finally {
      processingId.value = null;
    }
  };

  const updateEscopo = async (item: any) => {
    const novoEscopo =
      item.escopo === "atestado" ? "justificativa" : "atestado";
    processingId.value = item.id;
    try {
      await ofetch("/api/matriculas/justificativas/update-escopo", {
        method: "POST",
        body: { id: item.id, escopo: novoEscopo },
      });
      showToast(`Escopo alterado para ${novoEscopo}.`, { type: "success" });
      // Atualiza localmente (spread para garantir reatividade)
      const idx = justificativas.value.findIndex((j: any) => j.id === item.id);
      if (idx !== -1) {
        justificativas.value[idx] = {
          ...justificativas.value[idx],
          escopo: novoEscopo,
        };
      }
    } catch (e: any) {
      console.error("Erro ao alterar escopo:", e);
      showToast("Erro ao alterar escopo.", { type: "error" });
    } finally {
      processingId.value = null;
    }
  };

  const openAttachment = async (path: string) => {
    if (!path) return;
    try {
      const { hash_base, error } = (await ofetch(
        "/api/refresh-hash-secretaria",
      )) as { hash_base: string | null; error?: string };
      if (error || !hash_base) {
        showToast("Erro ao gerar link de acesso ao arquivo.", {
          type: "error",
        });
        return;
      }
      const finalUrl = buildProtectedFileUrl(hash_base, path, "secretaria");
      window.open(finalUrl, "_blank");
    } catch (e) {
      console.error("Erro ao abrir arquivo:", e);
      showToast("Erro ao abrir o arquivo.", { type: "error" });
    }
  };

  // --- Date Editor ---
  const getDateInputValue = (dateString?: string | null) => {
    if (!dateString) return "";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return "";
    return formatInTimeZone(parsedDate, JUSTIFICATIVA_TIMEZONE, "yyyy-MM-dd");
  };

  const openDateEditor = (item: any) => {
    editingDateId.value = item.id;
    dateDrafts[item.id] = {
      inicio: getDateInputValue(item.data_inicio_janela),
      fim: getDateInputValue(item.data_fim_janela),
    };
  };

  const cancelDateEdit = (id: string) => {
    if (editingDateId.value === id) editingDateId.value = null;
    delete dateDrafts[id];
  };

  const saveDates = async (item: any) => {
    const draft = dateDrafts[item.id];
    if (!draft || !draft.inicio || !draft.fim) {
      showToast("Informe ambas as datas de vigência.", { type: "error" });
      return;
    }
    try {
      savingDateId.value = item.id;
      await ofetch("/api/matriculas/justificativas/update-datas", {
        method: "POST",
        body: {
          id: item.id,
          data_inicio_janela: draft.inicio,
          data_fim_janela: draft.fim,
        },
      });
      showToast("Datas de vigência atualizadas com sucesso.", {
        type: "success",
      });
      // Update local state
      const idx = justificativas.value.findIndex((j: any) => j.id === item.id);
      if (idx !== -1) {
        justificativas.value[idx].data_inicio_janela = draft.inicio;
        justificativas.value[idx].data_fim_janela = draft.fim;
      }
      cancelDateEdit(item.id);
    } catch (e) {
      console.error("Erro ao atualizar datas de vigência:", e);
      showToast("Erro ao atualizar as datas de vigência.", { type: "error" });
    } finally {
      savingDateId.value = null;
    }
  };

  return {
    justificativas,
    isLoading,
    paginacao,
    limit,
    processingId,
    editingAvaliacaoId,
    avaliacaoDraft,
    editingDateId,
    savingDateId,
    dateDrafts,
    fetchJustificativas,
    updateStatus,
    saveAvaliacao,
    updateEscopo,
    openAttachment,
    openDateEditor,
    cancelDateEdit,
    saveDates,
  };
}
