<script setup lang="ts">
import { getAnoSemestre } from "../../../utils/ano_semestre";
import { useAppStore } from "~/stores/app";
import { buildProtectedFileUrl } from "~/utils/protected-file-url";
import ModalDiario from "~/components/global/ModalDiario.vue";
import ModalListaAlunos from "~/components/matriculas/ModalListaAlunos.vue";
import CandidateDashboard from "~/components/carometro/CandidateDashboard.vue";
import { useToast } from "../../../composables/useToast";
import { useCarometroAlunos } from "~/composables/carometro/useCarometroAlunos";
import { useCarometroTurmas } from "~/composables/carometro/useCarometroTurmas";

const store = useAppStore();
const { showToast } = useToast();
const hashBase = computed(() => store.hash_base || "");

// ── Composables ──
const { alunos, isLoadingAlunos, pagination, limit, fetchAlunos } =
    useCarometroAlunos();
const { turmas, isLoading, dashboardStats, fetchTurmas, fetchStats } =
    useCarometroTurmas();

// ── Wrappers ──
const s = () => anoSemestre.value;
const f = () => filters.value;

const _fetchTurmas = () =>
    fetchTurmas({
        anoSemestre: s(),
        turno: f().turno || null,
        area: f().area || null,
    });

const _fetchStats = () =>
    fetchStats({
        anoSemestre: s(),
        id_turma: f().curso || null,
        area: f().area || null,
        turno: f().turno || null,
        busca: f().busca || null,
    });

const _fetchAlunos = (page = 1) =>
    fetchAlunos(page, {
        anoSemestre: s(),
        id_turma: f().curso || null,
        area: f().area || null,
        turno: f().turno || null,
        busca: f().busca || null,
    });

// ── UI State ──
const anoSemestre = ref(getAnoSemestre());
const isModalListaAlunosOpen = ref(false);

// Diario Modal State
const showDiarioModal = ref(false);
const selectedCandidateForDiario = ref<any>(null);

// Filters
const filters = ref({
    turno: "",
    area: "",
    curso: "",
    busca: "",
});

// Options
const turnos = ["Matutino", "Vespertino", "Noturno"];
const areas = [
    { label: "Regulares", value: "Regulares" },
    { label: "Cursos Livres", value: "Cursos Livres" },
    { label: "Extensão", value: "Extensão" },
    { label: "Especialização", value: "especializacao" },
];

// ── Handlers ──
const openDiarioModal = (aluno: any) => {
    const matriculaId = aluno.id_matricula || null;
    const alunoId = aluno.aluno_id || aluno.id_aluno || null;
    const turmaId = aluno.id_turma || aluno.turma_id || null;

    if (!matriculaId) {
        showToast(
            "Este registro não trouxe id_matricula. Atualize a lista e tente novamente.",
            { type: "error" },
        );
        console.error("Missing IDs:", {
            matriculaId,
            alunoId,
            turmaId,
            original: aluno,
        });
        return;
    }

    selectedCandidateForDiario.value = {
        ...aluno,
        id_matricula: matriculaId,
        aluno_id: alunoId,
        id_turma: turmaId,
    };
    showDiarioModal.value = true;
};

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

// ── Watchers ──
watch(
    [anoSemestre, () => filters.value.turno, () => filters.value.area],
    async () => {
        await store.refreshHash();
        _fetchTurmas();
    },
);

watch(
    () => filters.value.curso,
    async () => {
        await store.refreshHash();
        _fetchAlunos(1);
        _fetchStats();
    },
);

