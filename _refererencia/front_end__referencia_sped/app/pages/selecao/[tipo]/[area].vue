<script setup lang="ts">
import { getAnoSemestre } from "../../../../utils/ano_semestre";
import { useToast } from "../../../../composables/useToast";
import ModalDadosCandidato from "../../../components/modais_globais/ModalDadosCandidato.vue";
import BaseSelect from "../../../components/BaseSelect.vue";
import ModalMatricularLote from "../../../components/selecao/ModalMatricularLote.vue";
import { fromZonedTime } from "date-fns-tz";
import ModalRelatorioSemanal from "../../../components/selecao/ModalRelatorioSemanal.vue";
import SelecaoConfirmModal from "../../../components/selecao/ConfirmModal.vue";
import SelecaoExceptionalModal from "../../../components/selecao/ExceptionalModal.vue";
import SelecaoFiltrosCard from "../../../components/selecao/FiltrosCard.vue";
import SelecaoWeeklyReportLoading from "../../../components/selecao/WeeklyReportLoading.vue";
import ModalAvaliarCandidato from "../../../components/selecao/ModalAvaliarCandidato.vue";
import { $fetch as ofetch } from "ofetch";
import { useSelecaoTurmas } from "../../../composables/selecao/useSelecaoTurmas";
import { useSelecaoCandidatos } from "../../../composables/selecao/useSelecaoCandidatos";
import { useSelecaoAcoes } from "../../../composables/selecao/useSelecaoAcoes";
import { useSelecaoRelatorios } from "../../../composables/selecao/useSelecaoRelatorios";
import CandidateDashboard from "~/components/carometro/CandidateDashboard.vue";

const appStore = useAppStore(); // Para renovar hash quando necessário
const {
    matricularCandidato,
    deletarInscricao,
    matricularLote,
    autorizarExcepcional,
} = useSelecaoAcoes();

const {
    fetchRelatorioSemanal,
    gerarRelatorioPdf,
    exportarExcel: _exportarExcel,
    buildWeeklyReportHtml,
    printHtmlReport,
} = useSelecaoRelatorios();

const { showToast } = useToast();

// --- COMPOSABLES ---
const {
    turmas,
    isLoading: isLoadingTurmas,
    fetchTurmas: _fetchTurmas,
} = useSelecaoTurmas();

const {
    candidatos,
    pagination,
    dashboardStats,
    isLoading: isLoadingCandidatos,
    fetchCandidatos: _fetchCandidatos,
} = useSelecaoCandidatos();

// --- STATE ---
const limit = 20;

const route = useRoute();
const router = useRouter();

const isLoading = computed(
    () => isLoadingTurmas.value || isLoadingCandidatos.value,
);
const isExcelLoading = ref(false);
const isExcelAllLoading = ref(false);
const isWeeklyReportLoading = ref(false);
const isWeeklyReportModalLoading = ref(false);
const showWeeklyReportModal = ref(false);
const weeklyReportData = ref<any | null>(null);

const areaAtual = computed(() => route.params.area as string);
const tipoCandidatura = computed(() => {
    const tipo = route.params.tipo as string;
    return tipo === "docente" || tipo === "estudante" ? tipo : "estudante";
});

const areaLabels: Record<string, string> = {
    extensao: "Extens\u00e3o",
    regulares: "Regulares",
    cursos_livres: "Cursos Livres",
};
const areas = ["extensao", "regulares", "cursos_livres"];
const areaLabel = computed(
    () => areaLabels[areaAtual.value] || areaAtual.value,
);

// Filters State
const anoSemestre = ref(getAnoSemestre()); // Default format '25Is'
const selectedTurmaId = ref<string | null>(null);

const semestreOptions = computed(() => [
    {
        label: getAnoSemestre(undefined, -1),
        value: getAnoSemestre(undefined, -1),
    },
    { label: `${getAnoSemestre()} (Atual)`, value: getAnoSemestre() },
    {
        label: getAnoSemestre(undefined, 1),
        value: getAnoSemestre(undefined, 1),
    },
]);

