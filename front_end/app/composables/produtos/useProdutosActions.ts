import { ref, computed } from "vue";
import { useAppStore } from "~~/stores/app";

export function useProdutosActions(deps: {
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (
      msg: string,
      opts?: { type?: "info" | "error" | "success" },
    ) => void;
  };
  refresh: () => Promise<void>;
}) {
  const store = useAppStore();
  const isModalOpen = ref(false);
  const selectedItem = ref<any>(null);
  const filtroPrograma = ref<string | null>(null);

  function handleNew() {
    selectedItem.value = null;
    filtroPrograma.value = null;
    isModalOpen.value = true;
  }

  function handleNewForPrograma(programaId: string) {
    selectedItem.value = null;
    filtroPrograma.value = programaId;
    isModalOpen.value = true;
  }

  function handleEdit(produto: any) {
    selectedItem.value = { ...produto };
    filtroPrograma.value = null;
    isModalOpen.value = true;
  }

  function closeModal() {
    isModalOpen.value = false;
    selectedItem.value = null;
    filtroPrograma.value = null;
  }

  async function handleSave(data: any): Promise<boolean> {
    try {
      const id_entidade = await deps.garantirEntidade();

      const res = (await $fetch("/api/comercial/produtos", {
        method: "POST",
        body: {
          ...data,
          id_entidade,
          usuario_id: store.user_expandido_id,
        },
      })) as any;

      if (res?.success) {
        deps.toast.showToast("Produto salvo com sucesso!", { type: "success" });
        await deps.refresh();
        closeModal();
        return true;
      }
      throw new Error(res?.message || "Erro ao salvar produto");
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao salvar", { type: "error" });
      return false;
    }
  }

  return {
    isModalOpen: computed(() => isModalOpen.value),
    selectedItem: computed(() => selectedItem.value),
    filtroPrograma: computed(() => filtroPrograma.value),
    handleNew,
    handleNewForPrograma,
    handleEdit,
    closeModal,
    handleSave,
  };
}
