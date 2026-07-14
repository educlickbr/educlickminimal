import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";
import { useAppStore } from "~/stores/app";

export function useAvaliacaoGestaoConceitos() {
  const store = useAppStore();
  const alunoAberto = ref<string | null>(null);
  const conceitosCache = ref<Record<string, { criterios: any[]; global: any }>>(
    {},
  );
  const loadingAlunoCriterios = ref<Record<string, boolean>>({});
  const savingMap = ref<Record<string, "saving" | "saved" | "error">>({});
  const lastSavedMap = ref<Record<string, string>>({});

  // ── Cache de avaliações anteriores (para Relatório Final) ──
  const avaliacoesAnterioresCache = ref<Record<string, any[]>>({});
  const loadingAvaliacoesAnteriores = ref<Record<string, boolean>>({});

  // ── Helpers ──
  const getCriteriosAluno = (id_aluno: string): any[] =>
    conceitosCache.value[id_aluno]?.criterios || [];
  const getGlobalAluno = (id_aluno: string): any =>
    conceitosCache.value[id_aluno]?.global || {};

  // ── Toggle / Lazy Load ──
  const toggleAluno = async (id_aluno: string, id_avaliacao: string) => {
    if (alunoAberto.value === id_aluno) {
      alunoAberto.value = null;
      return;
    }
    alunoAberto.value = id_aluno;
    if (!conceitosCache.value[id_aluno]) {
      loadingAlunoCriterios.value[id_aluno] = true;
      try {
        const data: any = await ofetch(
          "/api/avaliacao-gestao/conceitos-aluno",
          {
            params: { id_avaliacao, id_aluno },
          },
        );
        conceitosCache.value[id_aluno] = data || {
          criterios: [],
          global: {
            comentario: null,
            publicado: false,
            aprovado_coordenador: false,
            aprovado_pedagogo: false,
          },
        };
      } catch (e) {
        console.error(e);
      } finally {
        loadingAlunoCriterios.value[id_aluno] = false;
      }
    }
  };

  // ── Fetch avaliações anteriores do aluno ──
  const fetchAvaliacoesAnteriores = async (
    id_aluno: string,
    id_avaliacao_atual: string,
    anoSemestre?: string,
    idTurma?: string,
  ) => {
    if (avaliacoesAnterioresCache.value[id_aluno]) return;
    loadingAvaliacoesAnteriores.value[id_aluno] = true;
    try {
      const params: Record<string, string> = {
        id_aluno,
        id_avaliacao_atual,
      };
      if (anoSemestre) params.ano_semestre = anoSemestre;
      if (idTurma) params.id_turma = idTurma;
      const data: any = await ofetch(
        "/api/avaliacao-gestao/conceitos-aluno-anteriores",
        { params },
      );
      avaliacoesAnterioresCache.value[id_aluno] = data || [];
    } catch (e) {
      console.error(e);
      avaliacoesAnterioresCache.value[id_aluno] = [];
    } finally {
      loadingAvaliacoesAnteriores.value[id_aluno] = false;
    }
  };

  const getAvaliacoesAnteriores = (id_aluno: string): any[] =>
    avaliacoesAnterioresCache.value[id_aluno] || [];

  // ── Fetch Conceitos (for [id].vue) ──
  const fetchConceitos = async (
    id_avaliacao: string,
    options?: { id_aluno?: string; id_turma?: string },
  ) => {
    const params: Record<string, string> = { id_avaliacao };
    if (options?.id_aluno) params.id_aluno = options.id_aluno;
    if (options?.id_turma) params.id_turma = options.id_turma;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao/conceitos", {
        params,
      });
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // ── Salvar Conceito ──
  const salvarConceito = async (
    id_aluno: string,
    id_criterio: string,
    conceito: string,
    onSaved?: () => void,
  ) => {
    const key = `${id_aluno}_${id_criterio}`;
    savingMap.value[key] = "saving";
    const crits = getCriteriosAluno(id_aluno);
    const item = crits.find((c: any) => c.id_criterio === id_criterio);
    if (item) item.conceito = conceito;
    try {
      await ofetch("/api/avaliacao-gestao/conceitos", {
        method: "POST",
        body: { id_criterio, id_aluno, conceito },
      });
      if (onSaved) onSaved();
      savingMap.value[key] = "saved";
      setTimeout(() => delete savingMap.value[key], 1500);
    } catch {
      savingMap.value[key] = "error";
      if (item) item.conceito = "";
      setTimeout(() => delete savingMap.value[key], 3000);
    }
  };

  // ── Salvar Resultado Global ──
  const salvarResultadoGlobal = async (
    id_avaliacao: string,
    id_aluno: string,
    action?: "comentario" | "aprov_coordenador" | "aprov_pedagogo" | "publicar",
    onSaved?: () => void,
  ) => {
    const key = `${id_aluno}_global`;
    savingMap.value[key] = "saving";
    const globalData = getGlobalAluno(id_aluno);
    let nextCoord = !!globalData.aprovado_coordenador;
    let nextPedag = !!globalData.aprovado_pedagogo;
    let nextPubli = globalData.publicado;

    if (action === "aprov_coordenador") nextCoord = !nextCoord;
    if (action === "aprov_pedagogo") nextPedag = !nextPedag;
    if (action === "publicar") nextPubli = !nextPubli;

    const cacheEntry = conceitosCache.value[id_aluno];
    const oldState = { ...globalData };

    if (cacheEntry) {
      const patch: any = {};
      if (action === "aprov_coordenador")
        patch.aprovado_coordenador = nextCoord ? store.user_expandido_id : null;
      if (action === "aprov_pedagogo")
        patch.aprovado_pedagogo = nextPedag ? store.user_expandido_id : null;
      if (action === "publicar") patch.publicado = nextPubli;
      Object.assign(cacheEntry.global, patch);
    }

    const body: any = {
      id_avaliacao,
      id_aluno,
      comentario: globalData.comentario,
      publicado: nextPubli,
      aprovado_coordenador:
        action === "aprov_coordenador" ? nextCoord : undefined,
      aprovado_pedagogo: action === "aprov_pedagogo" ? nextPedag : undefined,
    };

    try {
      const res: any = await ofetch("/api/avaliacao-gestao/resultado-global", {
        method: "PUT",
        body,
      });
      if (res && cacheEntry) Object.assign(cacheEntry.global, res);
      if (onSaved) onSaved();
      savingMap.value[key] = "saved";
      lastSavedMap.value[key] = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setTimeout(() => delete savingMap.value[key], 1500);
    } catch (e) {
      console.error(e);
      if (cacheEntry) Object.assign(cacheEntry.global, oldState);
      savingMap.value[key] = "error";
      delete lastSavedMap.value[key];
      setTimeout(() => delete savingMap.value[key], 3000);
    }
  };

  return {
    alunoAberto,
    conceitosCache,
    loadingAlunoCriterios,
    savingMap,
    lastSavedMap,
    avaliacoesAnterioresCache,
    loadingAvaliacoesAnteriores,
    toggleAluno,
    getCriteriosAluno,
    getGlobalAluno,
    fetchConceitos,
    salvarConceito,
    salvarResultadoGlobal,
    fetchAvaliacoesAnteriores,
    getAvaliacoesAnteriores,
  };
}
