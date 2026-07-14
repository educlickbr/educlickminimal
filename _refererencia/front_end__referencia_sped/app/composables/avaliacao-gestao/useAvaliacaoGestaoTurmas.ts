import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useAvaliacaoGestaoTurmas() {
  const turmas = ref<any[]>([]);
  const turmaAtiva = ref<string>("");
  const loadingTurmas = ref(false);

  const fetchTurmas = async (anoSemestre: string) => {
    loadingTurmas.value = true;
    turmaAtiva.value = "";
    try {
      const data: any = await ofetch("/api/cursos-turmas/turmas", {
        params: { limite: 200, area: "Regulares", ano_semestre: anoSemestre },
      });
      turmas.value = data?.itens || [];
      if (turmas.value.length) turmaAtiva.value = turmas.value[0].id;
    } catch (e) {
      console.error(e);
    } finally {
      loadingTurmas.value = false;
    }
  };

  // ── Avaliação por turma ──
  const avaliacaoTurma = ref<any>(null);
  const loadingAvTurma = ref(false);

  const fetchAvaliacaoPorTurma = async (turmaId: string, etapa: string) => {
    if (!turmaId) return;
    loadingAvTurma.value = true;
    avaliacaoTurma.value = null;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao/por-turma", {
        params: { id_turma: turmaId, etapa },
      });
      avaliacaoTurma.value = data ?? null;
    } catch (e) {
      console.error(e);
    } finally {
      loadingAvTurma.value = false;
    }
  };

  return {
    turmas,
    turmaAtiva,
    loadingTurmas,
    fetchTurmas,
    avaliacaoTurma,
    loadingAvTurma,
    fetchAvaliacaoPorTurma,
  };
}