// Advanced Filters
const filters = ref({
    pcd: null as string | null,
    laudo: null as boolean | null,
    deferimento: null as string | null,
    data_inscricao_inicio: "",
    data_inscricao_fim: "",
});

const ID_DEFERIMENTO_REGULARES = "518e1943-1a84-4017-b283-67b3914e46e2";
const ID_DEFERIMENTO_LIVRES = "cdf7ad73-69bd-4823-978b-ea5367cd1d0b";

const pcdOptions = [
    { label: "Todos", value: null },
    { label: "Sim", value: "sim" },
    { label: "Não", value: "nao" },
];

const laudoOptions = [
    // Use null for 'Todos' but handle value correctly
    { label: "Todos", value: null },
    { label: "Com Laudo", value: true },
    { label: "Sem Laudo", value: false },
];

const deferimentoOptions = [
    { label: "Todos", value: null },
    { label: "Inscrição Deferida", value: "Inscrição Deferida" },
    { label: "Inscrição Indeferida", value: "Inscrição Indeferida" },
    { label: "Aguardando", value: "Aguardando" },
];

// Search & Sort State (iniciam vazios/null)
const searchQuery = ref("");
const sortBy = ref<"nome_completo" | "created_at">("nome_completo");
const sortDirection = ref<"ASC" | "DESC">("ASC");

// --- QUERY SYNC ---
// Initialize state from URL query params on first load
const q = route.query;
if (q.ano_semestre) anoSemestre.value = q.ano_semestre as string;
if (q.busca) searchQuery.value = q.busca as string;
if (q.ordenar_por)
    sortBy.value = q.ordenar_por as "nome_completo" | "created_at";
if (q.ordenar_como) sortDirection.value = q.ordenar_como as "ASC" | "DESC";
if (q.pcd !== undefined) filters.value.pcd = (q.pcd as string) || null;
if (q.laudo !== undefined)
    filters.value.laudo =
        q.laudo === "true" ? true : q.laudo === "false" ? false : null;
if (q.deferimento) filters.value.deferimento = q.deferimento as string;
if (q.data_ini) filters.value.data_inscricao_inicio = q.data_ini as string;
if (q.data_fim) filters.value.data_inscricao_fim = q.data_fim as string;

// Sync state → URL query (debounced)
let syncTimer: ReturnType<typeof setTimeout>;
const syncQuery = () => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        const query: Record<string, string> = {};
        if (anoSemestre.value) query.ano_semestre = anoSemestre.value;
        if (searchQuery.value) query.busca = searchQuery.value;
        if (sortBy.value !== "nome_completo") query.ordenar_por = sortBy.value;
        if (sortDirection.value !== "ASC")
            query.ordenar_como = sortDirection.value;
        if (filters.value.pcd) query.pcd = filters.value.pcd;
        if (filters.value.laudo !== null)
            query.laudo = String(filters.value.laudo);
        if (filters.value.deferimento)
            query.deferimento = filters.value.deferimento;
        if (filters.value.data_inscricao_inicio)
            query.data_ini = filters.value.data_inscricao_inicio;
        if (filters.value.data_inscricao_fim)
            query.data_fim = filters.value.data_inscricao_fim;
        router.replace({ query });
    }, 400);
};
watch([anoSemestre, searchQuery, sortBy, sortDirection, filters], syncQuery, {
    deep: true,
});

// Modal State
const showDataModal = ref(false);
const selectedCandidateForData = ref<any>(null);
const modalMode = ref<"dados" | "documentos" | "avaliar">("dados");

// Confirmation Modal State
const confirmModal = ref({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "info" | "danger",
    action: null as (() => Promise<void>) | null,
    isLoading: false,
});

// Batch Enrollment Modal State
const showBatchEnrollModal = ref(false);

// Exceptional Enrollment Modal State
const showExceptionalModal = ref(false);
const selectedCandidateForExceptional = ref<any>(null);

const toSaoPauloStartOfDayISO = (dateTimeLocal: string) => {
    const dateOnly = dateTimeLocal?.split("T")[0];
    if (!dateOnly) return null;

    const zonedDate = fromZonedTime(
        `${dateOnly} 00:00:00`,
        "America/Sao_Paulo",
    );
    return zonedDate.toISOString();
};

