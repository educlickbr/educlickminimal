import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useAvaliacaoGestaoCriarAvaliacao() {
  // ── Listar / Buscar (CriarTab + [id]) ──
  const avaliacoes = ref<any[]>([]);
  const isLoadingAv = ref(false);

  const fetchAvaliacoes = async (etapa: string | null) => {
    isLoadingAv.value = true;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao", {
        params: { etapa: etapa || null },
      });
      avaliacoes.value = data || [];
    } catch (e) {
      console.error(e);
      avaliacoes.value = [];
    } finally {
      isLoadingAv.value = false;
    }
  };

  const deleteAvaliacao = async (id: string) => {
    await ofetch(`/api/avaliacao-gestao/${id}`, { method: "DELETE" });
  };

  // ── Turmas (Modal) ──
  const loadingTurmas = ref(false);

  const fetchTurmas = async (anoSemestre?: string) => {
    loadingTurmas.value = true;
    try {
      const data: any = await ofetch("/api/cursos-turmas/turmas", {
        params: {
          limite: 200,
          area: "Regulares",
          ano_semestre: anoSemestre || undefined,
        },
      });
      return data?.itens || [];
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      loadingTurmas.value = false;
    }
  };

  // ── Upsert Avaliação (Modal) ──
  const upsertAvaliacao = async (body: {
    id?: string | null;
    ano_semestre: string;
    etapa: string;
    id_avaliador_1?: string | null;
    id_avaliador_2?: string | null;
  }) => {
    const result: any = await ofetch("/api/avaliacao-gestao", {
      method: "POST",
      body,
    });
    return result;
  };

  // ── Ações (vincular/desvincular turmas) ──
  const acaoTurma = async (
    id_avaliacao: string | null,
    id_turma: string,
    desvincular: boolean,
  ) => {
    if (!id_avaliacao) return;
    await ofetch("/api/avaliacao-gestao/acoes", {
      method: "POST",
      body: { id_avaliacao, id_turma, desvincular },
    });
  };

  // ── Critérios ──
  const fetchCriterios = async (id_avaliacao: string) => {
    try {
      const data = await ofetch("/api/avaliacao-gestao/criterios", {
        params: { id_avaliacao },
      });
      return data || [];
    } catch {
      return [];
    }
  };

  const saveCriterio = async (body: {
    id_avaliacao: string;
    criterio: string;
    ordem: number;
    id?: string | null;
  }) => {
    await ofetch("/api/avaliacao-gestao/criterios", {
      method: "POST",
      body,
    });
  };

  // ── Turmas vinculadas ──
  const fetchTurmasAvaliacao = async (id_avaliacao: string) => {
    try {
      const data = await ofetch("/api/avaliacao-gestao/turmas-avaliacao", {
        params: { id_avaliacao },
      });
      return data || [];
    } catch {
      return [];
    }
  };

  // ── Excluir critério ──
  const deleteCriterio = async (id: string) => {
    await ofetch("/api/avaliacao-gestao/acoes", {
      method: "POST",
      body: { excluir: true, id },
    });
  };

  // ── Avaliadores (Docentes) ──
  const fetchAvaliadores = async (busca?: string) => {
    const params: any = { limit: 100 };
    if (busca && busca.length >= 2) params.busca = busca;
    const data: any = await ofetch("/api/avaliacao-gestao/docentes-minima", {
      params,
    });
    return (data || []).map((d: any) => ({
      nome: `${d.nome} ${d.sobrenome}`,
      id: d.id,
    }));
  };

  return {
    avaliacoes,
    isLoadingAv,
    fetchAvaliacoes,
    deleteAvaliacao,
    loadingTurmas,
    fetchTurmas,
    upsertAvaliacao,
    acaoTurma,
    fetchCriterios,
    saveCriterio,
    fetchTurmasAvaliacao,
    deleteCriterio,
    fetchAvaliadores,
  };
}
