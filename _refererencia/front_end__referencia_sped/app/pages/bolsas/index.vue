<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER & CONTROLS -->
            <div
                class="flex flex-col md:flex-row items-center justify-between gap-6 mb-8"
            >
                <!-- TABS -->
                <PainelTabs
                    :tabs="tabs"
                    :active-tab="activeTab"
                    @select="activeTab = $event"
                />

                <!-- CONTROLS -->
                <div
                    class="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto"
                >
                    <!-- Period Select -->
                    <div class="relative w-full md:w-40">
                        <select
                            v-model="anoSemestre"
                            @change="_fetchEditais"
                            class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
                        >
                            <option :value="getAnoSemestre(undefined, -1)">
                                {{ getAnoSemestre(undefined, -1) }}
                            </option>
                            <option :value="getAnoSemestre()">
                                {{ getAnoSemestre() }} (Atual)
                            </option>
                            <option :value="getAnoSemestre(undefined, 1)">
                                {{ getAnoSemestre(undefined, 1) }}
                            </option>
                        </select>
                    </div>

                    <!-- New Buttons by Tab -->
                    <button
                        v-if="
                            activeTab === 'Editais' || activeTab === 'Reuniões'
                        "
                        @click="
                            activeTab === 'Editais'
                                ? handleNewEdital()
                                : handleNewReuniao()
                        "
                        type="button"
                        class="!w-full !md:w-auto !pointer-events-auto !cursor-pointer !select-none !bg-primary !hover:bg-primary-hover !active:scale-95 !text-white !text-xs !md:text-sm !font-bold !py-2.5 !px-4 !rounded-lg !flex !items-center !justify-center !md:justify-start !gap-2 !transition-all !shadow-lg !shadow-primary/20"
                    >
                        <svg
                            class="w-4 h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        {{
                            activeTab === "Editais"
                                ? "Novo Edital"
                                : "Nova Reunião"
                        }}
                    </button>
                </div>
            </div>

            <!-- CONTENT: EDITAIS -->
            <div v-if="activeTab === 'Editais'" class="space-y-6">
                <div v-if="isLoading" class="flex justify-center py-20">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <div v-else-if="editais.length > 0" class="flex flex-col gap-4">
                    <EditalCard
                        v-for="edital in editais"
                        :key="edital.id"
                        :edital="edital"
                        @edit="handleEditEdital"
                        @add-etapa="handleAddEtapa"
                        @edit-etapa="
                            (etapa, editalId) =>
                                handleEditEtapa(etapa, editalId)
                        "
                        @view-inscriptions="handleViewInscriptions"
                    />
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center py-20 opacity-50 border-2 border-dashed border-white/5 rounded-xl"
                >
                    <div
                        class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-8 h-8 text-secondary"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-white font-bold">
                        Nenhum edital encontrado.
                    </p>
                    <p class="text-xs text-secondary mt-1">
                        Crie um novo edital para começar.
                    </p>
                </div>
            </div>

            <!-- CONTENT: INSCRIÇÕES -->
            <div v-else-if="activeTab === 'Inscrições'" class="space-y-6">
                <!-- Filters -->
                <div class="flex gap-4">
                    <div class="relative w-full md:w-64">
                        <input
                            v-model="searchBusca"
                            @input="debouncedSearch"
                            type="text"
                            placeholder="Buscar aluno (Nome, RA, Email)..."
                            class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pl-3 outline-none"
                        />
                    </div>
                </div>

                <!-- Loading -->
                <div
                    v-if="isLoadingInscricoes"
                    class="flex justify-center py-20"
                >
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <!-- Empty State -->
                <div
                    v-else-if="inscricoes.length === 0"
                    class="flex flex-col items-center justify-center py-20 opacity-50 border-2 border-dashed border-white/5 rounded-xl"
                >
                    <p class="text-white font-bold">
                        Nenhuma inscrição encontrada.
                    </p>
                </div>

                <!-- List -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InscricaoCard
                        v-for="inscricao in inscricoes"
                        :key="inscricao.id"
                        :inscricao="inscricao"
                        :hash-base="store.hash_base || ''"
                        @details="openDetails"
                    />
                </div>

                <!-- Pagination -->
                <div
                    v-if="totalPages > 1"
                    class="flex justify-center gap-2 mt-4"
                >
                    <button
                        @click="changePage(page - 1)"
                        :disabled="page <= 1"
                        class="px-3 py-1 rounded bg-white/5 text-secondary disabled:opacity-30 hover:bg-white/10 text-xs font-bold"
                    >
                        Anterior
                    </button>
                    <span class="px-3 py-1 text-xs text-secondary"
                        >{{ page }} / {{ totalPages }}</span
                    >
                    <button
                        @click="changePage(page + 1)"
                        :disabled="page >= totalPages"
                        class="px-3 py-1 rounded bg-white/5 text-secondary disabled:opacity-30 hover:bg-white/10 text-xs font-bold"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            <!-- CONTENT: ATRIBUIÇÃO -->
            <div v-else-if="activeTab === 'Atribuição'" class="space-y-6">
                <AtribuicaoFiltros
                    :busca="filtersAtribuicao.busca"
                    :id-turma="filtersAtribuicao.id_turma"
                    :status="filtersAtribuicao.status"
                    :turmas="turmasAtribuicao"
                    :status-options="atribuicaoStatusOptions"
                    @update:busca="filtersAtribuicao.busca = $event"
                    @update:id-turma="filtersAtribuicao.id_turma = $event"
                    @update:status="filtersAtribuicao.status = $event"
                    @search="debouncedSearchAtribuicao"
                    @filter-change="handleAtribuicaoFilterChange"
                />

                <div
                    v-if="isLoadingAtribuicoes"
                    class="flex justify-center py-20"
                >
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <div
                    v-else-if="atribuicoes.length > 0"
                    class="grid grid-cols-1 gap-4"
                >
                    <AtribuicaoAlunoCard
                        v-for="item in atribuicoes"
                        :key="item.id_matricula"
                        :aluno="item"
                        @atribuir="handleAtribuirAluno"
                        @suplente="handleSuplenteAluno"
                        @promover="handlePromoverBolsa"
                        @encerrar="handleEncerrarBolsa"
                        @reativar="handleReativarBolsa"
                        @dados="handleVerDadosAtribuicao"
                    />
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center py-20 opacity-50 border-2 border-dashed border-white/5 rounded-xl"
                >
                    <p class="text-white font-bold">Nenhum aluno encontrado.</p>
                    <p class="text-xs text-secondary mt-1">
                        Ajuste os filtros para localizar a turma desejada.
                    </p>
                </div>

                <div
                    v-if="paginationAtribuicoes.qtd_paginas > 1"
                    class="flex justify-center gap-2 mt-4"
                >
                    <button
                        @click="
                            changeAtribuicaoPage(
                                paginationAtribuicoes.pagina_atual - 1,
                            )
                        "
                        :disabled="paginationAtribuicoes.pagina_atual <= 1"
                        class="px-3 py-1 rounded bg-white/5 text-secondary disabled:opacity-30 hover:bg-white/10 text-xs font-bold"
                    >
                        Anterior
                    </button>
                    <span class="px-3 py-1 text-xs text-secondary"
                        >{{ paginationAtribuicoes.pagina_atual }} /
                        {{ paginationAtribuicoes.qtd_paginas }}</span
                    >
                    <button
                        @click="
                            changeAtribuicaoPage(
                                paginationAtribuicoes.pagina_atual + 1,
                            )
                        "
                        :disabled="
                            paginationAtribuicoes.pagina_atual >=
                            paginationAtribuicoes.qtd_paginas
                        "
                        class="px-3 py-1 rounded bg-white/5 text-secondary disabled:opacity-30 hover:bg-white/10 text-xs font-bold"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            <!-- CONTENT: REUNIÕES -->
            <div v-else-if="activeTab === 'Reuniões'" class="space-y-6">
                <div v-if="isLoadingReunioes" class="flex justify-center py-20">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <div v-else-if="reunioes.length > 0" class="space-y-4">
                    <ReuniaoCard
                        v-for="reuniao in reunioes"
                        :key="reuniao.id"
                        :reuniao="reuniao"
                        @presenca-change="handlePresencaChange"
                    />
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center py-20 opacity-50 border-2 border-dashed border-white/5 rounded-xl"
                >
                    <p class="text-white font-bold">
                        Nenhuma reunião cadastrada.
                    </p>
                    <p class="text-xs text-secondary mt-1">
                        As reuniões aparecerão aqui.
                    </p>
                </div>

                <!-- Paginação -->
                <div
                    v-if="paginationReunioes.qtd_paginas > 1"
                    class="flex justify-center gap-2 mt-4"
                >
                    <button
                        @click="
                            changeReuniaoPage(
                                paginationReunioes.pagina_atual - 1,
                            )
                        "
                        :disabled="paginationReunioes.pagina_atual <= 1"
                        class="px-3 py-1 rounded bg-white/5 text-secondary disabled:opacity-30 hover:bg-white/10 text-xs font-bold"
                    >
                        Anterior
                    </button>
                    <span class="px-3 py-1 text-xs text-secondary"
                        >{{ paginationReunioes.pagina_atual }} /
                        {{ paginationReunioes.qtd_paginas }}</span
                    >
                    <button
                        @click="
                            changeReuniaoPage(
                                paginationReunioes.pagina_atual + 1,
                            )
                        "
                        :disabled="
                            paginationReunioes.pagina_atual >=
                            paginationReunioes.qtd_paginas
                        "
                        class="px-3 py-1 rounded bg-white/5 text-secondary disabled:opacity-30 hover:bg-white/10 text-xs font-bold"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>

        <template #sidebar>
            <CandidateDashboard
                :candidatos="inscricoes"
                :totalCount="dashboardStats?.total || 0"
                :statsData="dashboardStats"
                :currentAnoSemestre="anoSemestre"
                :isExcelLoading="isExcelLoading"
                :showExcelExport="activeTab === 'Inscrições'"
                :showRelatorioAtribuicao="activeTab === 'Atribuição'"
                @export-excel="handleExcelExport"
                @open-relatorio-atribuicao="handleRelatorioAtribuicao"
            />
        </template>

        <!-- MODALS -->
        <ModalEdital
            :is-open="isEditalModalOpen"
            :edital="editingEdital"
            @close="isEditalModalOpen = false"
            @saved="handleEditalSaved"
        />

        <ModalEtapa
            :is-open="isEtapaModalOpen"
            :etapa="editingEtapa"
            :edital-id="selectedEditalIdForEtapa || ''"
            @close="isEtapaModalOpen = false"
            @saved="handleEtapaSaved"
        />

        <ModalDetalhesInscricao
            :is-open="isDetalhesModalOpen"
            :inscricao="selectedInscricao"
            @close="isDetalhesModalOpen = false"
            @saved="fetchInscricoes"
        />

        <ModalDetalhesInscricao
            :is-open="isDetalhesAtribuicaoModalOpen"
            :inscricao="selectedAtribuicao"
            :hide-resumo-tab="true"
            @close="isDetalhesAtribuicaoModalOpen = false"
            @saved="fetchAtrib(1)"
        />

        <ModalAtribuir
            :is-open="isModalAtribuirOpen"
            :aluno="selectedAlunoAtribuir"
            :mode="modalAtribuirMode"
            @close="isModalAtribuirOpen = false"
            @success="
                () => {
                    isModalAtribuirOpen = false;
                    fetchAtrib(1);
                }
            "
        />

        <ModalEncerrarBolsa
            :is-open="isModalEncerrarOpen"
            :aluno="selectedAlunoEncerrar"
            @close="isModalEncerrarOpen = false"
            @saved="fetchAtrib(paginationAtribuicoes.pagina_atual)"
        />

        <ModalRelatorioAtribuicoes
            :is-open="isModalRelatorioOpen"
            :ano-semestre="anoSemestre"
            @close="isModalRelatorioOpen = false"
        />

        <ModalReuniao
            :is-open="isReuniaoModalOpen"
            :ano-semestre="anoSemestre"
            @close="isReuniaoModalOpen = false"
            @saved="fetchReunioes(1)"
        />
    </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "../../../composables/useToast";
