<script setup lang="ts">
import { getAnoSemestre } from "../../../utils/ano_semestre";
import ModalDadosCandidato from "../../components/modais_globais/ModalDadosCandidato.vue";
import ModalDiario from "~/components/global/ModalDiario.vue";
import ModalStatusMatricula from "../../components/ModalStatusMatricula.vue";
import ModalTrocaTurno from "../../components/matriculas/ModalTrocaTurno.vue";
import ModalUnificarConta from "../../components/matriculas/ModalUnificarConta.vue";
import ModalEmail from "../../components/ModalEmail.vue";
import ModalNomeImpressao from "~/components/ModalNomeImpressao.vue";
import ModalListaAlunos from "~/components/matriculas/ModalListaAlunos.vue";
import ModalRelatorioAtribuicoes from "~/components/global/ModalRelatorioAtribuicoes.vue";
import ModalStatusDeclaracao from "~/components/ModalStatusDeclaracao.vue";
import MatriculasAlunosTab from "../../components/matriculas/alunos/MatriculasAlunosTab.vue";
import MatriculasDeclaracoesTab from "../../components/matriculas/declaracoes/MatriculasDeclaracoesTab.vue";
import MatriculasAtestadoTab from "../../components/matriculas/atestados/MatriculasAtestadoTab.vue";
import MatriculasHeader from "../../components/matriculas/MatriculasHeader.vue";
import { useAppStore } from "~/stores/app";
import { formatDate as formatDateSP } from "~/utils/date";
import { useToast } from "../../../composables/useToast";
import { $fetch as ofetch } from "ofetch";
import { useMatriculasTurmas } from "~/composables/matriculas/useMatriculasTurmas";
import { useMatriculasStats } from "~/composables/matriculas/useMatriculasStats";
import { useMatriculasAlunos } from "~/composables/matriculas/useMatriculasAlunos";
import { useMatriculasJustificativas } from "~/composables/matriculas/useMatriculasJustificativas";
import { useMatriculasDeclaracoes } from "~/composables/matriculas/useMatriculasDeclaracoes";
import { useMatriculasExcelExport } from "~/composables/matriculas/useMatriculasExcelExport";
import CandidateDashboard from "~/components/carometro/CandidateDashboard.vue";
import ConfirmationModal from "~/components/ConfirmationModal.vue";

const store = useAppStore();
const { showToast } = useToast();
const hashBase = computed(() => store.hash_base || "");

// ── Composables ──
const { turmas, isLoading, fetchTurmas } = useMatriculasTurmas();
const { dashboardStats, fetchStats } = useMatriculasStats();
const {
    alunos,
    isLoading: isLoadingAlunos,
    pagination,
    limit,
    fetchAlunos,
} = useMatriculasAlunos();
const {
    justificativas,
    isLoading: isLoadingJustificativas,
    paginacao: paginacaoJustificativas,
    processingId,
    editingAvaliacaoId,
    avaliacaoDraft,
    editingDateId: editingJustificativaDateId,
    savingDateId: savingJustificativaDateId,
    dateDrafts: justificativaDateDrafts,
    fetchJustificativas,
    updateStatus,
    saveAvaliacao,
    updateEscopo,
    openAttachment,
    openDateEditor: openJustificativaDateEditor,
    cancelDateEdit: cancelJustificativaDateEdit,
    saveDates: saveJustificativaDates,
} = useMatriculasJustificativas();
const {
    declaracoes,
    isLoading: isLoadingDeclaracoes,
    fetchDeclaracoes,
    modalStatusOpen,
    selectedDeclaration,
    openStatusModal: openDeclStatusModal,
    saveDeclarationStatus,
    showPrintNameModal: showDeclarationPrintNameModal,
    printNameOptions: declarationPrintNameOptions,
    printNameLoading: declarationPrintNameLoading,
    nameAction: declarationNameAction,
    openNameChoiceModal: openDeclarationNameChoiceModal,
    closePrintNameModal: closeDeclarationPrintNameModal,
    confirmNameChoice: confirmDeclarationNameChoice,
    editingDateId: editingDeclarationDateId,
    savingDateId: savingDeclarationDateId,
    dateDrafts: declarationDateDrafts,
    openDateEditor: openDeclarationDateEditor,
    cancelDateEdit: cancelDeclarationDateEdit,
    saveMatriculaDate: saveDeclarationMatriculaDate,
    restoreMatriculaDate: restoreDeclarationMatriculaDate,
} = useMatriculasDeclaracoes();
const { isExcelLoading, exportExcel } = useMatriculasExcelExport();

