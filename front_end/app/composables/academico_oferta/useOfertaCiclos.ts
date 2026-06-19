/**
 * useOfertaCiclos
 *
 * Composable para CRUD de ciclos acadêmicos + simulação de calendário.
 */
import { ref } from "vue";
import { useAppStore } from "~~/stores/app";

export function useOfertaCiclos(deps: {
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

  // ── Ciclo principal ──────────────────────────────────────
  const ciclos = ref<any[]>([]);
  const modulosDisponiveis = ref<any[]>([]);
  const loading = ref(false);
  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<any>(null);
  const showConfirmDelete = ref(false);
  const deleteTarget = ref<string | null>(null);
  const isDeleting = ref(false);

  async function fetchCiclos() {
    loading.value = true;
    try {
      const id = await deps.garantirEntidade();
      const [rC, rM] = (await Promise.all([
        $fetch("/api/academico_oferta/ciclos", { params: { id_entidade: id } }),
        $fetch("/api/academico_oferta/modulos", {
          params: { id_entidade: id, page: 1, limit: 100 },
        }),
      ])) as any[];
      ciclos.value = Array.isArray(rC?.itens) ? rC.itens : [];
      modulosDisponiveis.value = Array.isArray(rM?.itens) ? rM.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function openNovo() {
    isEdit.value = false;
    editData.value = null;
    showModal.value = true;
  }
  function openEditar(c: any) {
    isEdit.value = true;
    editData.value = c;
    showModal.value = true;
  }
  function handleSaved() {
    fetchCiclos();
  }
  function confirmDelete(id: string) {
    deleteTarget.value = id;
    showConfirmDelete.value = true;
  }

  async function handleDelete() {
    if (!deleteTarget.value) return;
    isDeleting.value = true;
    try {
      const id = await deps.garantirEntidade();
      await $fetch("/api/academico_oferta/ciclos", {
        method: "DELETE",
        body: { id: deleteTarget.value, id_entidade: id },
      });
      deps.toast.showToast("Ciclo removido", { type: "success" });
      await fetchCiclos();
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro", { type: "error" });
    } finally {
      isDeleting.value = false;
      showConfirmDelete.value = false;
      deleteTarget.value = null;
    }
  }

  // ── Simulação de calendário ──────────────────────────────
  async function simularCalendario(params: {
    id_modulo: string;
    data_inicio: string;
    dias_semana: any[];
    dias_extras: any[];
  }) {
    const id_entidade = await deps.garantirEntidade();
    const res = (await $fetch(
      "/api/academico_oferta/ciclos/calcular_cronograma",
      {
        method: "POST",
        body: { id_entidade, ...params },
      },
    )) as any;
    return res;
  }

  // ── Save completo do ciclo ───────────────────────────────
  async function handleSaveCiclo(params: {
    cicloId: string | null;
    id_modulo: string;
    descricao: string;
    ano_semestre: string | null;
    data_ini: string;
    data_fim: string;
    dias_semana: any[];
    dias_extras: any[];
  }): Promise<boolean> {
    try {
      const id_entidade = await deps.garantirEntidade();

      // 1. UPDATE/INSERT CICLO
      const cicloRes = (await $fetch("/api/academico_oferta/ciclos", {
        method: "POST",
        body: {
          id: params.cicloId,
          id_entidade,
          id_modulo: params.id_modulo,
          descricao: params.descricao,
          ano_semestre: params.ano_semestre,
          data_ini: params.data_ini,
          data_fim: params.data_fim,
          usuario_id: store.user_expandido_id,
        },
      })) as any;

      if (!cicloRes?.success || !cicloRes.id)
        throw new Error(cicloRes?.message || "Erro ao gravar base do ciclo");

      const the_ciclo_id = cicloRes.id;

      // 2. GRAVAR REGRAS SEMANAIS
      await $fetch("/api/academico_oferta/ciclo_dia_semana", {
        method: "POST",
        body: {
          id_ciclo: the_ciclo_id,
          dias: params.dias_semana,
          id_entidade,
          usuario_id: store.user_expandido_id,
        },
      });

      // 3. GRAVAR EXTRAS
      await $fetch("/api/academico_oferta/ciclo_dia_extra", {
        method: "POST",
        body: {
          id_ciclo: the_ciclo_id,
          dias: params.dias_extras,
          id_entidade,
          usuario_id: store.user_expandido_id,
        },
      });

      // 4. GRAVAR CALENDARIO DEFINITIVO (RPC)
      const gerarRes = (await $fetch("/api/academico_oferta/ciclos/gerar", {
        method: "POST",
        body: {
          id_ciclo: the_ciclo_id,
          id_entidade,
          usuario_id: store.user_expandido_id,
        },
      })) as any;

      if (gerarRes?.success) {
        deps.toast.showToast("Ciclo e Calendário gerados com sucesso!", {
          type: "success",
        });
        return true;
      }
      throw new Error(
        gerarRes?.message || "Erro na transação final de calendário",
      );
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
      return false;
    }
  }

  // ── Fetch dias config ────────────────────────────────────
  async function fetchDiasConfig(id_ciclo: string) {
    try {
      const [resSem, resExt] = (await Promise.all([
        $fetch("/api/academico_oferta/ciclo_dia_semana", {
          params: { id_ciclo },
        }),
        $fetch("/api/academico_oferta/ciclo_dia_extra", {
          params: { id_ciclo },
        }),
      ])) as any[];
      return {
        diasSemana: resSem?.success ? resSem.itens || [] : [],
        diasExtras: resExt?.success ? resExt.itens || [] : [],
      };
    } catch (e) {
      console.error(e);
      return { diasSemana: [], diasExtras: [] };
    }
  }

  return {
    ciclos,
    modulosDisponiveis,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    deleteTarget,
    isDeleting,
    fetchCiclos,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
    simularCalendario,
    handleSaveCiclo,
    fetchDiasConfig,
  };
}
