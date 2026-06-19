/**
 * useProgramaForm
 *
 * Composable para o wizard de criação/edição de Programas.
 * Gerencia fetch de listas, ciclos, validação e salvamento.
 */
import { ref, computed } from "vue";
import { useAppStore } from "~~/stores/app";

export function useProgramaForm(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
}) {
  const store = useAppStore();

  const loading = ref(false);
  const listCursos = ref<any[]>([]);
  const listModulos = ref<any[]>([]);
  const listAreas = ref<any[]>([]);
  const loadingCiclos = ref(false);
  const ciclosEncontrados = ref<any[]>([]);
  const modulosPendentesCurso = ref<string[]>([]);
  const temOverlapping = ref(false);

  async function fetchBaseLists(cursosProp?: any[]) {
    const id_entidade =
      deps.getEntidadeAtivaId() ||
      store.entidades?.[0]?.id ||
      (store as any).company?.id;
    if (!id_entidade) return;

    if (cursosProp && cursosProp.length > 0) {
      listCursos.value = cursosProp;
    } else {
      try {
        const resCur = (await $fetch("/api/academico_oferta/cursos", {
          params: { id_entidade, _t: Date.now() },
        })) as any;
        if (resCur?.success) listCursos.value = resCur.itens;
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const resMod = (await $fetch("/api/academico_oferta/modulos", {
        params: { id_entidade, _t: Date.now() },
      })) as any;
      if (resMod?.success) listModulos.value = resMod.itens;
    } catch (e) {
      console.error(e);
    }

    try {
      const resArea = (await $fetch("/api/areas", {
        params: { id_entidade, _t: Date.now() },
      })) as any;
      if (resArea?.success) listAreas.value = resArea.itens || [];
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCursoCiclos(id_curso: string) {
    if (!id_curso) return;
    loadingCiclos.value = true;
    ciclosEncontrados.value = [];
    modulosPendentesCurso.value = [];
    try {
      const id_entidade =
        deps.getEntidadeAtivaId() ||
        store.entidades?.[0]?.id ||
        (store as any).company?.id;
      const res = (await $fetch("/api/programas/buscar_ciclos_curso", {
        params: { id_curso, id_entidade },
      })) as any;
      if (res?.success) {
        ciclosEncontrados.value = res.ciclos;
        modulosPendentesCurso.value = res.modulos_ausentes || [];
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingCiclos.value = false;
    }
  }

  async function fetchAllCiclos() {
    loadingCiclos.value = true;
    ciclosEncontrados.value = [];
    try {
      const id_entidade =
        deps.getEntidadeAtivaId() ||
        store.entidades?.[0]?.id ||
        (store as any).company?.id;
      const res = (await $fetch("/api/academico_oferta/ciclos", {
        params: { id_entidade },
      })) as any;
      if (res?.success && res.itens) {
        ciclosEncontrados.value = res.itens.map((c: any) => ({
          ...c,
          modulo_nome:
            listModulos.value.find((m) => m.id === c.id_modulo)?.nome_modulo ||
            c.aca_modulo?.nome_modulo ||
            "Módulo",
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingCiclos.value = false;
    }
  }

  function checkOverlapping(selected: string[]) {
    if (selected.length <= 1) {
      temOverlapping.value = false;
      return;
    }
    const sel = ciclosEncontrados.value.filter((c) => selected.includes(c.id));
    temOverlapping.value = false;
    for (let i = 0; i < sel.length; i++) {
      for (let j = i + 1; j < sel.length; j++) {
        const d1Ini = new Date(sel[i].data_ini).getTime();
        const d1Fim = new Date(sel[i].data_fim).getTime();
        const d2Ini = new Date(sel[j].data_ini).getTime();
        const d2Fim = new Date(sel[j].data_fim).getTime();
        if (d1Ini <= d2Fim && d1Fim >= d2Ini) {
          temOverlapping.value = true;
          return;
        }
      }
    }
  }

  function toDateMs(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const ms = new Date(dateStr).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  function toIso(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  async function handleSave(params: {
    isEdit: boolean;
    programaId: string | null;
    id_curso: string | null;
    id_area: string | null;
    ciclos_selecionados: string[];
    descricao: string;
    estrategia: "unica" | "separada";
    descricoes_multiplas: Record<string, string>;
    processos: {
      id: string | null;
      nome_processo: string;
      data_inicio: string | null;
      data_fim: string | null;
      matricula_inicio: string | null;
      matricula_fim: string | null;
    }[];
  }): Promise<boolean> {
    loading.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();

      const processosPayload = params.processos.map((processo, idx) => ({
        id: processo.id || null,
        nome_processo: processo.nome_processo?.trim() || `Processo ${idx + 1}`,
        data_inicio: toIso(processo.data_inicio),
        data_fim: toIso(processo.data_fim),
        matricula_inicio: toIso(processo.matricula_inicio),
        matricula_fim: toIso(processo.matricula_fim),
      }));

      const processosOrdenados = [...processosPayload].sort((a, b) => {
        const aMs = a.data_inicio ? new Date(a.data_inicio).getTime() : 0;
        const bMs = b.data_inicio ? new Date(b.data_inicio).getTime() : 0;
        return aMs - bMs;
      });
      const processoInicial = processosOrdenados[0] || null;
      const processoFinal =
        processosOrdenados[processosOrdenados.length - 1] || null;

      if (params.isEdit) {
        const res = (await $fetch("/api/programas", {
          method: "POST",
          body: {
            id: params.programaId,
            id_entidade,
            id_curso: params.id_curso || null,
            id_area: params.id_area || null,
            descricao: params.descricao,
            ciclos: params.ciclos_selecionados,
            usuario_id: store.user_expandido_id,
            processo_seletivo_inicio: processoInicial?.data_inicio || null,
            processo_seletivo_fim: processoFinal?.data_fim || null,
            matricula_inicio: processoInicial?.matricula_inicio || null,
            matricula_fim: processoFinal?.matricula_fim || null,
            processos: processosPayload,
          },
        })) as any;
        if (res?.success) {
          deps.toast.showToast("Programa salvo com sucesso!", {
            type: "success",
          });
          return true;
        }
        throw new Error(res?.message || "Erro ao editar.");
      }

      // Create mode
      const payload = {
        id_entidade,
        id_curso: params.id_curso,
        id_area: params.id_area,
        descricao: params.descricao,
        ciclos: params.ciclos_selecionados,
        estrategia: params.estrategia,
        descricoes:
          params.estrategia === "separada"
            ? params.descricoes_multiplas
            : undefined,
        usuario_id: store.user_expandido_id,
        processo_seletivo_inicio: processoInicial?.data_inicio || null,
        processo_seletivo_fim: processoFinal?.data_fim || null,
        matricula_inicio: processoInicial?.matricula_inicio || null,
        matricula_fim: processoFinal?.matricula_fim || null,
        processos: processosPayload,
      };

      const res = (await $fetch("/api/programas/criar_com_ciclos", {
        method: "POST",
        body: payload,
      })) as any;

      if (res?.success) {
        deps.toast.showToast("Programa(s) criado(s) com sucesso.", {
          type: "success",
        });
        return true;
      }
      throw new Error(res?.message || "Erro ao gerar programa.");
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Init para modo edição
  async function initEdit(programaId: string) {
    try {
      const [resCiclos, resProcessos] = (await Promise.all([
        $fetch("/api/programas/ciclos", {
          params: { id_programa: programaId },
        }),
        $fetch("/api/academico_oferta/processos", {
          params: { id_programa: programaId },
        }),
      ])) as any[];
      return { resCiclos, resProcessos };
    } catch (e) {
      console.error("Erro ao buscar dados do programa", e);
      return { resCiclos: null, resProcessos: null };
    }
  }

  return {
    loading,
    listCursos,
    listModulos,
    listAreas,
    loadingCiclos,
    ciclosEncontrados,
    modulosPendentesCurso,
    temOverlapping,
    fetchBaseLists,
    fetchCursoCiclos,
    fetchAllCiclos,
    checkOverlapping,
    toDateMs,
    handleSave,
    initEdit,
  };
}
