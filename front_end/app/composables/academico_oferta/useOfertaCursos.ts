/**
 * useOfertaCursos
 *
 * Composable para CRUD de cursos educacionais.
 */
import { ref } from "vue";

export function useOfertaCursos(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: { showToast: (msg: string, opts?: { duration?: number; type?: "info" | "error" | "success" }) => void };
}) {
  const cursos = ref<any[]>([]);
  const modulosDisponiveis = ref<any[]>([]);
  const loading = ref(false);
  const showModal = ref(false); const isEdit = ref(false); const editData = ref<any>(null);
  const showConfirmDelete = ref(false); const deleteTarget = ref<string | null>(null); const isDeleting = ref(false);

  async function fetchCursos() {
    loading.value = true;
    try {
      const id = await deps.garantirEntidade();
      const [rC, rM] = await Promise.all([
        $fetch("/api/academico_oferta/cursos", { params: { id_entidade: id, page: 1, limit: 20 } }),
        $fetch("/api/academico_oferta/modulos", { params: { id_entidade: id, page: 1, limit: 100 } }),
      ]) as any[];
      cursos.value = Array.isArray(rC?.itens) ? rC.itens : [];
      modulosDisponiveis.value = Array.isArray(rM?.itens) ? rM.itens : [];
    } catch (e: any) { deps.toast.showToast(e?.message || "Erro", { type: "error" }); }
    finally { loading.value = false; }
  }

  function openNovo() { isEdit.value = false; editData.value = null; showModal.value = true; }
  function openEditar(c: any) { isEdit.value = true; editData.value = c; showModal.value = true; }
  function handleSaved() { fetchCursos(); }
  function confirmDelete(id: string) { deleteTarget.value = id; showConfirmDelete.value = true; }

  async function handleDelete() {
    if (!deleteTarget.value) return; isDeleting.value = true;
    try {
      const id = await deps.garantirEntidade();
      await $fetch("/api/academico_oferta/cursos", { method: "DELETE", body: { id: deleteTarget.value, id_entidade: id } });
      deps.toast.showToast("Curso removido", { type: "success" });
      await fetchCursos();
    } catch (e: any) { deps.toast.showToast(e.message || "Erro", { type: "error" }); }
    finally { isDeleting.value = false; showConfirmDelete.value = false; deleteTarget.value = null; }
  }

  return { cursos, modulosDisponiveis, loading, showModal, isEdit, editData, showConfirmDelete, deleteTarget, isDeleting, fetchCursos, openNovo, openEditar, handleSaved, confirmDelete, handleDelete };
}
