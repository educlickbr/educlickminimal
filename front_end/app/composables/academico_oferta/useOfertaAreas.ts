/**
 * useOfertaAreas
 *
 * Composable para CRUD de áreas educacionais.
 * Gerencia: lista, loading, modais de criação/edição, exclusão com confirmação.
 */

import { ref } from "vue";
import { useAppStore } from "~~/stores/app";

export interface Area {
  id: string;
  nome_area: string;
  descricao?: string | null;
  id_entidade: string;
  criado_em: string;
}

export function useOfertaAreas(deps: {
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
  const areas = ref<Area[]>([]);
  const loading = ref(true);

  // Modal de criação/edição
  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<Area | null>(null);

  // Modal de confirmação de exclusão
  const showConfirmDelete = ref(false);
  const deleteTargetId = ref<string | null>(null);
  const isDeleting = ref(false);

  async function fetchAreas() {
    loading.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/areas", {
        params: { id_entidade, page: 1, limit: 20 },
      })) as any;

      areas.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao buscar áreas", {
        type: "error",
      });
    } finally {
      loading.value = false;
    }
  }

  function openNova() {
    isEdit.value = false;
    editData.value = null;
    showModal.value = true;
  }

  function openEditar(area: Area) {
    isEdit.value = true;
    editData.value = area;
    showModal.value = true;
  }

  function handleSaved() {
    fetchAreas();
  }

  function confirmDelete(id: string) {
    deleteTargetId.value = id;
    showConfirmDelete.value = true;
  }

  async function handleSave(formData: {
    id: string | null;
    nome_area: string;
    descricao: string;
  }) {
    if (!formData.nome_area.trim()) return false;

    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/areas", {
        method: "POST",
        body: {
          ...formData,
          id_entidade,
          usuario_id: store.user_expandido_id,
        },
      })) as any;

      if (res?.success) {
        deps.toast.showToast(
          formData.id ? "Área atualizada!" : "Área criada com sucesso!",
          { type: "success" },
        );
        showModal.value = false;
        await fetchAreas();
        return true;
      }
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao salvar área", {
        type: "error",
      });
    }
    return false;
  }

  async function handleDelete() {
    if (!deleteTargetId.value) return;
    isDeleting.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/areas", {
        method: "DELETE",
        body: { id: deleteTargetId.value, id_entidade },
      })) as any;

      if (res?.success === false) {
        throw new Error(res?.message || "Erro ao remover área");
      }

      deps.toast.showToast("Área removida com sucesso", { type: "success" });
      await fetchAreas();
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao remover área", {
        type: "error",
      });
    } finally {
      isDeleting.value = false;
      showConfirmDelete.value = false;
      deleteTargetId.value = null;
    }
  }

  return {
    // estado
    areas,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    deleteTargetId,
    isDeleting,
    // ações
    fetchAreas,
    openNova,
    openEditar,
    handleSaved,
    handleSave,
    confirmDelete,
    handleDelete,
  };
}
