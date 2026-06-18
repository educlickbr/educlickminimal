/**
 * useFormulariosPerguntas
 *
 * Composable para CRUD do banco de perguntas.
 * Já usa RPC via BFF (frm_get_perguntas, frm_upsert_pergunta, frm_delete_pergunta).
 */

import { ref } from "vue";

export interface Pergunta {
  id: string;
  id_entidade: string | null;
  nome_interno: string;
  label: string;
  placeholder: string;
  tipo_pergunta: string;
  opcoes: any;
  global: boolean;
  created_at: string;
}

export function useFormulariosPerguntas(deps: {
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
}) {
  const perguntas = ref<Pergunta[]>([]);
  const loading = ref(false);

  // Modal
  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<Pergunta | null>(null);

  async function fetchPerguntas() {
    loading.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/formularios/perguntas", {
        method: "GET",
        params: { id_entidade },
      })) as any;

      perguntas.value = Array.isArray(res?.data) ? res.data : [];
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao buscar perguntas", {
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

  function openEditar(p: Pergunta) {
    isEdit.value = true;
    editData.value = p;
    showModal.value = true;
  }

  function handleSaved() {
    fetchPerguntas();
    showModal.value = false;
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza? Isso apagará a pergunta do banco globalmente."))
      return;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/formularios/perguntas", {
        method: "DELETE",
        params: { id, id_entidade },
      })) as any;

      if (res?.success) {
        deps.toast.showToast("Pergunta removida", { type: "success" });
        await fetchPerguntas();
      } else {
        deps.toast.showToast(res?.message || "Erro", { type: "error" });
      }
    } catch (e: any) {
      deps.toast.showToast(e.message, { type: "error" });
    }
  }

  async function handleSave(data: {
    id: string | null;
    id_entidade: string;
    nome_interno: string;
    label: string;
    placeholder: string;
    tipo_pergunta: string;
    opcoes: any;
  }) {
    if (!data.label || !data.nome_interno || !data.tipo_pergunta) {
      deps.toast.showToast("Preencha os campos obrigatórios", {
        type: "error",
      });
      return false;
    }
    try {
      const res = (await $fetch("/api/formularios/perguntas", {
        method: "POST",
        body: data,
      })) as any;
      if (res?.success) {
        deps.toast.showToast(`Pergunta ${data.id ? "atualizada" : "criada"}!`, {
          type: "success",
        });
        await fetchPerguntas();
        return true;
      } else {
        deps.toast.showToast(res?.message || "Erro ao salvar", {
          type: "error",
        });
        return false;
      }
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro de comunicação", {
        type: "error",
      });
      return false;
    }
  }

  return {
    perguntas,
    loading,
    showModal,
    isEdit,
    editData,
    fetchPerguntas,
    openNova,
    openEditar,
    handleSaved,
    handleDelete,
    handleSave,
  };
}
