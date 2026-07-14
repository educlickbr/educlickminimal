import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useCursosTurmasModalCurso() {
  const isLoading = ref(false);
  const isSaving = ref(false);

  const loadCurso = async (id: string) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch(`/api/cursos-turmas/${id}`);
      return data || null;
    } catch (e) {
      console.error("Error loading curso:", e);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const saveCurso = async (payload: any) => {
    isSaving.value = true;
    try {
      const response: any = await ofetch("/api/cursos-turmas", {
        method: "POST",
        body: payload,
      });
      return response;
    } catch (e) {
      console.error("Error saving curso:", e);
      throw e;
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isLoading,
    isSaving,
    loadCurso,
    saveCurso,
  };
}
