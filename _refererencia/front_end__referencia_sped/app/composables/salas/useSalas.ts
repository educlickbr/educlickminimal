import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useSalas() {
  const salas = ref<any[]>([]);
  const isLoading = ref(false);

  const fetchSalas = async () => {
    isLoading.value = true;
    try {
      const data = await ofetch("/api/producao/salas/get");
      salas.value = data || [];
    } finally {
      isLoading.value = false;
    }
  };

  const deleteSala = async (id: string) => {
    await ofetch("/api/producao/salas/delete", {
      method: "POST",
      body: { id },
    });
  };

  return {
    salas,
    isLoading,
    fetchSalas,
    deleteSala,
  };
}
