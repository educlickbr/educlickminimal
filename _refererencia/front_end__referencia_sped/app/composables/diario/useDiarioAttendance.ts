import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useDiarioAttendance() {
  const savingAttendance = ref<
    Record<string, { status: "saving" | "saved"; timestamp?: Date }>
  >({});

  const handlePresenca = async (
    student: any,
    status: "Presente" | "Falta",
    aulaSelecionada: string,
    turmaId: string | null,
    data: string,
    qtdPeriodos: number,
    area: string,
    turmas: any[],
    diaryData: any[],
    getAulaNumber: (aula: string) => number,
    getDiarioProperty: (aula: string) => string,
  ) => {
    if (!student.id_matricula || student.status_matricula !== "Ativa") return;

    const matriculaId = student.id_matricula;
    savingAttendance.value[matriculaId] = { status: "saving" };

    try {
      const selectedTurma = turmas.find((t: any) => t.id === turmaId);
      const aulaNum = getAulaNumber(aulaSelecionada);

      await ofetch("/api/diario/presenca", {
        method: "POST",
        body: {
          id_matricula: matriculaId,
          data,
          status,
          aula: aulaNum,
          qtd_periodos: qtdPeriodos,
          area: selectedTurma?.area_curso || area,
        },
      });

      const studentIndex = diaryData.findIndex(
        (s: any) => s.id_matricula === matriculaId,
      );
      if (studentIndex !== -1) {
        const prop = getDiarioProperty(aulaSelecionada);
        diaryData[studentIndex][prop] = status.toLowerCase();
      }

      savingAttendance.value[matriculaId] = {
        status: "saved",
        timestamp: new Date(),
      };

      setTimeout(() => {
        delete savingAttendance.value[matriculaId];
      }, 1200);
    } catch (error) {
      console.error("Error saving attendance:", error);
      delete savingAttendance.value[matriculaId];
    }
  };

  const saveJustificativa = async (
    student: any,
    type: "justificada" | "abonada",
    text: string,
    aulaSelecionada: string,
    turmaId: string | null,
    data: string,
    qtdPeriodos: number,
    area: string,
    turmas: any[],
    diaryData: any[],
    getAulaNumber: (aula: string) => number,
    getDiarioProperty: (aula: string) => string,
  ) => {
    if (!student?.id_matricula || !type) return;

    const matriculaId = student.id_matricula;
    savingAttendance.value[matriculaId] = { status: "saving" };

    try {
      const selectedTurma = turmas.find((t: any) => t.id === turmaId);
      const aulaNum = getAulaNumber(aulaSelecionada);

      await ofetch("/api/diario/presenca", {
        method: "POST",
        body: {
          id_matricula: matriculaId,
          data,
          status: type,
          aula: aulaNum,
          qtd_periodos: qtdPeriodos,
          area: selectedTurma?.area_curso || area,
          justificativa: text,
        },
      });

      const studentIndex = diaryData.findIndex(
        (s: any) => s.id_matricula === matriculaId,
      );
      if (studentIndex !== -1) {
        const prop = getDiarioProperty(aulaSelecionada);
        diaryData[studentIndex][prop] = type;
        diaryData[studentIndex].diario_justificativa = text;
      }

      savingAttendance.value[matriculaId] = {
        status: "saved",
        timestamp: new Date(),
      };

      setTimeout(() => {
        delete savingAttendance.value[matriculaId];
      }, 1200);
    } catch (error) {
      console.error("Error saving justificativa:", error);
      delete savingAttendance.value[matriculaId];
    }
  };

  const confirmDeleteAttendance = async (
    student: any,
    aulaSelecionada: string,
    data: string,
    diaryData: any[],
    getAulaNumber: (aula: string) => number,
    getDiarioProperty: (aula: string) => string,
  ): Promise<boolean> => {
    if (!student?.id_matricula) return false;

    const matriculaId = student.id_matricula;
    savingAttendance.value[matriculaId] = { status: "saving" };

    try {
      const aulaNum = getAulaNumber(aulaSelecionada);

      await ofetch("/api/diario/presenca", {
        method: "DELETE",
        params: {
          id_matricula: matriculaId,
          data,
          aula: aulaNum,
        },
      });

      const studentIndex = diaryData.findIndex(
        (s: any) => s.id_matricula === matriculaId,
      );
      if (studentIndex !== -1) {
        const prop = getDiarioProperty(aulaSelecionada);
        diaryData[studentIndex][prop] = null;
        diaryData[studentIndex].diario_justificativa = null;
      }

      savingAttendance.value[matriculaId] = {
        status: "saved",
        timestamp: new Date(),
      };

      setTimeout(() => {
        delete savingAttendance.value[matriculaId];
      }, 1200);

      return true;
    } catch (error) {
      console.error("Error deleting attendance:", error);
      delete savingAttendance.value[matriculaId];
      return false;
    }
  };

  return {
    savingAttendance,
    handlePresenca,
    saveJustificativa,
    confirmDeleteAttendance,
  };
}
