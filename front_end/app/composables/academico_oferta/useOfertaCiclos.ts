/**
 * useOfertaCiclos
 *
 * Composable para CRUD de ciclos acadêmicos.
 */
import { ref } from "vue";

export function useOfertaCiclos(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: { showToast: (msg: string, opts?: { duration?: number; type?: "info" | "error" | "success" }) => void };
}) {
  const ciclos = ref<any[]>([]);
  const modulosDisponiveis = ref<any[]>([]);
  const loading = ref(false);
  const showModal = ref(false); const isEdit = ref(false); const editData = ref<any>(null);
  const showConfirmDelete = ref(false); const deleteTarget = ref<string | null>(null); const isDeleting = ref(false);

  async function fetchCiclos() {
    loading.value = true;
    try {
      const id = await deps.garantirEntidade();
      const [rC, rM] = await Promise.all([
        $fetch("/api/academico_oferta/ciclos", { params: { id_entidade: id } }),
        $fetch("/api/academico_oferta/modulos", { params: { id_entidade: id, page: 1, limit: 100 } }),
      ]) as any[];
      ciclos.value = Array.isArray(rC?.itens) ? rC.itens : [];
      modulosDisponiveis.value = Array.isArray(rM?.itens) ? rM.itens : [];
    } catch (e: any) { deps.toast.showToast(e?.message || "Erro", { type: "error" }); }
    finally { loading.value = false; }
  }

  function openNovo() { isEdit.value = false; editData.value = null; showModal.value = true; }
  function openEditar(c: any) { isEdit.value = true; editData.value = c; showModal.value = true; }
  function handleSaved() { fetchCiclos(); }
  function confirmDelete(id: string) { deleteTarget.value = id; showConfirmDelete.value = true; }

  async function handleDelete() {
    if (!deleteTarget.value) return; isDeleting.value = true;
    try {
      const id = await deps.garantirEntidade();
      await $fetch("/api/academico_oferta/ciclos", { method: "DELETE", body: { id: deleteTarget.value, id_entidade: id } });
      deps.toast.showToast("Ciclo removido", { type: "success" });
      await fetchCiclos();
    } catch (e: any) { deps.toast.showToast(e.message || "Erro", { type: "error" }); }
    finally { isDeleting.value = false; showConfirmDelete.value = false; deleteTarget.value = null; }
  }

  return { ciclos, modulosDisponiveis, loading, showModal, isEdit, editData, showConfirmDelete, deleteTarget, isDeleting, fetchCiclos, openNovo, openEditar, handleSaved, confirmDelete, handleDelete };
}
