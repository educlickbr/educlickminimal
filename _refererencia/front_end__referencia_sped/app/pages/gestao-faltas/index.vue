<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER / TABS -->
            <GestaoFaltasTabs
                :active-tab="activeTab"
                :user-expandido-id="store.user_expandido_id"
                @update:active-tab="activeTab = $event"
                @open-modal="handleOpenModal"
            />

            <!-- Minhas Faltas Tab -->
            <div v-if="activeTab === 'minhas-faltas'" class="space-y-6">
                <!-- Filters -->
                <GestaoFaltasFiltros
                    :selected-ano-semestre="selectedAnoSemestre"
                    :ano-semestre-options="anoSemestreOptions"
                    :selected-matricula-id="selectedMatriculaId"
                    :turmas-options="turmasOptions"
                    @update:ano-semestre="handleAnoSemestreChange"
                    @update:matricula="handleMatriculaChange"
                />

                <!-- Loading -->
                <div
                    v-if="loadingDiario"
                    class="bg-[#16161E] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center"
                >
                    <svg
                        class="animate-spin h-8 w-8 text-primary mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p class="text-sm text-secondary">
                        Carregando frequência...
                    </p>
                </div>

                <!-- Error -->
                <div
                    v-else-if="errorDiario"
                    class="bg-[#16161E] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-red-400"
                >
                    <svg
                        class="w-12 h-12 mb-2 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                    </svg>
                    <p>{{ errorDiario }}</p>
                </div>

                <!-- Empty state -->
                <div
                    v-else-if="!selectedMatriculaId"
                    class="bg-[#16161E] border border-white/5 rounded-xl p-12 text-center"
                >
                    <div class="text-secondary mb-2">
                        <svg
                            class="w-16 h-16 mx-auto mb-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">
                        Selecione uma turma
                    </h3>
                    <p class="text-sm text-secondary">
                        Use os filtros acima para visualizar sua frequência.
                    </p>
                </div>

                <!-- Diário content -->
                <div v-else-if="diarioData" class="space-y-6">
                    <GestaoFaltasStats
                        :percentual-presenca="diarioData.percentual_presenca"
                        :horas-faltadas="diarioData.horas_faltadas"
                        :horas-totais="diarioData.horas_totais_modulo"
                    />

                    <!-- Presença em Reuniões (Bolsistas) -->
                    <div
                        class="bg-[#16161E] border border-white/5 rounded-xl p-6"
                    >
                        <h3
                            class="text-sm font-bold text-white mb-4 flex items-center gap-2"
                        >
                            <svg
                                class="w-4 h-4 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Presença em Reuniões
                        </h3>
                        <CardPresencaReunioes
                            v-if="selectedMatriculaId && selectedAnoSemestre"
                            :id_matricula="selectedMatriculaId"
                            :ano_semestre="selectedAnoSemestre"
                        />
                    </div>

                    <GestaoFaltasGrid
                        :registros="diarioData.registros"
                        :qtd-periodos="diarioData.qtd_periodos"
                        :format-date="formatDate"
                        :get-status-color="getStatusColor"
                        :get-status-label="getStatusLabel"
                    />
                </div>
            </div>

            <!-- Justificativas Tab -->
            <div v-if="activeTab === 'justificativas'" class="space-y-6">
                <div v-if="loadingJustificativas" class="text-center py-12">
                    <svg
                        class="animate-spin h-8 w-8 text-primary mx-auto mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p class="text-secondary text-sm">Carregando...</p>
                </div>

                <div
                    v-else-if="justificativasList.length === 0"
                    class="bg-[#16161E] border border-white/5 rounded-xl p-12 text-center"
                >
                    <div class="text-secondary mb-2">
                        <svg
                            class="w-16 h-16 mx-auto mb-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">
                        Nenhuma justificativa
                    </h3>
                    <p class="text-sm text-secondary">
                        Você ainda não enviou nenhuma justificativa de falta.
                    </p>
                </div>

                <div v-else class="space-y-4">
                    <JustificativaCard
                        v-for="item in justificativasList"
                        :key="item.id"
                        :item="item"
                        :format-date="justFormatDate"
                        :get-status-badge="getStatusBadge"
                        :open-attachment="openAttachment"
                        @delete="handleDeleteJustificativa"
                    />
                </div>
            </div>

            <!-- Atestados Tab -->
            <div v-if="activeTab === 'atestados'" class="space-y-6">
                <div v-if="loadingJustificativas" class="text-center py-12">
                    <svg
                        class="animate-spin h-8 w-8 text-primary mx-auto mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p class="text-secondary text-sm">Carregando...</p>
                </div>

                <div
                    v-else-if="atestadosList.length === 0"
                    class="bg-[#16161E] border border-white/5 rounded-xl p-12 text-center"
                >
                    <div class="text-secondary mb-2">
                        <svg
                            class="w-16 h-16 mx-auto mb-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">
                        Nenhum atestado
                    </h3>
                    <p class="text-sm text-secondary">
                        Você ainda não enviou nenhum atestado médico.
                    </p>
                </div>

                <div v-else class="space-y-4">
                    <AtestadoCard
                        v-for="item in atestadosList"
                        :key="item.id"
                        :item="item"
                        :format-date="justFormatDate"
                        :get-status-badge="getStatusBadge"
                        :open-attachment="openAttachment"
                        @delete="handleDeleteJustificativa"
                    />
                </div>
            </div>

            <ModalJustificativa
                :is-open="modalOpen"
                :tipo="modalTipo"
                @close="modalOpen = false"
                @success="fetchJustificativas"
            />
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { useAppStore } from "~/stores/app";
import {
    getAnoSemestre,
    getAnoSemestreList,
} from "../../../utils/ano_semestre";

