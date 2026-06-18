/**
 * useFormulariosLista
 *
 * Composable para a lista de formulários salvos + context fetching.
 */

import { ref, computed } from "vue";

interface FormularioSalvo {
  area_id: string | null;
  programa_id: string | null;
  tipo_proc: string;
  tipo_cand: string;
  total_campos: number;
  contexto_tipo: "area" | "programa";
  contexto_nome: string;
}

export const labelTipoProc: Record<string, string> = {
  matricula: "Matrícula",
  seletivo: "Processo Seletivo",
};
export const labelTipoCand: Record<string, string> = {
  estudante: "Estudante",
  docente: "Docente",
  externo: "Externo",
};

export function useFormulariosLista(deps: {
  garantirEntidade: () => Promise<string>;
}) {
  const formulariosSalvos = ref<FormularioSalvo[]>([]);
  const loading = ref(false);

  // Contexts
  const areas = ref<any[]>([]);
  const programas = ref<any[]>([]);
  const loadingContexts = ref(false);

  async function fetchFormulariosSalvos() {
    loading.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/formularios", {
        params: { id_entidade },
      })) as any;
      formulariosSalvos.value = Array.isArray(res?.data) ? res.data : [];
    } catch {
      formulariosSalvos.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchContexts() {
    loadingContexts.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const [resAreas, resProgramas] = await Promise.all([
        $fetch("/api/areas", { params: { id_entidade } }) as any,
        $fetch("/api/programas", { params: { id_entidade } }) as any,
      ]);
      areas.value = resAreas?.itens || [];
      programas.value = resProgramas?.itens || [];
    } catch {
      // silently fail
    } finally {
      loadingContexts.value = false;
    }
  }

  return {
    formulariosSalvos,
    loading,
    areas,
    programas,
    loadingContexts,
    fetchFormulariosSalvos,
    fetchContexts,
  };
}
