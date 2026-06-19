/**
 * useOfertaCursos
 *
 * Composable para CRUD de cursos educacionais + sub-entidades (áreas, grade).
 */
import { ref, computed } from "vue";
import { useAppStore } from "~~/stores/app";

export function useOfertaCursos(deps: {
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

  // ── Curso principal ──────────────────────────────────────
  const cursos = ref<any[]>([]);
  const modulosDisponiveis = ref<any[]>([]);
  const loading = ref(false);
  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<any>(null);
  const showConfirmDelete = ref(false);
  const deleteTarget = ref<string | null>(null);
  const isDeleting = ref(false);

  async function fetchCursos() {
    loading.value = true;
    try {
      const id = await deps.garantirEntidade();
      const [rC, rM] = (await Promise.all([
        $fetch("/api/academico_oferta/cursos", {
          params: { id_entidade: id, page: 1, limit: 20 },
        }),
        $fetch("/api/academico_oferta/modulos", {
          params: { id_entidade: id, page: 1, limit: 100 },
        }),
      ])) as any[];
      cursos.value = Array.isArray(rC?.itens) ? rC.itens : [];
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
    fetchCursos();
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
      await $fetch("/api/academico_oferta/cursos", {
        method: "DELETE",
        body: { id: deleteTarget.value, id_entidade: id },
      });
      deps.toast.showToast("Curso removido", { type: "success" });
      await fetchCursos();
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro", { type: "error" });
    } finally {
      isDeleting.value = false;
      showConfirmDelete.value = false;
      deleteTarget.value = null;
    }
  }

  async function handleSaveCurso(formData: {
    id: string | null;
    nome_curso: string;
    descricao: string;
    id_area: string | null;
  }) {
    if (!formData.nome_curso.trim()) {
      deps.toast.showToast("O nome do curso é obrigatório", { type: "error" });
      return null;
    }
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/cursos", {
        method: "POST",
        body: {
          id: formData.id,
          id_entidade,
          nome_curso: formData.nome_curso,
          descricao: formData.descricao,
          id_area: formData.id_area,
          usuario_id: store.user_expandido_id,
        },
      })) as any;

      if (res?.success) {
        deps.toast.showToast("Curso salvo com sucesso!", { type: "success" });
        return res.id || null;
      }
      throw new Error(res?.message || "Erro ao salvar curso");
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
      return null;
    }
  }

  // ── Áreas (sub-CRUD dentro do modal) ─────────────────────
  const areasDisponiveis = ref<any[]>([]);
  const loadingListAreas = ref(false);
  const loadingArea = ref(false);

  async function fetchAreas() {
    const id_entidade =
      deps.getEntidadeAtivaId() ||
      store.entidades?.[0]?.id ||
      (store as any).company?.id;
    if (!id_entidade) return;
    loadingListAreas.value = true;
    try {
      const data = (await $fetch("/api/areas", {
        method: "GET",
        params: { id_entidade },
      })) as any;
      areasDisponiveis.value = data?.itens || [];
    } catch (e) {
      console.error("Erro ao buscar áreas", e);
    } finally {
      loadingListAreas.value = false;
    }
  }

  async function handleSaveArea(formData: {
    id: string | null;
    nome_area: string;
    descricao: string;
  }) {
    const id_entidade =
      deps.getEntidadeAtivaId() ||
      store.entidades?.[0]?.id ||
      (store as any).company?.id;
    if (!id_entidade) return false;
    loadingArea.value = true;
    try {
      const res = (await $fetch("/api/areas", {
        method: "POST",
        body: { ...formData, id_entidade, usuario_id: store.user_expandido_id },
      })) as any;
      if (res?.success) {
        deps.toast.showToast(
          formData.id ? "Área atualizada!" : "Área criada!",
          { type: "success" },
        );
        await fetchAreas();
        return true;
      }
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
    } finally {
      loadingArea.value = false;
    }
    return false;
  }

  async function handleDeleteArea(id: string) {
    try {
      const id_entidade =
        deps.getEntidadeAtivaId() ||
        store.entidades?.[0]?.id ||
        (store as any).company?.id;
      const res = (await $fetch("/api/areas", {
        method: "DELETE",
        body: { id, id_entidade },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Área removida", { type: "success" });
        await fetchAreas();
      } else {
        throw new Error(res?.message);
      }
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
    }
  }

  // ── Grade Curricular (curso_modulo) ──────────────────────
  const modulosDoCurso = ref<any[]>([]);
  const loadingModulosCurso = ref(false);
  const loadingCM = ref(false);

  async function fetchModulosDoCurso(cursoId: string) {
    if (!cursoId) return;
    loadingModulosCurso.value = true;
    try {
      const data = (await $fetch("/api/academico_oferta/curso_modulo", {
        method: "GET",
        params: { id_curso: cursoId, _t: Date.now() },
      })) as any;
      modulosDoCurso.value = Array.isArray(data?.itens) ? data.itens : [];
    } catch (e) {
      console.error("Erro ao buscar módulos do curso", e);
    } finally {
      loadingModulosCurso.value = false;
    }
  }

  async function handleAddModulo(
    cursoId: string,
    data: { id_modulo: string; ordem: number },
  ) {
    if (!data.id_modulo || !cursoId) return;
    loadingCM.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/academico_oferta/curso_modulo", {
        method: "POST",
        body: {
          id_curso: cursoId,
          id_modulo: data.id_modulo,
          ordem: data.ordem,
          id_entidade,
          usuario_id: store.user_expandido_id,
        },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Módulo adicionado à grade!", { type: "success" });
        await fetchModulosDoCurso(cursoId);
      } else {
        throw new Error(res?.message || "Erro ao vincular módulo");
      }
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
    } finally {
      loadingCM.value = false;
    }
  }

  async function handleRemoveModulo(cursoId: string, id_modulo: string) {
    if (!cursoId) return;
    try {
      const res = (await $fetch("/api/academico_oferta/curso_modulo", {
        method: "DELETE",
        body: { id_curso: cursoId, id_modulo },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Módulo removido da grade", { type: "success" });
        await fetchModulosDoCurso(cursoId);
      } else {
        throw new Error(res?.message || "Erro ao remover módulo");
      }
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
    }
  }

  return {
    cursos,
    modulosDisponiveis,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    deleteTarget,
    isDeleting,
    fetchCursos,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
    // Curso save
    handleSaveCurso,
    // Áreas sub-CRUD
    areasDisponiveis,
    loadingListAreas,
    loadingArea,
    fetchAreas,
    handleSaveArea,
    handleDeleteArea,
    // Grade curricular
    modulosDoCurso,
    loadingModulosCurso,
    loadingCM,
    fetchModulosDoCurso,
    handleAddModulo,
    handleRemoveModulo,
  };
}
