import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

// Composable: estado e fetch de editais
export function useBolsasEditais() {
  const toast = useToast();
  const isLoading = ref(false);
  const editais = ref<any[]>([]);

  const fetchEditais = async (anoSemestre: string) => {
    isLoading.value = true;
    try {
      const response = (await ofetch("/api/bolsas/editais", {
        query: { ano_semestre: anoSemestre },
      })) as any;
      const data = response?.data || response || [];
      editais.value = Array.isArray(data) ? data : [];
    } catch (e: any) {
      console.error(e);
      toast.showToast("Erro ao carregar editais.", { type: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  return { editais, isLoading, fetchEditais };
}
