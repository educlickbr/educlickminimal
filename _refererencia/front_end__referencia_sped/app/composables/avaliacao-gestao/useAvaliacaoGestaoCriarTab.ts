import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useAvaliacaoGestaoCriarTab() {
  const avaliacoes = ref<any[]>([]);
  const isLoading = ref(false);

  const fetchAvaliacoes = async (etapa: string | null) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao", {
        params: { etapa: etapa || null },
      });
      avaliacoes.value = data || [];
    } catch (e) {
      console.error(e);
      avaliacoes.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAvaliacao = async (id: string) => {
    await ofetch(`/api/avaliacao-gestao/${id}`, { method: "DELETE" });
  };

  return { avaliacoes, isLoading, fetchAvaliacoes, deleteAvaliacao };
}