const toSaoPauloEndOfDayISO = (dateTimeLocal: string) => {
    const dateOnly = dateTimeLocal?.split("T")[0];
    if (!dateOnly) return null;

    const zonedDate = fromZonedTime(
        `${dateOnly} 23:59:00`,
        "America/Sao_Paulo",
    );
    return zonedDate.toISOString();
};

const handleEnrollTrigger = (candidato: any) => {
    const turma = turmas.value.find(
        (t: any) => t.id_turma === selectedTurmaId.value,
    );
    const cursoNome = turma ? turma.nome_curso_turno : "Curso Selecionado";

    confirmModal.value = {
        isOpen: true,
        title: "Confirmar Matrícula",
        message: `Você tem certeza que deseja Matricular o estudante <strong>${candidato.nome_completo}</strong> no curso <strong>${cursoNome}</strong>?`,
        type: "info",
        isLoading: false,
        action: async () => {
            await matricularCandidato(
                selectedTurmaId.value!,
                candidato.id_user_expandido,
            );

            showToast("Aluno matriculado com sucesso!", { type: "info" });
            candidato.status_processo = "Matriculado";
        },
    };
};

const handleDeleteTrigger = (candidato: any) => {
    confirmModal.value = {
        isOpen: true,
        title: "Excluir Processo",
        message: `Você tem certeza que deseja Deletar o processo de <strong>${candidato.nome_completo}</strong>?<br/><br/><span class="text-red-400 font-bold">Essa ação não poderá ser desfeita.</span>`,
        type: "danger",
        isLoading: false,
        action: async () => {
            await deletarInscricao(candidato.id_processo);

            showToast("Processo removido com sucesso!", { type: "info" });
            candidatos.value = candidatos.value.filter(
                (c: any) => c.id_processo !== candidato.id_processo,
            );
        },
    };
};

const confirmAction = async () => {
    if (!confirmModal.value.action) return;

    confirmModal.value.isLoading = true;
    try {
        await confirmModal.value.action();
        confirmModal.value.isOpen = false;
    } catch (e: any) {
        console.error("Error in confirm action:", e);
        showToast(e.message || "Erro ao processar ação.", { type: "error" });
    } finally {
        confirmModal.value.isLoading = false;
    }
};

const openBatchEnrollModal = () => {
    // Check if there's any approved candidate
    const hasApproved = candidatos.value.some(
        (c) => c.status_processo === "Aprovado",
    );

    if (!hasApproved) {
        showToast(
            'Não há estudantes com o status "Aprovado" listados nesta tela.',
            { type: "error" },
        );
        return;
    }

    showBatchEnrollModal.value = true;
};

const handleBatchEnrollConfirm = async (idsProcessosAprovados: string[]) => {
    try {
        const response: any = await matricularLote(
            selectedTurmaId.value!,
            idsProcessosAprovados,
        );

        if (response.success) {
            showToast("Alunos matriculados com sucesso!", { type: "success" });

            // Update frontend state
            idsProcessosAprovados.forEach((id) => {
                const index = candidatos.value.findIndex(
                    (c) => c.id_processo === id,
                );
                if (index !== -1) {
                    candidatos.value[index].status_processo = "Matriculado";
                }
            });

            showBatchEnrollModal.value = false;
        }
    } catch (e: any) {
        console.error("Erro ao matricular em lote:", e);
        showToast(
            e.data?.statusMessage || e.message || "Erro ao efetuar matrículas.",
            { type: "error" },
        );
    }
};

const handleExceptionalTrigger = (candidato: any) => {
    selectedCandidateForExceptional.value = candidato;
    showExceptionalModal.value = true;
};

