import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";
import { decorateStudentNames } from "../../../utils/student_name";

export function useAvaliacaoGestaoAlunos() {
  const alunos = ref<any[]>([]);
  const loadingAlunos = ref(false);

  const fetchAlunos = async (turmaId: string, anoSemestre: string) => {
    if (!turmaId) return;
    loadingAlunos.value = true;
    alunos.value = [];
    try {
      const data: any = await ofetch("/api/matriculas/alunos", {
        params: {
          id_turma: turmaId,
          ano_semestre: anoSemestre,
          status: "Ativa",
          limit: 200,
        },
      });
      alunos.value = decorateStudentNames(
        data?.alunos ?? (Array.isArray(data) ? data : []),
      );
    } catch (e) {
      console.error(e);
    } finally {
      loadingAlunos.value = false;
    }
  };

  return { alunos, loadingAlunos, fetchAlunos };
}
