/**
 * useOfertaProgramas
 *
 * Composable para listagem de programas (CRUD via ModalPrograma wizard).
 * OBS: POST/DELETE são feitos pelo ModalPrograma via API global /api/programas.
 */
import { ref } from "vue";

export function useOfertaProgramas(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: { showToast: (msg: string, opts?: { duration?: number; type?: "info" | "error" | "success" }) => void };
}) {
  const programas = ref<any[]>([]);
  const cursosDisponiveis = ref<any[]>([]);
  const loading = ref(false);
  const showModal = ref(false); const isEdit = ref(false); const editData = ref<any>(null);

  async function fetchProgramas() {
    loading.value = true;
    try {
      const id = await deps.garantirEntidade();
      const [rP, rC] = await Promise.all([
        $fetch("/api/programas", { params: { id_entidade: id, page: 1, limit: 20 } }),
        $fetch("/api/academico_oferta/cursos", { params: { id_entidade: id, page: 1, limit: 100 } }),
      ]) as any[];
      programas.value = Array.isArray(rP?.itens) ? rP.itens : [];
      cursosDisponiveis.value = Array.isArray(rC?.itens) ? rC.itens : [];
    } catch (e: any) { deps.toast.showToast(e?.message || "Erro", { type: "error" }); }
    finally { loading.value = false; }
  }

  function openNovo() { isEdit.value = false; editData.value = null; showModal.value = true; }
  function openEditar(p: any) { isEdit.value = true; editData.value = p; showModal.value = true; }
  function handleSaved() { fetchProgramas(); }

  return { programas, cursosDisponiveis, loading, showModal, isEdit, editData, fetchProgramas, openNovo, openEditar, handleSaved };
}