const handleExceptionalConfirm = async (dtIni: string, dtFim: string) => {
    if (!selectedCandidateForExceptional.value) return;

    const dtIniMatSup = toSaoPauloStartOfDayISO(dtIni);
    const dtFimMatSup = toSaoPauloEndOfDayISO(dtFim);

    if (!dtIniMatSup || !dtFimMatSup) {
        showToast("Informe as duas datas para matrícula excepcional.", {
            type: "error",
        });
        return;
    }

    try {
        const response: any = await autorizarExcepcional(
            selectedCandidateForExceptional.value.id_processo,
            dtIniMatSup,
            dtFimMatSup,
        );

        if (response.success) {
            showToast("Matrícula excepcional autorizada com sucesso!", {
                type: "success",
            });
            showExceptionalModal.value = false;

            // Refresh candidates to reflect changes
            fetchCandidatos(1);
        } else {
            throw new Error(
                response.message || "Erro ao autorizar matrícula excepcional",
            );
        }
    } catch (e: any) {
        console.error("Erro ao autorizar matrícula excepcional:", e);
        showToast(e.message || "Erro ao autorizar matrícula excepcional.", {
            type: "error",
        });
    }
};

// --- ACTIONS ---

// Wrapper: inject anoSemestre + area
const fetchTurmas = () => _fetchTurmas(areaAtual.value, anoSemestre.value);

// Auto-select first turma when data loads
watch(turmas, (all) => {
    if (all.length > 0) {
        if (
            !selectedTurmaId.value ||
            !all.find((t: any) => t.id_turma === selectedTurmaId.value)
        ) {
            selectedTurmaId.value = all[0].id_turma;
        }
    } else {
        selectedTurmaId.value = null;
    }
});

// Wrapper: build params from page state
const fetchCandidatos = (page = 1) => {
    const extraFilters: Array<{ id_pergunta: string; resposta: string }> = [];
    if (filters.value.deferimento) {
        let deferimentoQuestionId: string | null = null;
        const areaKey = areaAtual.value;

        if (areaKey === "regulares")
            deferimentoQuestionId = ID_DEFERIMENTO_REGULARES;
        if (areaKey === "cursos_livres")
            deferimentoQuestionId = ID_DEFERIMENTO_LIVRES;

        if (deferimentoQuestionId) {
            extraFilters.push({
                id_pergunta: deferimentoQuestionId,
                resposta: filters.value.deferimento,
            });
        }
    }

    _fetchCandidatos({
        idTurma: selectedTurmaId.value,
        tipoCandidatura: tipoCandidatura.value,
        busca: searchQuery.value.trim() || null,
        extraFilters,
        pcd: filters.value.pcd || null,
        laudo: filters.value.laudo,
        dataInscricaoInicio: filters.value.data_inscricao_inicio
            ? toSaoPauloStartOfDayISO(filters.value.data_inscricao_inicio)
            : null,
        dataInscricaoFim: filters.value.data_inscricao_fim
            ? toSaoPauloEndOfDayISO(filters.value.data_inscricao_fim)
            : null,
        page,
        limit,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
    });
};

// --- WATCHERS ---

// Renova hash quando área ou semestre mudam
watch([areaAtual, anoSemestre], async () => {
    selectedTurmaId.value = null;
    await appStore.refreshHash();
    fetchTurmas();
});

// Renova hash quando turma muda
watch(selectedTurmaId, async () => {
    if (selectedTurmaId.value) {
        await appStore.refreshHash();
        fetchCandidatos(1);
    } else {
        candidatos.value = [];
    }
});

// Renova hash quando busca muda (onBlur)
watch(searchQuery, async () => {
    if (selectedTurmaId.value) {
        await appStore.refreshHash();
        fetchCandidatos(1);
    }
});

// Renova hash quando ordenação muda
watch([sortBy, sortDirection], async () => {
    if (selectedTurmaId.value) {
        await appStore.refreshHash();
        fetchCandidatos(1);
    }
});

// Watch filters
watch(
    filters,
    async () => {
        if (selectedTurmaId.value) {
            await appStore.refreshHash();
            fetchCandidatos(1);
        }
    },
    { deep: true },
);

const clearFilters = () => {
    filters.value = {
        pcd: null,
        laudo: null,
        deferimento: null,
        data_inscricao_inicio: "",
        data_inscricao_fim: "",
    };
};

// --- LIFECYCLE ---
onMounted(() => {
    fetchTurmas();
});