import { useAppStore } from "~/stores/app";
import { getAnoSemestre } from "../../../utils/ano_semestre";
import { formatDate } from "~/utils/date";
import ModalEdital from "~/components/bolsas/ModalEdital.vue";
import ModalEtapa from "~/components/bolsas/ModalEtapa.vue";
import ModalDetalhesInscricao from "~/components/bolsas/ModalDetalhesInscricao.vue";
import ModalAtribuir from "~/components/bolsas/ModalAtribuir.vue";
import ModalReuniao from "~/components/bolsas/ModalReuniao.vue";
import ModalEncerrarBolsa from "~/components/bolsas/ModalEncerrarBolsa.vue";
import ModalRelatorioAtribuicoes from "~/components/global/ModalRelatorioAtribuicoes.vue";
import AtribuicaoAlunoCard from "~/components/bolsas/AtribuicaoAlunoCard.vue";
import ReuniaoCard from "~/components/bolsas/ReuniaoCard.vue";
import EditalCard from "~/components/bolsas/EditalCard.vue";
import InscricaoCard from "~/components/bolsas/InscricaoCard.vue";
import PainelTabs from "~/components/bolsas/PainelTabs.vue";
import AtribuicaoFiltros from "~/components/bolsas/AtribuicaoFiltros.vue";
import { useBolsasStats } from "~/composables/bolsas/useBolsasStats";
import { useBolsasEditais } from "~/composables/bolsas/useBolsasEditais";
import { useBolsasInscricoes } from "~/composables/bolsas/useBolsasInscricoes";
import { useBolsasAtribuicoes } from "~/composables/bolsas/useBolsasAtribuicoes";
import { useBolsasReunioes } from "~/composables/bolsas/useBolsasReunioes";
import CandidateDashboard from "~/components/carometro/CandidateDashboard.vue";