// ── UI State ──
const activeTab = ref("alunos");
const anoSemestre = ref(getAnoSemestre());

// Filters
const filters = ref({
    turno: "",
    area: "",
    curso: "",
    busca: "",
    status: "Ativa",
    bolsista: "",
    status_justificativa: "",
    status_declaracao: "",
    escopo: "",
    busca_atestado: "",
    data_atestado: "",
});
const areas = [
    { label: "Regulares", value: "Regulares" },
    { label: "Cursos Livres", value: "Cursos Livres" },
    { label: "Extensao", value: "Extensao" },
    { label: "Especializacao", value: "especializacao" },
];

// Modal state
const showDataModal = ref(false);
const selectedCandidateForData = ref<any>(null);
const modalMode = ref<"dados" | "documentos" | "avaliar">("dados");
const showDiarioModal = ref(false);
const selectedCandidateForDiario = ref<any>(null);
const showStatusModal = ref(false);
const selectedCandidateForStatus = ref<any>(null);
const showEmailModal = ref(false);
const selectedCandidateForEmail = ref<any>(null);
const showTrocaTurnoModal = ref(false);
const selectedCandidateForTroca = ref<any>(null);
const showUnificarContaModal = ref(false);
const selectedCandidateForUnificacao = ref<any>(null);
const isModalListaAlunosOpen = ref(false);
const isModalRelatorioBolsistasOpen = ref(false);
const showRematriculaConfirm = ref(false);
const selectedCandidateForRematricula = ref<any>(null);
const isRematriculaLoading = ref(false);

// ── Wrappers (injetam anoSemestre + filters) ──
const s = () => anoSemestre.value;
const f = () => filters.value;
const _fetchTurmas = () => fetchTurmas(s(), f().turno, f().area);
const _fetchStats = () => fetchStats(s(), f());
const _fetchAlunos = (page = 1) => fetchAlunos(s(), f(), page);
const _fetchJustificativas = (page = 1) => fetchJustificativas(s(), f(), page);
const _fetchDeclaracoes = () => fetchDeclaracoes(s(), f());

const handleTabChange = () => {
    if (activeTab.value === "alunos") _fetchAlunos(1);
    else if (activeTab.value === "atestado") _fetchJustificativas(1);
    else if (activeTab.value === "declaracao") _fetchDeclaracoes();
};

// Pagination
const previousPage = async () => {
    if (pagination.value.pagina_atual > 1) {
        await store.refreshHash();
        _fetchAlunos(pagination.value.pagina_atual - 1);
    }
};
const nextPage = async () => {
    if (pagination.value.pagina_atual < pagination.value.qtd_paginas) {
        await store.refreshHash();
        _fetchAlunos(pagination.value.pagina_atual + 1);
    }
};
const prevPageJustificativas = () => {
    if (paginacaoJustificativas.value.pagina_atual > 1)
        _fetchJustificativas(paginacaoJustificativas.value.pagina_atual - 1);
};
const nextPageJustificativas = () => {
    if (
        paginacaoJustificativas.value.pagina_atual <
        paginacaoJustificativas.value.qtd_paginas
    )
        _fetchJustificativas(paginacaoJustificativas.value.pagina_atual + 1);
};

// ── Modal Handlers ──
const openDataModal = async (
    aluno: any,
    mode: "dados" | "documentos" = "dados",
) => {
    await store.refreshHash();
    selectedCandidateForData.value = {
        ...aluno,
        id_user_expandido: aluno.aluno_id,
    };
    modalMode.value = mode;
    showDataModal.value = true;
};
const handleCandidateUpdate = () => {};
const openDiarioModal = (aluno: any) => {
    if (!aluno.id_matricula) {
        showToast("Este registro nao trouxe id_matricula.", { type: "error" });
        return;
    }
    selectedCandidateForDiario.value = {
        ...aluno,
        id_matricula: aluno.id_matricula,
        aluno_id: aluno.aluno_id || aluno.id_aluno || null,
        id_turma: aluno.id_turma || aluno.turma_id || null,
    };
    showDiarioModal.value = true;
};
const openStatusModal = (aluno: any) => {
    selectedCandidateForStatus.value = aluno;
    showStatusModal.value = true;
};
const handleStatusUpdate = () => {
    _fetchAlunos(pagination.value.pagina_atual);
    _fetchStats();
};

