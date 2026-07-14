<script setup lang="ts">
import { getAnoSemestre } from "../../../utils/ano_semestre";
import ModalCurso from "../../components/cursos-turmas/ModalCurso.vue";
import ModalTurma from "../../components/cursos-turmas/ModalTurma.vue";
import CursosTurmasCursosTab from "../../components/cursos-turmas/CursosTurmasCursosTab.vue";
import CursosTurmasTurmasTab from "../../components/cursos-turmas/CursosTurmasTurmasTab.vue";
import CursosTurmasCalendarioTab from "../../components/cursos-turmas/CursosTurmasCalendarioTab.vue";
import { useToast } from "../../../composables/useToast";
import { useCursosTurmasCursos } from "~/composables/cursos-turmas/useCursosTurmasCursos";
import { useCursosTurmasTurmas } from "~/composables/cursos-turmas/useCursosTurmasTurmas";
import { useCursosTurmasCalendario } from "~/composables/cursos-turmas/useCursosTurmasCalendario";

const { showToast } = useToast();

// ── Composables ──
const {
    items,
    isLoading: isLoadingCursos,
    pagination,
    fetchCursos,
} = useCursosTurmasCursos();
const {
    items: turmaItems,
    isLoading: isLoadingTurmas,
    pagination: turmaPagination,
    fetchTurmas,
} = useCursosTurmasTurmas();
const {
    events: calendarEvents,
    isLoading: isLoadingCalendario,
    selectedTurmaId: selectedCalendarTurmaId,
    turmas: calendarTurmas,
    fetchEvents: fetchCalendarEvents,
    initTurmas: initCalendarTab,
} = useCursosTurmasCalendario();

// ── UI State ──
const activeTab = ref<"cursos" | "turmas" | "calendarios">("cursos");
const showCreateModal = ref(false);
const showTurmaModal = ref(false);
const selectedCourseId = ref<string | null>(null);
const selectedTurmaId = ref<string | null>(null);

const filters = ref({
    search: "",
    area: null as string | null,
    anoSemestre: getAnoSemestre(),
});

const calendarArea = ref<string | null>("Extensão");
const isLoading = computed(
    () =>
        isLoadingCursos.value ||
        isLoadingTurmas.value ||
        isLoadingCalendario.value,
);

const semesterOptions = computed(() => [
    {
        label: `${getAnoSemestre(undefined, -1)} (Anterior)`,
        value: getAnoSemestre(undefined, -1),
    },
    { label: `${getAnoSemestre()} (Atual)`, value: getAnoSemestre() },
    {
        label: `${getAnoSemestre(undefined, 1)} (Próximo)`,
        value: getAnoSemestre(undefined, 1),
    },
]);

const areaOptions = [
    { label: "Todas as Áreas", value: null },
    { label: "Extensão", value: "Extensão" },
    { label: "Regulares", value: "Regulares" },
    { label: "Cursos Livres", value: "Cursos Livres" },
    { label: "Especialização", value: "especializacao" },
];

// ── Wrappers ──
const f = () => filters.value;

const _fetchCursos = () =>
    fetchCursos({
        area: f().area,
        search: f().search,
        page: pagination.value.pagina_atual,
    });

const _fetchTurmas = () =>
    fetchTurmas({
        area: f().area,
        search: f().search,
        anoSemestre: f().anoSemestre,
        page: turmaPagination.value.pagina_atual,
    });

const _fetchCalendarEvents = () => fetchCalendarEvents();
const _initCalendarTab = () => initCalendarTab({ area: calendarArea.value });

// ── Handlers de UI ──
const handleCursosPage = (page: number) => {
    pagination.value.pagina_atual = page;
    _fetchCursos();
};

const handleTurmasPage = (page: number) => {
    turmaPagination.value.pagina_atual = page;
    _fetchTurmas();
};

// ── Watchers ──
let searchTimeout: any = null;
watch(
    () => filters.value.search,
    () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (activeTab.value === "cursos") _fetchCursos();
            if (activeTab.value === "turmas") _fetchTurmas();
        }, 500);
    },
);

watch(
    () => filters.value.area,
    () => {
        if (activeTab.value === "cursos") _fetchCursos();
        if (activeTab.value === "turmas") _fetchTurmas();
    },
);

watch(
    () => filters.value.anoSemestre,
    () => {
        if (activeTab.value === "turmas") _fetchTurmas();
        if (activeTab.value === "calendarios") _initCalendarTab();
    },
);

watch(activeTab, (val) => {
    if (val === "cursos") {
        _fetchCursos();
    } else if (val === "turmas") {
        _fetchTurmas();
        turmaItems.value = [];
    } else if (val === "calendarios") {
        _initCalendarTab();
    } else {
        items.value = [];
        turmaItems.value = [];
    }
});

