import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { decorateStudentNames } from "~~/utils/student_name";

export function useDiarioData() {
  const diaryData = ref<any[]>([]);
  const verificationData = ref<any>(null);
  const isLoadingDiary = ref(false);

  // ---- Helpers ----

  const getAulaNumber = (aula: string): number => {
    return parseInt(aula.replace("aula_", ""));
  };

  const getDiarioProperty = (aula: string): string => {
    const num = getAulaNumber(aula);
    return `diario_p${num}`;
  };

  const getCurrentStatus = (
    student: any,
    aulaSelecionada: string,
  ): string | null => {
    const prop = getDiarioProperty(aulaSelecionada);
    return student?.[prop] || null;
  };

  // ---- Data fetching ----

  const enrichDiaryComBolsaStatus = async (
    students: any[],
    isRegulares: boolean,
    anoSemestre: string,
    turmaId: string | null,
  ) => {
    if (!Array.isArray(students) || students.length === 0) return [];

    if (!isRegulares) {
      return students.map((student) => ({
        ...student,
        tem_bolsa_ativa: false,
      }));
    }

    const idsMatricula = students
      .map((s) => s?.id_matricula)
      .filter((id) => typeof id === "string" && id.length > 0);

    if (idsMatricula.length === 0) {
      return students.map((s) => ({ ...s, tem_bolsa_ativa: false }));
    }

    try {
      const response: any = await ofetch("/api/bolsas/atribuicoes/status", {
        method: "POST",
        body: {
          id_matriculas: idsMatricula,
          ano_semestre: anoSemestre,
          id_turma: turmaId,
        },
      });

      const statusByMatricula = response?.statusByMatricula || {};
      return students.map((s) => ({
        ...s,
        tem_bolsa_ativa: Boolean(statusByMatricula[s?.id_matricula]),
      }));
    } catch (error) {
      console.error("Erro ao carregar status de bolsas no diário:", error);
      return students.map((s) => ({ ...s, tem_bolsa_ativa: false }));
    }
  };

  const loadDiary = async (
    turmaId: string | null,
    data: string,
    isRegulares: boolean,
    anoSemestre: string,
  ) => {
    if (!turmaId || !data) return;

    isLoadingDiary.value = true;
    diaryData.value = [];
    verificationData.value = null;

    try {
      const verify: any = await ofetch("/api/diario/verificar", {
        params: { id_turma: turmaId, data },
      });
      verificationData.value = verify;

      if (verify && verify.tem_aula) {
        const entries: any = await ofetch("/api/diario", {
          params: { id_turma: turmaId, data },
        });
        const decorated = decorateStudentNames(entries || []);
        diaryData.value = await enrichDiaryComBolsaStatus(
          decorated,
          isRegulares,
          anoSemestre,
          turmaId,
        );
      }
    } catch (e) {
      console.error("Error loading diary:", e);
    } finally {
      isLoadingDiary.value = false;
    }
  };

  return {
    diaryData,
    verificationData,
    isLoadingDiary,
    getAulaNumber,
    getDiarioProperty,
    getCurrentStatus,
    loadDiary,
    enrichDiaryComBolsaStatus,
  };
}