const handleRematricula = (aluno: any) => {
    selectedCandidateForRematricula.value = aluno;
    showRematriculaConfirm.value = true;
};

const handleConfirmRematricula = async () => {
    const aluno = selectedCandidateForRematricula.value;
    if (!aluno) return;

    isRematriculaLoading.value = true;
    try {
        const response: any = await ofetch("/api/matriculas/rematricula", {
            method: "POST",
            body: {
                id_user_expandido: aluno.aluno_id,
                id_turma_atual: aluno.id_turma,
            },
        });
        showToast(response.message, { type: "info" });
        showRematriculaConfirm.value = false;
        selectedCandidateForRematricula.value = null;
        _fetchAlunos(pagination.value.pagina_atual);
    } catch (e: any) {
        showToast(e.statusMessage || "Erro ao realizar rematricula", {
            type: "error",
        });
    } finally {
        isRematriculaLoading.value = false;
    }
};

const openEmailModal = (aluno: any) => {
    selectedCandidateForEmail.value = aluno;
    showEmailModal.value = true;
};
const openTrocaTurnoModal = (aluno: any) => {
    selectedCandidateForTroca.value = aluno;
    showTrocaTurnoModal.value = true;
};
const handleTrocaTurnoChanged = () => {
    _fetchAlunos(pagination.value.pagina_atual);
    _fetchStats();
};
const openUnificarContaModal = (aluno: any) => {
    selectedCandidateForUnificacao.value = aluno;
    showUnificarContaModal.value = true;
};
const handleUnificacaoSuccess = () => {
    _fetchAlunos(pagination.value.pagina_atual);
    _fetchStats();
};
const handleOpenRelatorioBolsistas = () => {
    isModalRelatorioBolsistasOpen.value = true;
};

const handleSendEmail = async (payload: any) => {
    try {
        await ofetch("/api/matriculas/enviar-email", {
            method: "POST",
            body: payload,
        });
        showToast("Email enviado com sucesso!", { type: "success" });
        showEmailModal.value = false;
    } catch (e: any) {
        showToast(
            e.response?._data?.statusMessage ||
                e.message ||
                "Erro ao enviar email.",
            { type: "error" },
        );
    }
};
const handleSendBulkEmail = async (payload: any) => {
    try {
        await ofetch("/api/matriculas/enviar-email-bulk", {
            method: "POST",
            body: payload,
        });
        showToast("Envio em massa iniciado com sucesso!", { type: "success" });
    } catch (e: any) {
        showToast(
            e.response?._data?.statusMessage ||
                e.message ||
                "Erro ao enviar emails.",
            { type: "error" },
        );
    }
};

const handleExcelExport = () => exportExcel(s(), f().area);
const openStatusModalForDeclaration = (item: any) => openDeclStatusModal(item);

// ── Watchers ──
watch([anoSemestre, () => f().turno, () => f().area], async () => {
    await store.refreshHash();
    _fetchTurmas();
});
watch(
    () => f().curso,
    async () => {
        await store.refreshHash();
        handleTabChange();
        _fetchStats();
    },
);

let searchTimeout: any;
watch(
    () => f().busca,
    () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            await store.refreshHash();
            handleTabChange();
            _fetchStats();
        }, 500);
    },
);

watch(
    () => f().status,
    async () => {
        await store.refreshHash();
        if (activeTab.value === "alunos") _fetchAlunos(1);
        _fetchStats();
    },
);
watch(
    () => f().bolsista,
    async () => {
        await store.refreshHash();
        if (activeTab.value === "alunos") _fetchAlunos(1);
    },
);
watch(
    () => f().status_justificativa,
    async () => {
        if (activeTab.value === "atestado") _fetchJustificativas(1);
    },
);
watch(
    () => f().escopo,
    async () => {
        if (activeTab.value === "atestado") _fetchJustificativas(1);
    },
);
watch(
    () => f().data_atestado,
    () => {
        if (activeTab.value === "atestado") _fetchJustificativas(1);
    },
);