definePageMeta({
    // permissions.global handles route protection
});

// Composables
const { dashboardStats, fetchStats } = useBolsasStats();
const { editais, isLoading, fetchEditais } = useBolsasEditais();
const {
    inscricoes,
    isLoadingInscricoes,
    searchBusca,
    page,
    totalPages,
    isExcelLoading,
    fetchInscricoes,
    debouncedSearch: _debouncedSearch,
    changePage: _changePage,
    handleExcelExport: _handleExcelExport,
} = useBolsasInscricoes();
const {
    atribuicoes,
    isLoadingAtribuicoes,
    turmasAtribuicao,
    isLoadingTurmasAtribuicao,
    paginationAtribuicoes,
    atribuicaoStatusOptions,
    filtersAtribuicao,
    fetchAtribuicoes: _fetchAtribuicoes,
    fetchTurmasAtribuicao: _fetchTurmasAtribuicao,
    handleAtribuicaoFilterChange: _handleAtribuicaoFilterChange,
    debouncedSearchAtribuicao: _debouncedSearchAtribuicao,
    changeAtribuicaoPage: _changeAtribuicaoPage,
    handlePromoverBolsa: _handlePromoverBolsa,
    handleReativarBolsa: _handleReativarBolsa,
} = useBolsasAtribuicoes();
const {
    reunioes,
    isLoadingReunioes,
    paginationReunioes,
    fetchReunioes: _fetchReunioes,
    changeReuniaoPage: _changeReuniaoPage,
    handlePresencaChange: _handlePresencaChange,
} = useBolsasReunioes();

