import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useCursosTurmasModalTurma() {
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isSearching = ref(false);
  const cursos = ref<any[]>([]);

  const fetchCursos = async (search: string, area?: string | null) => {
    isSearching.value = true;
    try {
      const params: Record<string, any> = { limite: 30 };
      if (search && search.length >= 2) params.nome = search;
      if (area) params.area = area;
      const data: any = await ofetch("/api/cursos-turmas", { params });
      cursos.value = data?.itens || [];
    } catch (e) {
      console.error("Error loading courses:", e);
      cursos.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const loadCursoById = async (id: string) => {
    try {
      const data: any = await ofetch(`/api/cursos-turmas/${id}`);
      if (!data) return;
      cursos.value = [
        {
          id,
          nome_curso: data.nome,
          cod_curso: data.codigo,
          area: data.area,
        },
      ];
    } catch (e) {
      console.error("Error loading curso by ID:", e);
    }
  };

  const loadTurma = async (id: string) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch(`/api/cursos-turmas/turma/${id}`);
      return data || null;
    } catch (e) {
      console.error("Error loading turma:", e);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const saveTurma = async (payload: any) => {
    isSaving.value = true;
    try {
      const response: any = await ofetch("/api/cursos-turmas/turmas", {
        method: "POST",
        body: payload,
      });
      return response;
    } catch (e) {
      console.error("Error saving turma:", e);
      throw e;
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isLoading,
    isSaving,
    isSearching,
    cursos,
    fetchCursos,
    loadCursoById,
    loadTurma,
    saveTurma,
  };
}
