<script setup lang="ts">
// diario/[tipo].vue — desacoplado
import { ref, computed, watch, onMounted } from "vue";
import { getAnoSemestre } from "../../../utils/ano_semestre";
import ModalDiario from "~/components/global/ModalDiario.vue";
import ModalRelatorioAtribuicoes from "~/components/global/ModalRelatorioAtribuicoes.vue";
import ConfirmationModal from "~/components/ConfirmationModal.vue";
import DiarioSidebar from "~/components/diario/DiarioSidebar.vue";
import DiarioFiltros from "~/components/diario/DiarioFiltros.vue";
import DiarioStudentCard from "~/components/diario/DiarioStudentCard.vue";
import DiarioJustificativaModal from "~/components/diario/DiarioJustificativaModal.vue";
import DiarioStatusBar from "~/components/diario/DiarioStatusBar.vue";
import { useAppStore } from "~/stores/app";
import { useDiarioTurmas } from "~/composables/diario/useDiarioTurmas";
import { useDiarioData } from "~/composables/diario/useDiarioData";
import { useDiarioAttendance } from "~/composables/diario/useDiarioAttendance";
import { useDiarioModals } from "~/composables/diario/useDiarioModals";

const store = useAppStore();
const route = useRoute();

// ---- Route ----
const tipo = computed(() => route.params.tipo as string);

const VALID_TIPOS = [
    "extensao",
    "regulares",
    "cursos_livres",
    "especializacao",
];

if (!VALID_TIPOS.includes(route.params.tipo as string)) {
    await navigateTo("/diario/regulares", { replace: true });
}

const titleMap: Record<string, string> = {
    extensao: "Diário de Extensão",
    regulares: "Diário de Regulares",
    cursos_livres: "Diário de Cursos Livres",
    especializacao: "Diário Especialização",
};
const pageTitle = computed(() => titleMap[tipo.value] || "Diário de Classe");

const areaMap: Record<string, string> = {
    extensao: "Extensão",
    regulares: "Regulares",
    cursos_livres: "Cursos Livres",
    especializacao: "especializacao",
};
const currentArea = computed(() => areaMap[tipo.value] || "");

// Helper to get current area as string
const getArea = (): string => currentArea.value || "";

const isRegulares = computed(() => tipo.value === "regulares");

// ---- Composables ----
const {
    semestres,
    turmas,
    turmaOptions,
    qtdPeriodos,
    fetchTurmas,
    getFirstTurmaId,
    getPeriodosPorTurma,
} = useDiarioTurmas();

const {
    diaryData,
    verificationData,
    isLoadingDiary,
    getAulaNumber,
    getDiarioProperty,
    getCurrentStatus,
    loadDiary,
} = useDiarioData();

const {
    savingAttendance,
    handlePresenca,
    saveJustificativa,
    confirmDeleteAttendance,
} = useDiarioAttendance();

const {
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
} = useDiarioModals();

// ---- UI State ----
const filters = ref<{
    data: string;
    turmaId: string | null;
    search: string;
    bolsista: string;
    anoSemestre: string;
}>({
    data: new Date().toISOString().substring(0, 10),
    turmaId: null as string | null,
    search: "",
    bolsista: "",
    anoSemestre: getAnoSemestre(),
});

const aulaSelecionada = ref("aula_1");

// ---- Computed (page-level) ----
const filteredDiaryData = computed(() => {
    let result = [...diaryData.value];

    if (isRegulares.value && filters.value.bolsista === "sim") {
        result = result.filter((s: any) => Boolean(s.tem_bolsa_ativa));
    }

    if (!filters.value.search) return result;

    const q = filters.value.search.toLowerCase();
    return result.filter((s: any) => {
        return (
            s.nome_aluno?.toLowerCase().startsWith(q) ||
            s.nome_social?.toLowerCase().startsWith(q) ||
            s.nome_artistico?.toLowerCase().startsWith(q) ||
            s.ra?.toLowerCase().startsWith(q) ||
            s.ra_legado?.toLowerCase().startsWith(q)
        );
    });
});

// ---- Wrappers ----
const s = () => filters.value;

const _fetchTurmas = () => fetchTurmas(s().anoSemestre, getArea());
const _loadDiary = () =>
    loadDiary(s().turmaId, s().data, isRegulares.value, s().anoSemestre);

// ---- Handlers ----
const handlePresencaClick = (student: any) => {
    handlePresenca(
        student,
        "Presente",
        aulaSelecionada.value,
        s().turmaId,
        s().data,
        qtdPeriodos.value,
        getArea(),
        turmas.value,
        diaryData.value,
        getAulaNumber,
        getDiarioProperty,
    );
};

const handleFaltaClick = (student: any) => {
    handlePresenca(
        student,
        "Falta",
        aulaSelecionada.value,
        s().turmaId,
        s().data,
        qtdPeriodos.value,
        getArea(),
        turmas.value,
        diaryData.value,
        getAulaNumber,
        getDiarioProperty,
    );
};

const handleJustificativaClick = (student: any) => {
    openJustificativaModal(student, "justificada");
};

const handleAbonoClick = (student: any) => {
    openJustificativaModal(student, "abonada");
};

const handleSaveJustificativa = async () => {
    await saveJustificativa(
        justificativaData.value.student,
        justificativaData.value.type!,
        justificativaData.value.text,
        aulaSelecionada.value,
        s().turmaId,
        s().data,
        qtdPeriodos.value,
        getArea(),
        turmas.value,
        diaryData.value,
        getAulaNumber,
        getDiarioProperty,
    );
    closeJustificativaModal();
};