const store = useAppStore();
const toast = useToast();

// State
const activeTab = ref("Editais");
const anoSemestre = ref(getAnoSemestre());
const tabs = ["Editais", "Inscrições", "Atribuição", "Reuniões"];

// Modals
const isEditalModalOpen = ref(false);
const editingEdital = ref(null);
const isEtapaModalOpen = ref(false);
const editingEtapa = ref(null);
const selectedEditalIdForEtapa = ref<string | null>(null);
const isDetalhesModalOpen = ref(false);
const selectedInscricao = ref(null);
const isDetalhesAtribuicaoModalOpen = ref(false);
const selectedAtribuicao = ref(null);
const isModalAtribuirOpen = ref(false);
const selectedAlunoAtribuir = ref(null);
const modalAtribuirMode = ref<"atribuicao" | "suplente">("atribuicao");
const isModalEncerrarOpen = ref(false);
const selectedAlunoEncerrar = ref(null);
const isReuniaoModalOpen = ref(false);
const isModalRelatorioOpen = ref(false);
const selectedMesRelatorio = ref(new Date().getMonth() + 1);

// Wrappers que passam anoSemestre
const s = () => anoSemestre.value;
const _fetchEditais = () => fetchEditais(s());
const fetchInsc = (editalId: string | null = null) =>
    fetchInscricoes(s(), editalId);
