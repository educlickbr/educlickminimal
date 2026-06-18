/**
 * useOfertaModulos
 *
 * Composable para CRUD de módulos educacionais.
 * Gerencia: lista, loading, modais de criação/edição, exclusão com confirmação.
 */
import { ref } from "vue";

export function useOfertaModulos(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (msg: string, opts?: { duration?: number; type?: "info" | "error" | "success" }) => void;
  };
}) {
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
      const [resM, resC] = await Promise.all([
        $fetch("/api/academico_oferta/modulos", { params: { id_entidade: id, page: 1, limit: 20 } }),
        $fetch("/api/academico_oferta/componentes", { params: { id_entidade: id, page: 1, limit: 100 } }),
      ]) as any[];
      modulos.value = Array.isArray(resM?.itens) ? resM.itens : [];
      componentesDisponiveis.value = Array.isArray(resC?.itens) ? resC.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao buscar módulos", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function openNovo() { isEdit.value = false; editData.value = null; showModal.value = true; }
  function openEditar(m: any) { isEdit.value = true; editData.value = m; showModal.value = true; }
  function handleSaved() { fetchModulos(); }
  function confirmDelete(id: string) { deleteTarget.value = id; showConfirmDelete.value = true; }

  async function handleDelete() {
    if (!deleteTarget.value) return;
    isDeleting.value = true;
    try {
      const id = await deps.garantirEntidade();
      await $fetch("/api/academico_oferta/modulos", { method: "DELETE", body: { id: deleteTarget.value, id_entidade: id } });
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

  return {
    modulos, componentesDisponiveis, loading,
    showModal, isEdit, editData,
    showConfirmDelete, deleteTarget, isDeleting,
    fetchModulos, openNovo, openEditar, handleSaved, confirmDelete, handleDelete,
  };
}