const handleReportClick = (student: any) => {
    openReportModal(student, s().turmaId, s().anoSemestre, turmas.value);
};

const handleDeleteClick = (student: any) => {
    openDeleteAttendanceModal(
        student,
        getCurrentStatus(student, aulaSelecionada.value),
        s().turmaId,
        s().data,
        aulaSelecionada.value,
        turmas.value,
    );
};

const handleConfirmDelete = async () => {
    deletingAttendance.value = true;
    const ok = await confirmDeleteAttendance(
        deleteAttendanceData.value.student,
        aulaSelecionada.value,
        s().data,
        diaryData.value,
        getAulaNumber,
        getDiarioProperty,
    );
    if (ok) {
        closeDeleteAttendanceModal();
    }
    deletingAttendance.value = false;
};

// ---- Watchers ----
watch(
    () => filters.value.anoSemestre,
    async () => {
        await store.refreshHash();
        _fetchTurmas();
    },
);

watch(
    () => filters.value.turmaId,
    async () => {
        qtdPeriodos.value = getPeriodosPorTurma(
            filters.value.turmaId,
            tipo.value === "especializacao",
        );
        await store.refreshHash();
        _loadDiary();
    },
);

watch(
    () => tipo.value,
    () => {
        if (tipo.value !== "regulares") {
            filters.value.bolsista = "";
        }
    },
);

watch(
    () => filters.value.data,
    async () => {
        await store.refreshHash();
        _loadDiary();
    },
);

watch(
    () => tipo.value,
    () => {
        filters.value.turmaId = null;
        _fetchTurmas();
    },
);

onMounted(() => {
    _fetchTurmas();
});
</script>

<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- FILTERS -->
            <DiarioFiltros
                v-model:filters="filters"
                v-model:aula="aulaSelecionada"
                :turma-options="turmaOptions"
                :qtd-periodos="qtdPeriodos"
                :is-regulares="isRegulares"
                :semestres="semestres"
            />

            <!-- CONTENT -->
            <div class="px-0 md:px-0 pb-12">
                <div
                    v-if="!filters.turmaId"
                    class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
                >
                    <p class="text-white font-medium">
                        Selecione uma turma para visualizar o diário.
                    </p>
                </div>

                <div v-else class="space-y-6">
                    <DiarioStatusBar
                        v-if="verificationData && !verificationData.tem_aula"
                        :motivo="verificationData.motivo"
                    />

                    <!-- Loading -->
                    <div
                        v-if="isLoadingDiary"
                        class="flex justify-center py-20"
                    >
                        <div
                            class="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"
                        ></div>
                    </div>

                    <!-- Student Grid -->
                    <div
                        v-else-if="filteredDiaryData.length > 0"
                        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    >
                        <DiarioStudentCard
                            v-for="student in filteredDiaryData"
                            :key="student.id_matricula"
                            :student="student"
                            :aula-selecionada="aulaSelecionada"
                            :is-regulares="isRegulares"
                            :hash-base="store.hash_base || ''"
                            :saving-attendance="savingAttendance"
                            :get-diario-property="getDiarioProperty"
                            @presenca="handlePresencaClick"
                            @falta="handleFaltaClick"
                            @justificativa="handleJustificativaClick"
                            @abono="handleAbonoClick"
                            @report="handleReportClick"
                            @delete="handleDeleteClick"
                        />
                    </div>

                    <div
                        v-else-if="verificationData?.tem_aula"
                        class="text-center py-20 text-secondary opacity-50"
                    >
                        Nenhum aluno encontrado nesta turma.
                    </div>
                </div>
            </div>
        </div>

        <template #sidebar>
            <DiarioSidebar
                :students="diaryData"
                :loading="isLoadingDiary"
                :aula-selecionada="
                    aulaSelecionada as 'aula_1' | 'aula_2' | 'aula_3' | 'aula_4'
                "
                :show-relatorio-bolsistas="isRegulares"
                @open-relatorio-bolsistas="openRelatorioBolsistas"
            />
        </template>

        <!-- Modals -->
        <DiarioJustificativaModal
            :is-open="showJustificativaModal"
            :data="justificativaData"
            :filters="filters"
            :aula-selecionada="aulaSelecionada"
            v-model:text="justificativaData.text"
            @close="closeJustificativaModal"
            @save="handleSaveJustificativa"
        />

        <ModalDiario
            :is-open="showReportModal"
            :aluno="selectedStudentForReport"
            @close="closeReportModal"
        />

        <ModalRelatorioAtribuicoes
            :is-open="isModalRelatorioBolsistasOpen"
            :ano-semestre="filters.anoSemestre"
            @close="closeRelatorioBolsistas"
        />

        <ConfirmationModal
            :is-open="showDeleteAttendanceModal"
            title="Apagar registro do diário"
            :message="`Tem certeza que deseja apagar o registro no diário de ${deleteAttendanceData.student?.nome_aluno || 'aluno'} para o curso ${deleteAttendanceData.courseName || '-'} na data ${deleteAttendanceData.date ? deleteAttendanceData.date.split('-').reverse().join('/') : '-'} (${deleteAttendanceData.aulaLabel || '-'})?`"
            confirm-text="Apagar"
            cancel-text="Cancelar"
            type="danger"
            :loading="deletingAttendance"
            @close="closeDeleteAttendanceModal"
            @confirm="handleConfirmDelete"
        />
    </NuxtLayout>
</template>

<style scoped>
input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    bottom: 0;
    color: transparent;
    cursor: pointer;
    height: auto;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: auto;
}
</style>
