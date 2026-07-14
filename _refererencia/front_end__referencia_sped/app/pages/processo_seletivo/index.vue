<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import {
    useProcessoSeletivoCursos,
    type MappedCourse,
    type FilterRole,
    type FilterCategory,
} from "@/composables/processo_seletivo/useProcessoSeletivoCursos";
import { useProcessoSeletivoRegulares } from "@/composables/processo_seletivo/useProcessoSeletivoRegulares";
import { useProcessoSeletivoJnpta } from "@/composables/processo_seletivo/useProcessoSeletivoJnpta";

definePageMeta({
    // layout: 'base', // Using explicit NuxtLayout in template
    auth: false,
    title: "Processo Seletivo - EduSelect",
});

const user = useSupabaseUser();
const { showToast } = useToast();
// Define cookie type explicitly to allow object
const redirectCookie = useCookie<any>("redirect_after_login");
const route = useRoute();

// --- Tipos & Interface ---
interface EnrollmentConfirmationState {
    isOpen: boolean;
    course: MappedCourse | null;
}

// --- Estado ---
const selectedRole = ref<FilterRole>("estudante");
const selectedCategory = ref<FilterCategory>("extensao");
const searchQuery = ref("");
const router = useRouter();

const enrollmentConfirmation = ref<EnrollmentConfirmationState>({
    isOpen: false,
    course: null,
});

// --- Jornada Paulista ---
const {
    editaisJnpta,
    loadingEditais,
    loadingElegibilidadeJnpta,
    isJnptaBlockedByEnviada,
    hasJnptaDraft,
    fetchEditaisJnpta,
    fetchElegibilidadeJnpta,
    handleInscricaoJnpta,
    handleOpenEditalJnpta,
} = useProcessoSeletivoJnpta();

// --- Elegibilidade Regulares ---
const {
    anosSemestresBloqueados,
    loadingElegibilidadeRegulares,
    isRegularBlocked,
    isRegularCourse,
    getRegularBlockMessage,
    fetchElegibilidadeRegulares,
} = useProcessoSeletivoRegulares();

// --- API Call + Mapeamento ---
const { data, pending, error, refresh, filteredCourses } =
    useProcessoSeletivoCursos(selectedRole, selectedCategory, searchQuery);

const handleEnroll = (id: number) => {
    console.log("Enroll course", id);
    // Redirecionar para página de inscrição real se houver
    // navigateTo(`/inscricao/${id}`)
};
const closeEnrollmentConfirmation = () => {
    enrollmentConfirmation.value = {
        isOpen: false,
        course: null,
    };
};

const proceedWithInscricao = async (course: MappedCourse) => {
    if (isRegularBlocked(course)) {
        showToast(getRegularBlockMessage(course.anoSemestre), {
            type: "error",
        });
        return;
    }

    if (!course.id || course.id === "undefined") {
        console.error("ID da turma não encontrado:", course);
        alert(
            "Erro: ID da turma não disponível. Por favor, tente novamente mais tarde.",
        );
        return;
    }

    const targetPath = `/inscricao/${course.id}`;
    const targetQuery = {
        tipo: course.role,
        area: course.category,
        processo: "seletivo",
    };

    if (user.value) {
        // Logged in: go directly
        console.log("User logged in. Navigating to:", targetPath);
        await router.push({
            path: targetPath,
            query: targetQuery,
        });
    } else {
        // Not logged in: save intent and go to login
        console.log(
            "User NOT logged in. Saving intent and redirecting to login.",
        );

        redirectCookie.value = {
            path: targetPath,
            query: targetQuery,
            procedencia_form: true,
            meta: {
                category: course.category,
                anoSemestre: course.anoSemestre,
            },
        };

        await router.push("/login");
    }
};

const handleInscricao = async (course: MappedCourse) => {
    if (isRegularBlocked(course)) {
        showToast(getRegularBlockMessage(course.anoSemestre), {
            type: "error",
        });
        return;
    }

    if (!isRegularCourse(course)) {
        await proceedWithInscricao(course);
        return;
    }

    enrollmentConfirmation.value = {
        isOpen: true,
        course,
    };
};

const confirmEnrollment = async () => {
    const course = enrollmentConfirmation.value.course;
    if (!course) return;

    closeEnrollmentConfirmation();
    await proceedWithInscricao(course);
};

