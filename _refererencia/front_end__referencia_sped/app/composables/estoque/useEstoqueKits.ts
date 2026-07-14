import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useEstoqueKits() {
  const kits = ref<any[]>([]);
  const isLoading = ref(false);

  const fetchKits = async () => {
    isLoading.value = true;
    try {
      const data = await ofetch("/api/producao/estoque/kits");
      kits.value = data || [];
    } finally {
      isLoading.value = false;
    }
  };

  const createKit = async (nome: string) => {
    const data: any = await ofetch("/api/producao/estoque/kits", {
      method: "POST",
      body: { nome },
    });
    if (!data.success) throw new Error(data.message);
    return data.kit;
  };

  const updateKit = async (id: string, nome: string) => {
    const data: any = await ofetch("/api/producao/estoque/kits", {
      method: "PUT",
      body: { id, nome },
    });
    if (!data.success) throw new Error(data.message);
    return data.kit;
  };

  const deleteKit = async (id: string) => {
    await ofetch("/api/producao/estoque/kits", {
      method: "DELETE",
      params: { id },
    });
  };

  return {
    kits,
    isLoading,
    fetchKits,
    createKit,
    updateKit,
    deleteKit,
  };
}
