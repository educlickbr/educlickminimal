/**
 * useOfertaComponentes
 * CRUD de componentes curriculares.
 */
import { ref } from "vue";

export interface Componente {
  id: string;
  id_entidade: string;
  nome_componente: string;
  descricao?: string | null;
  criado_por?: string;
  criado_em: string;
  modificado_em: string;
}

export function useOfertaComponentes(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  userExpandidoId: () => string | null;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
}) {
  const componentes = ref<Componente[]>([]);
  const loading = ref(true); // começa true — evita flicker de empty state antes do fetch
  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<Componente | null>(null);
  const showConfirmDelete = ref(false);
  const deleteTargetId = ref<string | null>(null);
  const isDeleting = ref(false);

  async function fetchComponentes() {
    loading.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/componentes", {
        params: { id_entidade, page: 1, limit: 20 },
      })) as any;
      if (res?.success === false)
        throw new Error(res?.message || "Falha ao listar");
      componentes.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao buscar componentes", {
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
  function openEditar(c: Componente) {
    isEdit.value = true;
    editData.value = c;
    showModal.value = true;
  }

  function handleSaved() {
    fetchComponentes();
    showModal.value = false;
  }

  function confirmDelete(id: string) {
    deleteTargetId.value = id;
    showConfirmDelete.value = true;
  }

  async function handleDelete() {
    if (!deleteTargetId.value) return;
    isDeleting.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/componentes", {
        method: "DELETE",
        body: { id: deleteTargetId.value, id_entidade },
      })) as any;
      if (res?.success === false)
        throw new Error(res?.message || "Erro ao remover");
      deps.toast.showToast("Componente removido", { type: "success" });
      await fetchComponentes();
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao remover", { type: "error" });
    } finally {
      isDeleting.value = false;
      showConfirmDelete.value = false;
      deleteTargetId.value = null;
    }
  }

  async function handleSave(data: any) {
    if (!data || !data.nome_componente?.trim()) {
      deps.toast.showToast("Nome obrigatório", { type: "error" });
      return;
    }
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/componentes", {
        method: "POST",
        body: {
          id: isEdit.value ? editData.value?.id : undefined,
          id_entidade,
          nome_componente: data.nome_componente,
          descricao: data.descricao ?? null,
          usuario_id: deps.userExpandidoId(),
        },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Componente salvo", { type: "success" });
        showModal.value = false;
        fetchComponentes();
      } else
        deps.toast.showToast(res?.message || "Erro ao salvar", {
          type: "error",
        });
    } catch (e: any) {
      deps.toast.showToast("Erro ao salvar", { type: "error" });
    }
  }

  return {
    componentes,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    isDeleting,
    fetchComponentes,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
    handleSave,
  };
}