// --- API Call + Mapeamento ---
watch(selectedCategory, (newCat) => {
    if (newCat === "jornada_paulista") {
        fetchEditaisJnpta();
        fetchElegibilidadeJnpta();
    }
});

watch(
    () => route.query.bloqueio_regulares,
    async (blockedPeriod) => {
        const periodo = Array.isArray(blockedPeriod)
            ? blockedPeriod[0]
            : blockedPeriod;
        if (!periodo) return;

        showToast(getRegularBlockMessage(periodo), { type: "error" });

        const nextQuery = { ...route.query };
        delete nextQuery.bloqueio_regulares;
        await router.replace({ query: nextQuery });
    },
    { immediate: true },
);

onMounted(() => {
    if (selectedCategory.value === "jornada_paulista") {
        fetchEditaisJnpta();
        fetchElegibilidadeJnpta();
    }

    fetchElegibilidadeRegulares();
});

watch(
    () => user.value?.id,
    () => {
        fetchElegibilidadeRegulares();
        fetchElegibilidadeJnpta();
    },
);
</script>

<template>
    <NuxtLayout name="base">
        <div class="flex flex-col gap-8 pb-10">
            <!-- Hero Section #0F2027 #203A43 -->
            <div
                class="relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-[#009C82] via-[#305F7E] to-[#5C267B] text-white shadow-2xl"
            >
                <div
                    class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"
                ></div>
                <div
                    class="relative z-10 px-8 py-8 md:py-24 text-center flex flex-col items-center justify-center gap-4"
                >
                    <h1
                        class="text-2xl md:text-5xl font-black uppercase tracking-tight drop-shadow-lg"
                    >
                        Processo Seletivo
                    </h1>
                    <p
                        class="text-xs md:text-lg opacity-90 max-w-2xl font-medium leading-relaxed"
                    >
                        Navegue pelos cursos disponíveis para estudantes e
                        docentes. Selecione o tipo de candidatura e a área e
                        clique em Inscrever-se.
                    </p>
                </div>
            </div>

            <!-- Role Toggle -->
            <div class="flex justify-center -mt-4">
                <div
                    class="bg-div-15 p-1.5 rounded-xl shadow-lg border border-secondary/10 flex items-center gap-2"
                >
                    <button
                        @click="selectedRole = 'estudante'"
                        class="px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
                        :class="
                            selectedRole === 'estudante'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-secondary hover:bg-div-30'
                        "
                    >
                        Estudante
                    </button>
                    <button
                        @click="selectedRole = 'docente'"
                        class="px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
                        :class="
                            selectedRole === 'docente'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-secondary hover:bg-div-30'
                        "
                    >
                        Docente
                    </button>
                </div>
            </div>

            <!-- Filter Bar & Search -->
            <div
                class="flex flex-col md:flex-row items-center justify-between gap-4 px-2"
            >
                <!-- Tabs -->
                <div
                    class="flex items-center gap-6 border-b border-secondary/10 w-full md:w-auto pb-1 overflow-x-auto hide-scrollbar"
                >
                    <button
                        v-for="cat in [
                            { label: 'Extensão', value: 'extensao' },
                            { label: 'Regulares', value: 'regulares' },
                            { label: 'Cursos Livres', value: 'cursos_livres' },
                            {
                                label: 'Jornada Paulista',
                                value: 'jornada_paulista',
                            },
                        ]"
                        :key="cat.value"
                        @click="selectedCategory = cat.value as FilterCategory"
                        class="text-sm font-bold pb-2 relative transition-colors capitalize text-secondary hover:text-primary whitespace-nowrap"
                        :class="{
                            'text-primary': selectedCategory === cat.value,
                        }"
                    >
                        {{ cat.label }}
                        <span
                            v-if="selectedCategory === cat.value"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        ></span>
                    </button>
                </div>

                <!-- Search -->
                <div class="relative w-full md:w-80">
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Buscar cursos..."
                        class="w-full bg-div-15 border border-secondary/10 rounded-full px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/40"
                    />
                    <div class="absolute right-4 top-2.5 text-secondary/40">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Course Grid (Regular Courses) -->
            <div
                v-if="selectedCategory !== 'jornada_paulista'"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto"
            >
                <ProcessoSeletivoCursoCard
                    v-for="course in filteredCourses"
                    :key="course.id"
                    :course="course"
                    :selected-category="selectedCategory"
                    :regular-blocked="isRegularBlocked(course)"
                    :loading-elegibilidade-regulares="
                        loadingElegibilidadeRegulares
                    "
                    @enroll="handleInscricao"
                />
            </div>

            <!-- Enrollment Confirmation Modal -->
            <ProcessoSeletivoEnrollmentConfirmationModal
                :course="enrollmentConfirmation.course"
                :is-open="enrollmentConfirmation.isOpen"
                @confirm="confirmEnrollment"
                @close="closeEnrollmentConfirmation"
            />

            <!-- Editais Grid (Jornada Paulista) -->
            <div
                v-if="selectedCategory === 'jornada_paulista'"
                class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1400px] mx-auto"
            >
                <!-- Loading State -->
                <div
                    v-if="loadingEditais"
                    class="col-span-full flex justify-center py-20"
                >
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <!-- Empty State -->
                <div
                    v-else-if="editaisJnpta.length === 0"
                    class="col-span-full text-center py-20"
                >
                    <svg
                        class="w-16 h-16 mx-auto mb-4 text-secondary/40"
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
                    <p class="text-secondary font-medium">
                        Nenhum edital disponível no momento
                    </p>
                </div>

                <!-- Edital Cards -->
                <ProcessoSeletivoEditalCard
                    v-else
                    v-for="edital in editaisJnpta"
                    :key="edital.id_edital"
                    :edital="edital"
                    :jnpta-blocked="isJnptaBlockedByEnviada(edital)"
                    :has-draft="hasJnptaDraft(edital)"
                    :loading-elegibilidade-jnpta="loadingElegibilidadeJnpta"
                    @inscrever="handleInscricaoJnpta"
                    @open-edital="handleOpenEditalJnpta"
                />
            </div>
        </div>

        <template #sidebar>
            <!-- Widget: Instructions -->
            <div>
                <h4
                    class="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Instruções
                </h4>
                <p
                    class="text-[11px] text-secondary font-medium leading-relaxed mb-4"
                >
                    Para se inscrever, sigas os passos abaixo
                </p>
                <div class="space-y-2">
                    <div
                        class="flex items-center gap-3 text-[10px] font-bold text-text/80 bg-background px-3 py-2 rounded-md border border-secondary/5"
                    >
                        <span class="text-primary font-black">1.</span> Escolha
                        o tipo de candidatura
                    </div>
                    <div
                        class="flex items-center gap-3 text-[10px] font-bold text-text/80 bg-background px-3 py-2 rounded-md border border-secondary/5"
                    >
                        <span class="text-primary font-black">2.</span> Escolha
                        a área de interesse
                    </div>
                    <div
                        class="flex items-center gap-3 text-[10px] font-bold text-text/80 bg-background px-3 py-2 rounded-md border border-secondary/5"
                    >
                        <span class="text-primary font-black">3.</span> Clique
                        em "Inscrever-se"
                    </div>
                    <div
                        class="flex items-center gap-3 text-[10px] font-bold text-text/80 bg-background px-3 py-2 rounded-md border border-secondary/5"
                    >
                        <span class="text-primary font-black">4.</span> Preencha
                        os dados
                    </div>
                    <div
                        class="flex items-center gap-3 text-[10px] font-bold text-text/80 bg-background px-3 py-2 rounded-md border border-secondary/5"
                    >
                        <span class="text-primary font-black">5.</span> Clique
                        em "Enviar"
                    </div>
                    <div
                        class="flex items-center gap-3 text-[10px] font-bold text-text/80 bg-background px-3 py-2 rounded-md border border-secondary/5"
                    >
                        <span class="text-primary font-black">6.</span>
                        Acompanhe seu processo em /meus_processos
                    </div>
                </div>
            </div>

            <div class="w-full h-[1px] bg-secondary/10 my-6"></div>

            <!-- Widget: Links -->
            <div>
                <h4
                    class="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-3"
                >
                    Links Úteis
                </h4>
                <nav class="flex flex-col gap-1.5">
                    <a
                        href="https://spescoladedanca.org.br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-[11px] font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                        <span
                            class="group-hover:translate-x-1 transition-transform duration-200"
                            >→</span
                        >
                        Site São Paulo Escola de Dança
                    </a>
                </nav>
            </div>
        </template>
    </NuxtLayout>
</template>
