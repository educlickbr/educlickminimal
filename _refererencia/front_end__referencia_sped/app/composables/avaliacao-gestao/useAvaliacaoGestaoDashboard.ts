import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useAvaliacaoGestaoDashboard() {
  const dashboardStats = ref<any>(null);
  const loadingDashboard = ref(false);

  const fetchDashboard = async (idAvaliacao: string, idTurma: string) => {
    if (!idTurma || !idAvaliacao) {
      dashboardStats.value = null;
      return;
    }
    loadingDashboard.value = true;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao/dashboard", {
        params: { id_avaliacao: idAvaliacao, id_turma: idTurma },
      });
      dashboardStats.value = data || null;
    } catch (error) {
      console.error(error);
      dashboardStats.value = null;
    } finally {
      loadingDashboard.value = false;
    }
  };

  // ── Dashboard Contexto ──
  const dashboardContexto = ref<any[]>([]);
  const loadingDashboardContexto = ref(false);

  const fetchDashboardContexto = async (
    idsTurmas: string[],
    anoSemestre: string,
    etapa: string,
  ) => {
    if (!idsTurmas.length || !anoSemestre || !etapa) {
      dashboardContexto.value = [];
      return;
    }
    loadingDashboardContexto.value = true;
    try {
      const data: any = await ofetch(
        "/api/avaliacao-gestao/dashboard-contexto",
        {
          params: {
            id_turmas: idsTurmas.join(","),
            ano_semestre: anoSemestre,
            etapa,
          },
        },
      );
      dashboardContexto.value = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(error);
      dashboardContexto.value = [];
    } finally {
      loadingDashboardContexto.value = false;
    }
  };

  // ── Resumo Conceitos ──
  const resumoConceitos = ref<any[]>([]);
  const loadingResumoConceitos = ref(false);

  const fetchResumoConceitos = async (
    idsTurmas: string[],
    anoSemestre: string,
    etapa: string,
  ) => {
    if (!idsTurmas.length || !anoSemestre || !etapa) {
      resumoConceitos.value = [];
      return;
    }
    loadingResumoConceitos.value = true;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao/resumo-conceitos", {
        params: {
          id_turmas: idsTurmas.join(","),
          ano_semestre: anoSemestre,
          etapa,
        },
      });
      resumoConceitos.value = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(error);
      resumoConceitos.value = [];
    } finally {
      loadingResumoConceitos.value = false;
    }
  };

  // ── Publicar Lote ──
  const bulkPublishing = ref(false);

  const publicarLote = async (idAvaliacao: string, idTurma: string) => {
    bulkPublishing.value = true;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao/publicar-lote", {
        method: "POST",
        body: { id_avaliacao: idAvaliacao, id_turma: idTurma },
      });
      return data;
    } finally {
      bulkPublishing.value = false;
    }
  };

  return {
    dashboardStats,
    loadingDashboard,
    fetchDashboard,
    dashboardContexto,
    loadingDashboardContexto,
    fetchDashboardContexto,
    resumoConceitos,
    loadingResumoConceitos,
    fetchResumoConceitos,
    bulkPublishing,
    publicarLote,
  };
}
