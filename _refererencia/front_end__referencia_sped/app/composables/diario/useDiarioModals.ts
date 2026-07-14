import { ref } from "vue";

export function useDiarioModals() {
    // ---- Justificativa Modal ----
    const showJustificativaModal = ref(false);
    const justificativaData = ref<{
        student: any | null;
        type: "justificada" | "abonada" | null;
        text: string;
    }>({
        student: null,
        type: null,
        text: "",
    });

    const openJustificativaModal = (
        student: any,
        type: "justificada" | "abonada",
    ) => {
        if (!student.id_matricula || student.status_matricula !== "Ativa") return;
        justificativaData.value = {
            student,
            type,
            text: student.diario_justificativa || "",
        };
        showJustificativaModal.value = true;
    };

    const closeJustificativaModal = () => {
        showJustificativaModal.value = false;
        justificativaData.value = { student: null, type: null, text: "" };
    };

    // ---- Report Modal (ModalDiario) ----
    const showReportModal = ref(false);
    const selectedStudentForReport = ref<any>(null);

    const openReportModal = (
        student: any,
        turmaId: string | null,
        anoSemestre: string,
        turmas: any[],
    ) => {
        if (!student.id_aluno || student.status_matricula !== "Ativa") return;

        selectedStudentForReport.value = {
            id_matricula: student.id_matricula || null,
            aluno_id: student.id_aluno,
            id_turma: turmaId,
            nome: student.nome_aluno.split(" ")[0],
            sobrenome: student.nome_aluno.split(" ").slice(1).join(" "),
            nome_curso:
                turmas.find((t: any) => t.id === turmaId)?.nome_curso || "",
            ano_semestre: anoSemestre,
        };
        showReportModal.value = true;
    };

    const closeReportModal = () => {
        showReportModal.value = false;
        selectedStudentForReport.value = null;
    };

    // ---- Relatório Bolsistas ----
    const isModalRelatorioBolsistasOpen = ref(false);

    const openRelatorioBolsistas = () => {
        isModalRelatorioBolsistasOpen.value = true;
    };

    const closeRelatorioBolsistas = () => {
        isModalRelatorioBolsistasOpen.value = false;
    };

    // ---- Delete Attendance Modal ----
    const showDeleteAttendanceModal = ref(false);
    const deletingAttendance = ref(false);
    const deleteAttendanceData = ref<{
        student: any | null;
        status: string | null;
        courseName: string;
        date: string;
        aulaLabel: string;
    }>({
        student: null,
        status: null,
        courseName: "",
        date: "",
        aulaLabel: "",
    });

    const openDeleteAttendanceModal = (
        student: any,
        currentStatus: string | null,
        turmaId: string | null,
        data: string,
        aulaSelecionada: string,
        turmas: any[],
    ) => {
        if (!student?.id_matricula || student.status_matricula !== "Ativa") return;

        const selectedTurma = turmas.find((t: any) => t.id === turmaId);

        deleteAttendanceData.value = {
            student,
            status: currentStatus,
            courseName: selectedTurma?.nome_curso || "",
            date: data,
            aulaLabel: aulaSelecionada
                .replace("_", " ")
                .replace(/\b\w/g, (c) => c.toUpperCase()),
        };
        showDeleteAttendanceModal.value = true;
    };

    const closeDeleteAttendanceModal = () => {
        showDeleteAttendanceModal.value = false;
        deletingAttendance.value = false;
        deleteAttendanceData.value = {
            student: null,
            status: null,
            courseName: "",
            date: "",
            aulaLabel: "",
        };
    };

    return {
        showJustificativaModal,
        justificativaData,
        openJustificativaModal,
        closeJustificativaModal,
        showReportModal,
        selectedStudentForReport,
        openReportModal,
        closeReportModal,
        isModalRelatorioBolsistasOpen,
        openRelatorioBolsistas,
        closeRelatorioBolsistas,
        showDeleteAttendanceModal,
        deletingAttendance,
        deleteAttendanceData,
        openDeleteAttendanceModal,
        closeDeleteAttendanceModal,
    };
}
