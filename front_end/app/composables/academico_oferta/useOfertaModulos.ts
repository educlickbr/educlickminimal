/**
 * useOfertaModulos
 *
 * Composable para CRUD de módulos educacionais + sub-entidades
 * (componentes do módulo, planos de aula).
 */
import { ref } from "vue";
import { useAppStore } from "~~/stores/app";

export function useOfertaModulos(deps: {
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

  // ── Módulo principal ─────────────────────────────────────
  const modulos = ref<any[]>([]);
  const componentesDisponiveis = ref<any[]>([]);
  const loading = ref(false);
  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<any>(null);
  const showConfirmDelete = ref(false);
  const deleteTarget = ref<string | null>(null);
  const isDeleting = ref(false);

  async function fetchModulos() {
    loading.value = true;
    try {
      const id = await deps.garantirEntidade();
      const [resM, resC] = (await Promise.all([
        $fetch("/api/academico_oferta/modulos", {
          params: { id_entidade: id, page: 1, limit: 20 },
        }),
        $fetch("/api/academico_oferta/componentes", {
          params: { id_entidade: id, page: 1, limit: 100 },
        }),
      ])) as any[];
      modulos.value = Array.isArray(resM?.itens) ? resM.itens : [];
      componentesDisponiveis.value = Array.isArray(resC?.itens)
        ? resC.itens
        : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao buscar módulos", {
        type: "error",
      });
    } finally {
      loading.value = false;
    }
  }

  function openNovo() {
    isEdit.value = false;
    editData.value = null;
    showModal.value = true;
  }
  function openEditar(m: any) {
    isEdit.value = true;
    editData.value = m;
    showModal.value = true;
  }
  function handleSaved() {
    fetchModulos();
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
      await $fetch("/api/academico_oferta/modulos", {
        method: "DELETE",
        body: { id: deleteTarget.value, id_entidade: id },
      });
      deps.toast.showToast("Módulo removido", { type: "success" });
      await fetchModulos();
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao remover", { type: "error" });
    } finally {
      isDeleting.value = false;
      showConfirmDelete.value = false;
      deleteTarget.value = null;
    }
  }

  async function handleSaveModulo(formData: {
    id: string | null;
    nome_modulo: string;
    descricao: string;
    carga_horaria: number | null;
  }) {
    if (!formData.nome_modulo.trim()) {
      deps.toast.showToast("O nome do módulo é obrigatório", { type: "error" });
      return null;
    }
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/modulos", {
        method: "POST",
        body: {
          id: formData.id,
          id_entidade,
          nome_modulo: formData.nome_modulo,
          descricao: formData.descricao,
          carga_horaria: formData.carga_horaria,
          usuario_id: store.user_expandido_id,
        },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Módulo salvo com sucesso!", { type: "success" });
        return res.id || null;
      }
      throw new Error(res?.message || "Erro ao salvar módulo");
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
      return null;
    }
  }

  // ── Componentes do Módulo ────────────────────────────────
  const componentesDoModulo = ref<any[]>([]);
  const loadingComponentesModulo = ref(false);
  const loadingAddComponente = ref(false);

  async function fetchComponentesDoModulo(moduloId: string) {
    if (!moduloId) return;
    loadingComponentesModulo.value = true;
    try {
      const data = (await $fetch("/api/academico_oferta/modulo_componente", {
        method: "GET",
        params: { id_modulo: moduloId },
      })) as any;
      componentesDoModulo.value = Array.isArray(data?.itens) ? data.itens : [];
    } catch (e) {
      console.error("Erro ao buscar componentes do módulo", e);
    } finally {
      loadingComponentesModulo.value = false;
    }
  }

  async function handleAddComponente(
    moduloId: string,
    data: {
      id_componente: string;
      carga_horaria: number;
      obrigatorio: boolean;
    },
  ) {
    if (!data.id_componente || !moduloId) return;
    loadingAddComponente.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/modulo_componente", {
        method: "POST",
        body: {
          id_modulo: moduloId,
          id_componente: data.id_componente,
          carga_horaria: data.carga_horaria,
          obrigatorio: data.obrigatorio,
          id_entidade,
          usuario_id: store.user_expandido_id,
        },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Componente adicionado!", { type: "success" });
        await fetchComponentesDoModulo(moduloId);
      } else {
        throw new Error(res?.message || "Erro ao vincular componente");
      }
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
    } finally {
      loadingAddComponente.value = false;
    }
  }

  async function handleRemoveComponente(
    moduloId: string,
    id_componente: string,
  ) {
    if (!moduloId) return;
    try {
      const res = (await $fetch("/api/academico_oferta/modulo_componente", {
        method: "DELETE",
        body: { id_modulo: moduloId, id_componente },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Componente removido do módulo", {
          type: "success",
        });
        await fetchComponentesDoModulo(moduloId);
      } else {
        throw new Error(res?.message || "Erro ao remover componente");
      }
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
    }
  }

  // ── Planos de Aula ───────────────────────────────────────
  const planos = ref<any[]>([]);
  const loadingPlanos = ref(false);
  const loadingPlano = ref(false);

  async function fetchPlanos(moduloId: string) {
    if (!moduloId) return;
    loadingPlanos.value = true;
    try {
      const data = await $fetch("/api/academico_oferta/plano_aula", {
        method: "GET",
        params: { id_modulo: moduloId },
      });
      planos.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Erro ao buscar planos", e);
    } finally {
      loadingPlanos.value = false;
    }
  }

  async function handleSavePlano(
    moduloId: string,
    data: {
      id: string | null;
      id_componente: string;
      titulo_plano: string;
      ementa: string | null;
    },
  ) {
    if (!data.id_componente || !data.titulo_plano.trim()) {
      deps.toast.showToast("Componente e título são obrigatórios", {
        type: "error",
      });
      return false;
    }
    loadingPlano.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/plano_aula", {
        method: "POST",
        body: {
          id: data.id,
          id_entidade,
          id_modulo: moduloId,
          id_componente: data.id_componente,
          titulo_plano: data.titulo_plano,
          ementa: data.ementa,
          usuario_id: store.user_expandido_id,
        },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Plano de aula salvo!", { type: "success" });
        await fetchPlanos(moduloId);
        return true;
      }
      throw new Error(res?.message || "Erro ao salvar plano");
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
      return false;
    } finally {
      loadingPlano.value = false;
    }
  }

  async function handleDeletePlano(id: string) {
    if (!id) return;
    try {
      const id_entidade =
        deps.getEntidadeAtivaId() ||
        store.entidades?.[0]?.id ||
        (store as any).company?.id;
      if (!id_entidade) throw new Error("Entidade ativa não encontrada");
      const res = (await $fetch("/api/academico_oferta/plano_aula", {
        method: "DELETE",
        body: { id, id_entidade },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Plano de aula removido", { type: "success" });
      } else {
        throw new Error(res?.message || "Erro ao remover plano");
      }
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao remover plano", {
        type: "error",
      });
    }
  }

  return {
    modulos,
    componentesDisponiveis,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    deleteTarget,
    isDeleting,
    fetchModulos,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
    // Módulo save
    handleSaveModulo,
    // Componentes do módulo
    componentesDoModulo,
    loadingComponentesModulo,
    loadingAddComponente,
    fetchComponentesDoModulo,
    handleAddComponente,
    handleRemoveComponente,
    // Planos de aula
    planos,
    loadingPlanos,
    loadingPlano,
    fetchPlanos,
    handleSavePlano,
    handleDeletePlano,
  };
}