watch(selectedCalendarTurmaId, () => {
    if (activeTab.value === "calendarios") _fetchCalendarEvents();
});

watch(calendarArea, () => {
    if (activeTab.value === "calendarios") _initCalendarTab();
});

onMounted(() => {
    _fetchCursos();
});
</script>

<template>
    <NuxtLayout name="base">
        <div class="bg-div-15 rounded-xl p-6 md:p-8">
            <!-- HEADER -->
            <div
                class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
            >
                <div>
                    <h1
                        class="text-2xl font-black text-white uppercase tracking-tight"
                    >
                        Cursos e Turmas
                    </h1>
                    <p class="text-sm text-secondary font-medium mt-1">
                        Gestão Acadêmica
                    </p>
                </div>
                <button
                    v-if="activeTab !== 'calendarios'"
                    @click="
                        () => {
                            if (activeTab === 'cursos') {
                                selectedCourseId = null;
                                showCreateModal = true;
                            } else if (activeTab === 'turmas') {
                                selectedTurmaId = null;
                                showTurmaModal = true;
                            }
                        }
                    "
                    class="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4v16m8-8H4"
                        ></path>
                    </svg>
                    {{ activeTab === "turmas" ? "Nova Turma" : "Novo Curso" }}
                </button>
            </div>

            <!-- TABS -->
            <div
                class="flex items-center gap-6 border-b border-secondary/10 mb-6"
            >
                <button
                    @click="activeTab = 'cursos'"
                    class="text-sm font-bold pb-3 relative transition-colors"
                    :class="
                        activeTab === 'cursos'
                            ? 'text-primary'
                            : 'text-secondary hover:text-white'
                    "
                >
                    Cursos
                    <span
                        v-if="activeTab === 'cursos'"
                        class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                    ></span>
                </button>
                <button
                    @click="activeTab = 'turmas'"
                    class="text-sm font-bold pb-3 relative transition-colors"
                    :class="
                        activeTab === 'turmas'
                            ? 'text-primary'
                            : 'text-secondary hover:text-white'
                    "
                >
                    Turmas
                    <span
                        v-if="activeTab === 'turmas'"
                        class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                    ></span>
                </button>
                <button
                    @click="activeTab = 'calendarios'"
                    class="text-sm font-bold pb-3 relative transition-colors"
                    :class="
                        activeTab === 'calendarios'
                            ? 'text-primary'
                            : 'text-secondary hover:text-white'
                    "
                >
                    Calendários
                    <span
                        v-if="activeTab === 'calendarios'"
                        class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                    ></span>
                </button>
            </div>

            <!-- CURSOS TAB CONTENT -->
            <CursosTurmasCursosTab
                v-if="activeTab === 'cursos'"
                v-model:search="filters.search"
                v-model:area="filters.area"
                :items="items"
                :is-loading="isLoading"
                :pagination="pagination"
                :area-options="areaOptions"
                @page-change="handleCursosPage"
                @edit="
                    (cursoId) => {
                        selectedCourseId = cursoId;
                        showCreateModal = true;
                    }
                "
            />

            <!-- TURMAS TAB CONTENT -->
            <CursosTurmasTurmasTab
                v-else-if="activeTab === 'turmas'"
                v-model:search="filters.search"
                v-model:area="filters.area"
                v-model:ano-semestre="filters.anoSemestre"
                :items="turmaItems"
                :is-loading="isLoading"
                :pagination="turmaPagination"
                :area-options="areaOptions"
                :semester-options="semesterOptions"
                @page-change="handleTurmasPage"
                @edit="
                    (turmaId) => {
                        selectedTurmaId = turmaId;
                        showTurmaModal = true;
                    }
                "
            />

            <!-- CALENDARIOS TAB CONTENT -->
            <CursosTurmasCalendarioTab
                v-else-if="activeTab === 'calendarios'"
                :events="calendarEvents"
                :is-loading="isLoading"
                :calendar-area="calendarArea"
                :ano-semestre="filters.anoSemestre"
                :semester-options="semesterOptions"
                :area-options="areaOptions"
                :calendar-turmas="calendarTurmas"
                :selected-calendar-turma-id="selectedCalendarTurmaId"
                @update:calendar-area="calendarArea = $event"
                @update:ano-semestre="filters.anoSemestre = $event"
                @update:selected-calendar-turma-id="
                    selectedCalendarTurmaId = $event
                "
                @refresh="fetchCalendarEvents"
            />
        </div>
    </NuxtLayout>

    <ModalCurso
        :isOpen="showCreateModal"
        :courseId="selectedCourseId"
        @close="showCreateModal = false"
        @save="_fetchCursos"
    />

    <ModalTurma
        :isOpen="showTurmaModal"
        :turmaId="selectedTurmaId"
        @close="showTurmaModal = false"
        @save="_fetchTurmas"
    />
</template>