// --- HANDLERS ---
const handleCandidateUpdate = (payload: {
    id_processo: string;
    nota_total_processo?: number;
    deferimento?: string;
    status?: string;
}) => {
    const index = candidatos.value.findIndex(
        (c) => c.id_processo === payload.id_processo,
    );
    if (index !== -1) {
        if (payload.nota_total_processo !== undefined)
            candidatos.value[index].nota_total_processo =
                payload.nota_total_processo;
        if (payload.deferimento !== undefined)
            candidatos.value[index].deferimento = payload.deferimento;
        if (payload.status !== undefined)
            candidatos.value[index].status_processo = payload.status;

        if (
            selectedCandidateForData.value &&
            selectedCandidateForData.value.id_processo === payload.id_processo
        ) {
            if (payload.nota_total_processo !== undefined)
                selectedCandidateForData.value.nota_total_processo =
                    payload.nota_total_processo;
            if (payload.deferimento !== undefined)
                selectedCandidateForData.value.deferimento =
                    payload.deferimento;
            if (payload.status !== undefined)
                selectedCandidateForData.value.status_processo = payload.status;
        }
    }
};

const handleAction = async (action: string, candidato: any) => {
    // Renova hash antes de executar ação (garante fotos/dados válidos)
    await appStore.refreshHash();

    console.log("Action:", action, candidato);

    if (action === "dados") {
        selectedCandidateForData.value = candidato;
        modalMode.value = "dados";
        showDataModal.value = true;
        return;
    }

    if (action === "documentos") {
        selectedCandidateForData.value = candidato;
        modalMode.value = "documentos";
        showDataModal.value = true;
        return;
    }

    if (action === "avaliar") {
        selectedCandidateForData.value = candidato;
        modalMode.value = "avaliar";
        showDataModal.value = true;
        return;
    }

    if (action === "matricular") {
        handleEnrollTrigger(candidato);
        return;
    }

    if (action === "deletar") {
        handleDeleteTrigger(candidato);
        return;
    }

    if (action === "autorizar-excepcional") {
        handleExceptionalTrigger(candidato);
        return;
    }
};

// --- REPORT WRAPPERS ---
const buildReportParams = () => ({
    ano_semestre: anoSemestre.value,
    area: areaAtual.value,
    tipo_candidatura: tipoCandidatura.value,
});

const handleExcelExport = async () => {
    if (!import.meta.client) return;
    isExcelLoading.value = true;
    try {
        await _exportarExcel({
            ...buildReportParams(),
            id_turma: selectedTurmaId.value || null,
            areaLabel: areaLabel.value,
        });
    } catch (e: any) {
        console.error(e);
        showToast(e.message || "Erro ao exportar dados.", { type: "error" });
    } finally {
        isExcelLoading.value = false;
    }
};

const handleExcelExportAllCourses = async () => {
    if (!import.meta.client) return;
    isExcelAllLoading.value = true;
    try {
        await _exportarExcel({
            ...buildReportParams(),
            id_turma: null,
            areaLabel: areaLabel.value,
            consolidado: true,
        });
    } catch (e: any) {
        console.error(e);
        showToast(e.message || "Erro ao exportar dados consolidados.", {
            type: "error",
        });
    } finally {
        isExcelAllLoading.value = false;
    }
};

const handleWeeklyReportPdf = async () => {
    isWeeklyReportLoading.value = true;
    try {
        weeklyReportData.value = await gerarRelatorioPdf({
            ...buildReportParams(),
            id_turma: null,
        });
    } catch (e: any) {
        showToast(e.message || "Erro ao gerar relatório semanal.", {
            type: "error",
        });
    } finally {
        isWeeklyReportLoading.value = false;
    }
};

const handleOpenWeeklyReportModal = async () => {
    showWeeklyReportModal.value = true;
    isWeeklyReportModalLoading.value = true;
    try {
        weeklyReportData.value = await fetchRelatorioSemanal({
            ...buildReportParams(),
            id_turma: null,
        });
        if (!(weeklyReportData.value?.weeks || []).length) {
            showToast("Nenhuma inscrição encontrada para este recorte.", {
                type: "info",
            });
        }
    } catch (e: any) {
        showToast(e.message || "Erro ao carregar painel semanal.", {
            type: "error",
        });
    } finally {
        isWeeklyReportModalLoading.value = false;
    }
};