// Debounced Search
let searchTimeout: any;
watch(
    () => filters.value.busca,
    () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            await store.refreshHash();
            _fetchAlunos(1);
            _fetchStats();
        }, 500);
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
            <!-- HEADER / TABS -->
            <div
                class="flex flex-col md:flex-row items-center justify-between gap-4 mb-4"
            >
                <!-- Title for Carômetro instead of Tabs -->
                <h2
                    class="text-xl font-bold text-white flex items-center gap-2"
                >
                    <svg
                        class="w-6 h-6 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                        ></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Carômetro
                </h2>

                <!-- Global Year Select -->
                <div class="relative w-full md:w-48">
                    <select
                        v-model="anoSemestre"
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
            </div>

            <p class="text-xs text-secondary/70 mb-8">
                Visualização de alunos com matrícula ativa.
            </p>

            <!-- FILTER BAR (2 Rows, Grid 12) -->
            <div class="bg-[#16161E] border border-white/5 rounded-xl p-4 mb-6">
                <!-- Label -->
                <h4
                    class="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"
                >
                    <svg
                        class="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        ></path>
                    </svg>
                    Filtros de Busca
                </h4>

                <div class="space-y-3">
                    <!-- Row 1: Area | Curso | Turno -->
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <!-- Area -->
                        <div class="md:col-span-3">
                            <select
                                v-model="filters.area"
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                            >
                                <option value="">Todas Áreas</option>
                                <option
                                    v-for="area in areas"
                                    :key="area.value"
                                    :value="area.value"
                                >
                                    {{ area.label }}
                                </option>
                            </select>
                        </div>

                        <!-- Curso -->
                        <div class="md:col-span-6 cursor-pointer relative">
                            <select
                                v-model="filters.curso"
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10 truncate pr-8"
                                :disabled="isLoading"
                            >
                                <option value="" disabled>
                                    Selecione um Curso/Turma
                                </option>
                                <option
                                    v-for="t in turmas"
                                    :key="t.id"
                                    :value="t.id"
                                >
                                    {{ t.nome_curso }} - {{ t.cod_turma }} ({{
                                        t.turno
                                    }})
                                </option>
                            </select>
                            <div
                                v-if="isLoading"
                                class="absolute right-3 top-3"
                            >
                                <svg
                                    class="animate-spin h-4 w-4 text-primary"
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
                            </div>
                        </div>

                        <!-- Turno -->
                        <div class="md:col-span-3">
                            <select
                                v-model="filters.turno"
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                            >
                                <option value="">Todos Turnos</option>
                                <option value="Matutino">Matutino</option>
                                <option value="Vespertino">Vespertino</option>
                                <option value="Noturno">Noturno</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 2: Search (Full Width) -->
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <!-- Search -->
                        <div class="md:col-span-12">
                            <input
                                v-model="filters.busca"
                                type="text"
                                placeholder="Buscar por nome do aluno..."
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 h-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTENT AREA -->
            <div class="space-y-4">
                <!-- Loading State -->
                <div
                    v-if="isLoadingAlunos"
                    class="flex flex-col items-center justify-center py-20"
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
                    <p class="text-sm text-secondary">Carregando alunos...</p>
                </div>

                <!-- Empty State -->
                <div
                    v-else-if="alunos.length === 0"
                    class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
                >
                    <div class="text-4xl mb-4 text-secondary/50">
                        <svg
                            class="w-16 h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-white font-medium">
                        Nenhum aluno encontrado
                    </p>
                    <p class="text-xs text-secondary mt-1">
                        Verifique os filtros ou selecione outra turma.
                    </p>
                </div>

                <!-- Student List (Card Layout) -->
                <div
                    v-else
                    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                    <div
                        v-for="aluno in alunos"
                        :key="aluno.id"
                        class="bg-[#16161E] border border-white/5 rounded-xl flex md:overflow-visible overflow-hidden hover:border-primary/30 transition-colors group relative min-h-[120px]"
                    >
                        <!-- Left: Full Height Photo -->
                        <div
                            class="w-28 relative flex-shrink-0 bg-white/5 border-r border-white/5 group/photo hover:z-50"
                        >
                            <img
                                v-if="aluno.foto_resposta && hashBase"
                                :src="
                                    buildProtectedFileUrl(
                                        hashBase,
                                        aluno.foto_resposta,
                                        'secretaria',
                                    )
                                "
                                class="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover/photo:scale-[1.8] group-hover/photo:translate-x-14 group-hover/photo:shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 rounded-l-xl md:rounded-lg"
                                alt="Foto"
                                @error="
                                    (e: any) =>
                                        (e.target.style.display = 'none')
                                "
                            />
                            <div
                                v-else
                                class="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-secondary bg-black/20"
                            >
                                <span class="text-2xl mb-1">{{
                                    aluno.name_display?.fallbackInitial
                                }}</span>
                                <span class="text-[9px] opacity-50"
                                    >Sem Foto</span
                                >
                            </div>
                        </div>

                        <!-- Right: Info (Simplified) -->
                        <div
                            class="flex-1 p-3 flex flex-col justify-center min-w-0 z-10 gap-2 relative"
                        >
                            <!-- Main Info Block -->
                            <div class="space-y-1">
                                <!-- Name & Email -->
                                <div class="">
                                    <h5
                                        class="text-sm font-bold text-white truncate leading-tight"
                                        :title="aluno.name_display?.primaryName"
                                    >
                                        {{ aluno.name_display?.primaryName }}
                                    </h5>
                                    <p
                                        class="text-[10px] text-secondary truncate"
                                    >
                                        {{ aluno.email }}
                                    </p>
                                </div>

                                <div class="flex items-center gap-1.5 min-w-0">
                                    <span
                                        class="text-[9px] text-secondary uppercase tracking-wider font-bold"
                                        >{{
                                            aluno.name_display?.secondaryLabel
                                        }}</span
                                    >
                                    <span
                                        class="text-[10px] text-white/80 font-medium truncate"
                                        >{{
                                            aluno.name_display?.secondaryValue
                                        }}</span
                                    >
                                </div>

                                <!-- Curso & Turno + RA -->
                                <div
                                    class="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5"
                                >
                                    <!-- Curso -->
                                    <div class="col-span-2">
                                        <p
                                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                                        >
                                            Curso
                                        </p>
                                        <p
                                            class="text-[10px] text-white font-medium truncate"
                                            :title="
                                                aluno.nome_curso_turno ||
                                                aluno.nome_curso
                                            "
                                        >
                                            {{ aluno.nome_curso }}
                                        </p>
                                    </div>

                                    <!-- Turno -->
                                    <div
                                        class="flex items-end justify-between pr-2"
                                    >
                                        <div>
                                            <p
                                                class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                                            >
                                                Turno
                                            </p>
                                            <p
                                                class="text-[10px] text-white font-medium"
                                            >
                                                {{ aluno.turno }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- RA -->
                                    <div>
                                        <p
                                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                                        >
                                            RA
                                        </p>
                                        <p
                                            class="text-[10px] text-white font-medium font-mono"
                                        >
                                            {{
                                                aluno.ra ||
                                                aluno.ra_legado ||
                                                "---"
                                            }}
                                        </p>
                                    </div>

                                    <!-- Diario Button -->
                                    <div
                                        v-if="
                                            store.hasRoleByName([
                                                'admin',
                                                'docente',
                                                'assistentes',
                                            ])
                                        "
                                        class="col-span-2 pt-2 border-t border-white/5 mt-1"
                                    >
                                        <button
                                            @click="openDiarioModal(aluno)"
                                            class="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-400 transition-colors group/btn"
                                            title="Ver Diário"
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
                                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                ></path>
                                            </svg>
                                            <span
                                                class="text-[10px] font-bold uppercase tracking-wider"
                                                >Diário</span
                                            >
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PAGINATION -->
                <div
                    v-if="alunos.length > 0"
                    class="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-white/5"
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
                                pagination.pagina_atual >=
                                pagination.qtd_paginas
                            "
                            class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <template #sidebar>
            <CandidateDashboard
                :candidatos="alunos"
                :totalCount="pagination.qtd_total"
                :statsData="dashboardStats"
                :showListaAlunos="true"
                @open-lista-alunos="isModalListaAlunosOpen = true"
            />
        </template>

        <!-- Modals -->
        <ModalDiario
            v-if="showDiarioModal"
            :isOpen="showDiarioModal"
            :aluno="selectedCandidateForDiario"
            @close="showDiarioModal = false"
        />

        <ModalListaAlunos
            :is-open="isModalListaAlunosOpen"
            :ano-semestre="anoSemestre"
            :hash-base="hashBase"
            :filters="filters"
            @close="isModalListaAlunosOpen = false"
        />
    </NuxtLayout>
</template>