import { useGestaoFaltasDiario } from "~/composables/gestao-faltas/useGestaoFaltasDiario";
import { useGestaoFaltasJustificativas } from "~/composables/gestao-faltas/useGestaoFaltasJustificativas";

import GestaoFaltasTabs from "~/components/gestao-faltas/GestaoFaltasTabs.vue";
import GestaoFaltasFiltros from "~/components/gestao-faltas/GestaoFaltasFiltros.vue";
import GestaoFaltasStats from "~/components/gestao-faltas/GestaoFaltasStats.vue";
import GestaoFaltasGrid from "~/components/gestao-faltas/GestaoFaltasGrid.vue";
import JustificativaCard from "~/components/gestao-faltas/JustificativaCard.vue";
import AtestadoCard from "~/components/gestao-faltas/AtestadoCard.vue";
import ModalJustificativa from "~/components/gestao-faltas/ModalJustificativa.vue";

definePageMeta({
    layout: false,
});

// Store
const store = useAppStore();

// Composables
const {
    minhasTurmas,
    loadingDiario,
    diarioData,
    errorDiario,
    selectedMatriculaId,
    gridStyle,
    formatDate,
    getStatusColor,
    getStatusLabel,
    fetchMinhasTurmas,
    fetchDiario,
} = useGestaoFaltasDiario();

const {
    justificativasList,
    atestadosList,
    loadingJustificativas,
    getStatusBadge,
    formatDate: justFormatDate,
    fetchJustificativas,
    deleteJustificativa,
    openAttachment,
} = useGestaoFaltasJustificativas();

// UI State
const activeTab = ref("minhas-faltas");
const selectedAnoSemestre = ref<string>(getAnoSemestre());
const modalOpen = ref(false);
const modalTipo = ref<"atestado" | "justificativa">("justificativa");

// Computed
const anoSemestreOptions = computed(() => getAnoSemestreList(5));

const turmasOptions = computed(() => {
    if (!selectedAnoSemestre.value) return [];
    return minhasTurmas.value
        .filter(
            (t) =>
                t.ano_semestre === selectedAnoSemestre.value &&
                !!t.id_matricula,
        )
        .map((t) => ({
            id: t.id_matricula,
            id_matricula: t.id_matricula,
            id_turma: t.id_turma,
            nome: `${t.cod_turma} - ${t.nome_curso} (${t.turno})`,
        }));
});

// Wrappers
const handleOpenModal = (tipo: "atestado" | "justificativa") => {
    modalTipo.value = tipo;
    modalOpen.value = true;
};

const handleAnoSemestreChange = (value: string) => {
    selectedAnoSemestre.value = value;
    selectedMatriculaId.value = null;
    diarioData.value = null;
};

const handleMatriculaChange = (value: string | null) => {
    selectedMatriculaId.value = value;
    if (value) {
        fetchDiario(value);
    } else {
        diarioData.value = null;
    }
};

const handleDeleteJustificativa = (id: string, status?: string) => {
    deleteJustificativa(id, status);
};

// Watchers
watch(selectedAnoSemestre, () => {
    selectedMatriculaId.value = null;
    diarioData.value = null;
});

// Lifecycle
onMounted(() => {
    if (store.initialized) {
        fetchMinhasTurmas();
        fetchJustificativas();
    } else {
        const unwatch = watch(
            () => store.initialized,
            (val) => {
                if (val) {
                    fetchMinhasTurmas();
                    fetchJustificativas();
                    unwatch();
                }
            },
        );
    }
});
</script>