const handlePrintWeeklyReportFromModal = () => {
    const report = weeklyReportData.value;
    if (!(report?.weeks || []).length) {
        showToast("Nenhuma inscrição encontrada para gerar o PDF.", {
            type: "info",
        });
        return;
    }
    printHtmlReport(buildWeeklyReportHtml(report));
    showToast("Relatório semanal aberto para impressão em PDF.", {
        type: "success",
    });
};

const previousPage = async () => {
    if (pagination.value.pagina_atual > 1) {
        await appStore.refreshHash(); // Renova hash ao mudar página
        fetchCandidatos(pagination.value.pagina_atual - 1);
    }
};

const nextPage = async () => {
    if (pagination.value.pagina_atual < pagination.value.qtd_paginas) {
        await appStore.refreshHash(); // Renova hash ao mudar página
        fetchCandidatos(pagination.value.pagina_atual + 1);
    }
};
</script>

<template>
    <NuxtLayout name="base">
        <!-- Main Container with bg-div-15 -->
        <div class="bg-div-15 rounded-xl p-6 md:p-8">
            <!-- TABS (Area Selection) - Outside controls island -->
            <div
                class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-secondary/10 mb-6 pb-2"
            >
                <div
                    class="flex items-center gap-6 overflow-x-auto hide-scrollbar"
                >
                    <button
                        v-for="area in areas"
                        :key="area"
                        @click="
                            router.push({
                                params: { ...route.params, area },
                                query: route.query,
                            })
                        "
                        class="text-sm font-bold pb-2 md:pb-3 relative transition-colors text-secondary hover:text-primary whitespace-nowrap"
                        :class="{ 'text-primary': areaAtual === area }"
                    >
                        {{ areaLabels[area] }}
                        <span
                            v-if="areaAtual === area"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        ></span>
                    </button>
                </div>

                <!-- Botão Matricular Aprovados da página atual -->
                <button
                    v-if="candidatos.length > 0"
                    @click="openBatchEnrollModal"
                    class="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-md transition-all shadow-sm shadow-primary/20 mb-1.5"
                >
                    <svg
                        class="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        ></path>
                    </svg>
                    <span>Matricular Aprovados</span>
                </button>
            </div>

            <!-- CONTROLS ISLAND -->
            <SelecaoFiltrosCard
                v-model:ano-semestre="anoSemestre"
                v-model:turma-id="selectedTurmaId"
                v-model:busca="searchQuery"
                v-model:ordenar-por="sortBy"
                v-model:ordenar-direcao="sortDirection"
                v-model:filtros="filters"
                :turmas="turmas"
                :semestre-options="semestreOptions"
                :pcd-options="pcdOptions"
                :laudo-options="laudoOptions"
                :deferimento-options="deferimentoOptions"
                :deferimento-desabilitado="areaAtual === 'extensao'"
                @clear-filters="clearFilters"
            />

            <!-- CONTENT AREA -->

            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                ></div>
            </div>

            <!-- Empty State -->
            <div
                v-else-if="candidatos.length === 0"
                class="flex flex-col items-center justify-center py-16 md:py-20 text-center opacity-50"
            >
                <div class="text-5xl md:text-6xl mb-4">📂</div>
                <p class="text-lg md:text-xl font-medium text-white">
                    Nenhum candidato encontrado
                </p>
                <p class="text-secondary-400 text-xs md:text-sm mt-1">
                    Selecione outra turma ou área para visualizar inscrições.
                </p>
            </div>

            <!-- List -->
            <div v-else class="space-y-3 md:space-y-4">
                <CandidateCard
                    v-for="candidato in candidatos"
                    :key="candidato.id_processo"
                    :candidato="candidato"
                    @action="handleAction"
                />
            </div>

            <!-- PAGINATION -->
            <div
                v-if="candidatos.length > 0"
                class="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 md:mt-8 pt-4 border-t border-white/5"
            >
                <span
                    class="text-xs md:text-sm text-secondary-500 order-2 md:order-1"
                >
                    <span class="font-medium text-white">{{
                        (pagination.pagina_atual - 1) * limit + 1
                    }}</span>
                    a
                    <span class="font-medium text-white">{{
                        Math.min(
                            pagination.pagina_atual * limit,
                            pagination.qtd_total,
                        )
                    }}</span>
                    de
                    <span class="font-medium text-white">{{
                        pagination.qtd_total
                    }}</span>
                </span>
                <div class="flex gap-2 order-1 md:order-2">
                    <button
                        @click="previousPage"
                        :disabled="pagination.pagina_atual === 1"
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <button
                        @click="nextPage"
                        :disabled="
                            pagination.pagina_atual >= pagination.qtd_paginas
                        "
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>

        <!-- Dashboard in Sidebar Slot -->
        <template #sidebar>
            <CandidateDashboard
                :candidatos="candidatos"
                :totalCount="pagination.qtd_total"
                :statsData="dashboardStats"
                :isExcelLoading="isExcelLoading"
                :isExcelAllLoading="isExcelAllLoading"
                :isWeeklyReportLoading="isWeeklyReportLoading"
                :isWeeklyReportModalLoading="isWeeklyReportModalLoading"
                @export-excel="handleExcelExport"
                @export-excel-all-courses="handleExcelExportAllCourses"
                @export-weekly-report-pdf="handleWeeklyReportPdf"
                @open-weekly-report-modal="handleOpenWeeklyReportModal"
            />
        </template>

        <!-- Modals -->
        <ModalDadosCandidato
            v-if="modalMode !== 'avaliar'"
            :isOpen="showDataModal"
            :candidato="selectedCandidateForData"
            :area="areaAtual"
            :tipoProcesso="'seletivo'"
            :tipoCandidatura="tipoCandidatura"
            :mode="modalMode as 'dados' | 'documentos'"
            @close="showDataModal = false"
            @update-candidate="handleCandidateUpdate"
        />
        <ModalAvaliarCandidato
            v-if="modalMode === 'avaliar'"
            :isOpen="showDataModal"
            :candidato="selectedCandidateForData"
            :area="areaAtual"
            :tipoCandidatura="tipoCandidatura"
            @close="showDataModal = false"
            @update-candidate="handleCandidateUpdate"
        />

        <!-- Modal Matricular Lote -->
        <ModalMatricularLote
            :is-open="showBatchEnrollModal"
            :candidatos="candidatos"
            :turma-nome="
                turmas.find((t) => t.id_turma === selectedTurmaId)
                    ?.nome_curso_turno || 'Turma Selecionada'
            "
            @close="showBatchEnrollModal = false"
            @confirm="handleBatchEnrollConfirm"
        />

        <ModalRelatorioSemanal
            :isOpen="showWeeklyReportModal"
            :loading="isWeeklyReportModalLoading"
            :report="weeklyReportData"
            :areaLabel="areaLabel"
            :anoSemestre="anoSemestre"
            :tipoCandidatura="tipoCandidatura"
            @close="showWeeklyReportModal = false"
            @print="handlePrintWeeklyReportFromModal"
        />

        <!-- CONFIRMATION MODAL -->
        <SelecaoConfirmModal
            :is-open="confirmModal.isOpen"
            :title="confirmModal.title"
            :message="confirmModal.message"
            :type="confirmModal.type"
            :is-loading="confirmModal.isLoading"
            @confirm="confirmAction"
            @cancel="confirmModal.isOpen = false"
        />
    </NuxtLayout>

    <!-- Exceptional Enrollment Modal -->
    <SelecaoExceptionalModal
        :is-open="showExceptionalModal"
        :candidato-nome="selectedCandidateForExceptional?.nome_completo || ''"
        @confirm="handleExceptionalConfirm"
        @cancel="showExceptionalModal = false"
    />

    <SelecaoWeeklyReportLoading :is-open="isWeeklyReportLoading" />
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