let buscaAtestadoTimer: any;
watch(
    () => f().busca_atestado,
    () => {
        clearTimeout(buscaAtestadoTimer);
        buscaAtestadoTimer = setTimeout(() => {
            if (activeTab.value === "atestado") _fetchJustificativas(1);
        }, 400);
    },
);

watch(
    () => f().status_declaracao,
    async () => {
        if (activeTab.value === "declaracao") _fetchDeclaracoes();
    },
);
watch(activeTab, () => handleTabChange());

// Utils (for placeholder template)
const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    return formatDateSP(dateString) || "--";
};

onMounted(() => _fetchTurmas());
</script>

<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <MatriculasHeader
                v-model:active-tab="activeTab"
                v-model:ano-semestre="anoSemestre"
                v-model:filters="filters"
                :turmas="turmas"
                :areas="areas"
                :is-loading="isLoading"
            />

            <!-- CONTENT AREA -->
            <MatriculasAlunosTab
                v-if="activeTab === 'alunos'"
                :alunos="alunos"
                :is-loading="isLoadingAlunos"
                :pagination="pagination"
                :limit="limit"
                :hash-base="hashBase"
                @open-data-modal="openDataModal"
                @open-diario-modal="openDiarioModal"
                @open-status-modal="openStatusModal"
                @rematricula="handleRematricula"
                @open-email-modal="openEmailModal"
                @open-troca-turno-modal="openTrocaTurnoModal"
                @open-unificar-conta-modal="openUnificarContaModal"
                @previous-page="previousPage"
                @next-page="nextPage"
            />

            <!-- Declaracoes View -->
            <MatriculasDeclaracoesTab
                v-else-if="activeTab === 'declaracao'"
                :declaracoes="declaracoes"
                :is-loading="isLoadingDeclaracoes"
                :editing-declaration-date-id="editingDeclarationDateId"
                :saving-declaration-date-id="savingDeclarationDateId"
                :declaration-date-drafts="declarationDateDrafts"
                @open-status-modal-for-declaration="
                    openStatusModalForDeclaration
                "
                @open-declaration-name-choice-modal="
                    openDeclarationNameChoiceModal
                "
                @open-declaration-date-editor="openDeclarationDateEditor"
                @cancel-declaration-date-edit="cancelDeclarationDateEdit"
                @save-declaration-matricula-date="saveDeclarationMatriculaDate"
                @restore-declaration-matricula-date="
                    restoreDeclarationMatriculaDate
                "
            />

            <!-- Justificativas View -->
            <MatriculasAtestadoTab
                v-else-if="activeTab === 'atestado'"
                :justificativas="justificativas"
                :is-loading="isLoadingJustificativas"
                :paginacao-justificativas="paginacaoJustificativas"
                :limit="limit"
                :editing-avaliacao-id="editingAvaliacaoId"
                :avaliacao-draft="avaliacaoDraft"
                :processing-id="processingId"
                :editing-date-id="editingJustificativaDateId"
                :saving-date-id="savingJustificativaDateId"
                :date-drafts="justificativaDateDrafts"
                @update-status="updateStatus"
                @save-avaliacao="saveAvaliacao"
                @update-escopo="updateEscopo"
                @open-attachment="openAttachment"
                @prev-page="prevPageJustificativas"
                @next-page="nextPageJustificativas"
                @update:editing-avaliacao-id="
                    (v: string | null) => (editingAvaliacaoId = v)
                "
                @update:avaliacao-draft="(v: string) => (avaliacaoDraft = v)"
                @open-date-editor="openJustificativaDateEditor"
                @cancel-date-edit="cancelJustificativaDateEdit"
                @save-dates="saveJustificativaDates"
            />

            <!-- Placeholder for other tabs (Declaracao only now) -->
            <div
                v-else
                class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
            >
                <div class="text-4xl mb-4 text-secondary/50">
                    <svg
                        v-if="activeTab === 'declaracao'"
                        class="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                    </svg>
                    <svg
                        v-else
                        class="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        ></path>
                    </svg>
                </div>
                <p class="text-white font-medium">
                    Visualização de {{ activeTab }}
                </p>
                <p class="text-xs text-secondary mt-1">
                    Funcionalidade em desenvolvimento.
                </p>
            </div>
        </div>

        <template #sidebar>
            <CandidateDashboard
                :candidatos="alunos"
                :totalCount="pagination.qtd_total"
                :statsData="dashboardStats"
                :availableAreas="areas"
                :currentAnoSemestre="anoSemestre"
                :showExcelExport="true"
                :showListaAlunos="true"
                :showRelatorioAtribuicao="activeTab === 'alunos'"
                relatorioAtribuicaoLabel="Relatório Bolsistas"
                relatorioAtribuicaoHint="Frequência e faltas por bolsista"
                @send-bulk-email="handleSendBulkEmail"
                :isExcelLoading="isExcelLoading"
                @export-excel="handleExcelExport"
                @open-lista-alunos="isModalListaAlunosOpen = true"
                @open-relatorio-atribuicao="handleOpenRelatorioBolsistas"
            />
        </template>

        <!-- Modals -->
        <ModalDadosCandidato
            :isOpen="showDataModal"
            :candidato="selectedCandidateForData"
            :area="selectedCandidateForData?.area_curso || ''"
            :tipoProcesso="'matricula'"
            :tipoCandidatura="'estudante'"
            :mode="modalMode"
            @close="showDataModal = false"
            @update-candidate="handleCandidateUpdate"
        />

        <ModalDiario
            :isOpen="showDiarioModal"
            :aluno="selectedCandidateForDiario"
            @close="showDiarioModal = false"
        />

        <ModalStatusMatricula
            :isOpen="showStatusModal"
            :aluno="selectedCandidateForStatus"
            @close="showStatusModal = false"
            @update-status="handleStatusUpdate"
        />

        <ModalEmail
            :isOpen="showEmailModal"
            :student="selectedCandidateForEmail"
            @close="showEmailModal = false"
            @send="handleSendEmail"
        />
        <ModalTrocaTurno
            :is-open="showTrocaTurnoModal"
            :aluno="selectedCandidateForTroca"
            @close="showTrocaTurnoModal = false"
            @changed="handleTrocaTurnoChanged"
        />

        <ModalUnificarConta
            :is-open="showUnificarContaModal"
            :student="selectedCandidateForUnificacao"
            @close="showUnificarContaModal = false"
            @unified="handleUnificacaoSuccess"
        />

        <ModalListaAlunos
            :is-open="isModalListaAlunosOpen"
            :ano-semestre="anoSemestre"
            :hash-base="hashBase"
            :filters="filters"
            @close="isModalListaAlunosOpen = false"
        />

        <ModalRelatorioAtribuicoes
            :is-open="isModalRelatorioBolsistasOpen"
            :ano-semestre="anoSemestre"
            @close="isModalRelatorioBolsistasOpen = false"
        />

        <ModalStatusDeclaracao
            :is-open="modalStatusOpen"
            :title="'Gerenciar Status'"
            :student-name="selectedDeclaration?.nome_aluno"
            :current-status="selectedDeclaration?.aprovado"
            @close="modalStatusOpen = false"
            @update="saveDeclarationStatus"
        />

        <ModalNomeImpressao
            :is-open="showDeclarationPrintNameModal"
            :loading="declarationPrintNameLoading"
            :options="declarationPrintNameOptions"
            :context-label="
                declarationNameAction === 'public'
                    ? 'na página pública da declaração'
                    : 'na declaração impressa'
            "
            @close="closeDeclarationPrintNameModal"
            @confirm="confirmDeclarationNameChoice"
        />

        <ConfirmationModal
            :is-open="showRematriculaConfirm"
            title="Confirmar Rematrícula"
            :message="`Você tem certeza que deseja rematricular o estudante <strong>${selectedCandidateForRematricula?.nome_completo || ''}</strong>?`"
            confirm-text="Rematricular"
            cancel-text="Cancelar"
            type="info"
            :loading="isRematriculaLoading"
            @close="showRematriculaConfirm = false"
            @confirm="handleConfirmRematricula"
        />
    </NuxtLayout>
</template>