const debouncedSearch = () => _debouncedSearch(s());
const changePage = (p: number) => _changePage(p, s());
const handleExcelExport = () => _handleExcelExport(s());
const fetchTurmasAtrib = () => _fetchTurmasAtribuicao(s());
const fetchAtrib = (p = 1) => _fetchAtribuicoes(s(), p);
const handleAtribuicaoFilterChange = () => _handleAtribuicaoFilterChange(s());
const debouncedSearchAtribuicao = () => _debouncedSearchAtribuicao(s());
const changeAtribuicaoPage = (p: number) => _changeAtribuicaoPage(p, s());
const handlePromoverBolsa = (a: any) =>
    _handlePromoverBolsa(a, s(), paginationAtribuicoes.value.pagina_atual);
const handleReativarBolsa = (a: any) =>
    _handleReativarBolsa(a, s(), paginationAtribuicoes.value.pagina_atual);
const fetchReunioes = (p = 1) => _fetchReunioes(s(), p);
const changeReuniaoPage = (p: number) => _changeReuniaoPage(p, s());
const handlePresencaChange = (
    idR: string,
    idA: string,
    presenca: any,
    obs: string,
) =>
    _handlePresencaChange(
        idR,
        idA,
        presenca,
        obs,
        s(),
        paginationReunioes.value.pagina_atual,
    );

// Handlers simples (abrem modais)
const handleNewEdital = () => {
    editingEdital.value = null;
    isEditalModalOpen.value = true;
};
const handleNewReuniao = () => {
    isReuniaoModalOpen.value = true;
};
const handleRelatorioAtribuicao = () => {
    isModalRelatorioOpen.value = true;
};
const handleEditEdital = (edital: any) => {
    editingEdital.value = edital;
    isEditalModalOpen.value = true;
};
const handleEditalSaved = () => _fetchEditais();
const handleAddEtapa = (edital: any) => {
    selectedEditalIdForEtapa.value = edital.id;
    editingEtapa.value = null;
    isEtapaModalOpen.value = true;
};
const handleEditEtapa = (etapa: any, editalId: string) => {
    selectedEditalIdForEtapa.value = editalId;
    editingEtapa.value = etapa;
    isEtapaModalOpen.value = true;
};
const handleEtapaSaved = () => _fetchEditais();
const handleViewInscriptions = (edital: any) => {
    activeTab.value = "Inscrições";
    fetchInsc(edital.id);
};
const openDetails = (inscricao: any) => {
    selectedInscricao.value = inscricao;
    isDetalhesModalOpen.value = true;
};
const handleAtribuirAluno = (aluno: any) => {
    modalAtribuirMode.value = "atribuicao";
    selectedAlunoAtribuir.value = aluno;
    isModalAtribuirOpen.value = true;
};
const handleSuplenteAluno = (aluno: any) => {
    modalAtribuirMode.value = "suplente";
    selectedAlunoAtribuir.value = aluno;
    isModalAtribuirOpen.value = true;
};
const handleEncerrarBolsa = (aluno: any) => {
    if (!aluno?.atribuido) {
        toast.showToast("Este aluno não possui bolsa ativa para encerrar.", {
            type: "info",
        });
        return;
    }
    if (!aluno?.id_atribuicao) {
        toast.showToast(
            "Este aluno não possui atribuição ativa para encerrar.",
            { type: "info" },
        );
        return;
    }
    selectedAlunoEncerrar.value = aluno;
    isModalEncerrarOpen.value = true;
};
const handleVerDadosAtribuicao = (aluno: any) => {
    selectedAtribuicao.value = aluno;
    isDetalhesAtribuicaoModalOpen.value = true;
};

// Init
onMounted(() => {
    _fetchEditais();
    fetchStats(s());
});

// Watchers
watch(activeTab, (newTab) => {
    if (newTab === "Inscrições") fetchInsc();
    else if (newTab === "Atribuição") {
        fetchTurmasAtrib();
        fetchAtrib(1);
    } else if (newTab === "Reuniões") fetchReunioes();
});
watch(anoSemestre, () => {
    if (activeTab.value === "Inscrições") fetchInsc();
    else if (activeTab.value === "Atribuição") {
        fetchTurmasAtrib();
        fetchAtrib(1);
    } else if (activeTab.value === "Reuniões") fetchReunioes(1);
    else _fetchEditais();
    fetchStats(s());
});
</script>
