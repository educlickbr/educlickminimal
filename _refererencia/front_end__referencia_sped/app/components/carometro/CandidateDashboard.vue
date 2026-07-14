<script setup lang="ts">
import ModalEmailBulk from "../ModalEmailBulk.vue";
import { getAnoSemestre } from "../../../utils/ano_semestre";

const route = useRoute();

const props = withDefaults(
    defineProps<{
        candidatos: any[];
        totalCount: number;
        statsData?: Record<string, any>; // Optional stats data from backend
        // Props for Bulk Email
        availableTurmas?: any[];
        availableAreas?: any[];
        currentAnoSemestre?: string;
        isExcelLoading?: boolean;
        isExcelAllLoading?: boolean;
        isWeeklyReportLoading?: boolean;
        isWeeklyReportModalLoading?: boolean;
        showExcelExport?: boolean;
        isRelatorioAtribuicaoLoading?: boolean;
        showRelatorioAtribuicao?: boolean;
        relatorioAtribuicaoLabel?: string;
        relatorioAtribuicaoHint?: string;
        showListaAlunos?: boolean;
    }>(),
    {
        showExcelExport: false,
        relatorioAtribuicaoLabel: "Relatório",
        relatorioAtribuicaoHint: "Atribuições e status",
        showListaAlunos: false,
    },
);

const emit = defineEmits([
    "send-bulk-email",
    "export-excel",
    "export-excel-all-courses",
    "export-weekly-report-pdf",
    "open-weekly-report-modal",
    "open-relatorio-atribuicao",
    "open-lista-alunos",
]);

const showBulkEmailModal = ref(false);

const normalizeText = (value: unknown) => {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
};

const isPositivePcdAnswer = (value: unknown) => {
    const normalized = normalizeText(value);
    return normalized === "sim" || normalized === "s";
};

const handleOpenBulkEmail = () => {
    showBulkEmailModal.value = true;
};

const handleSendBulkEmail = (payload: any) => {
    emit("send-bulk-email", payload);
    showBulkEmailModal.value = false;
};

// Compute statistics from candidates
const stats = computed(() => {
    // If statsData is provided, use it
    if (props.statsData) {
        const total = props.statsData.total || props.totalCount || 0;

        // PCD Stats from server data
        // Expecting statsData.pcd to be object like { "Sim": 5, "Não": 100 }
        const pcdCount = Object.entries(props.statsData.pcd || {}).reduce(
            (acc, [label, count]) => {
                return isPositivePcdAnswer(label)
                    ? acc + Number(count || 0)
                    : acc;
            },
            0,
        );
        const pcdPercentage =
            total > 0 ? Math.round((pcdCount / total) * 100) : 0;

        const processStats = (data: Record<string, number> = {}) => {
            return Object.entries(data)
                .map(([name, count]) => ({
                    name: name || "Não informado",
                    count: count as number,
                    percentage:
                        total > 0
                            ? Math.round(((count as number) / total) * 100)
                            : 0,
                }))
                .sort((a, b) => b.count - a.count);
        };

        return {
            pcdCount,
            pcdPercentage,
            genderData: processStats(props.statsData.genero),
            raceData: processStats(props.statsData.raca),
            incomeData: processStats(props.statsData.renda),
        };
    }

    // Fallback: Legacy behavior (Client-side from candidatos array)
    const all = props.candidatos;

    // PCD Stats
    const pcdCount = all.filter((c) => isPositivePcdAnswer(c.pcd)).length;
    const pcdPercentage =
        all.length > 0 ? Math.round((pcdCount / all.length) * 100) : 0;

    // Gender distribution
    const genderCounts = all.reduce(
        (acc, c) => {
            const g = c.genero || "Não informado";
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    const genderData = Object.entries(genderCounts)
        .map(([name, count]) => ({
            name,
            count: count as number,
            percentage: Math.round(((count as number) / all.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    // Race distribution
    const raceCounts = all.reduce(
        (acc, c) => {
            const r = c.raca || "Não informado";
            acc[r] = (acc[r] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    const raceData = Object.entries(raceCounts)
        .map(([name, count]) => ({
            name,
            count: count as number,
            percentage: Math.round(((count as number) / all.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    // Income distribution
    const incomeCounts = all.reduce(
        (acc, c) => {
            const i = c.renda || "Não informado";
            acc[i] = (acc[i] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    const incomeData = Object.entries(incomeCounts)
        .map(([name, count]) => ({
            name,
            count: count as number,
            percentage: Math.round(((count as number) / all.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    return {
        pcdCount,
        pcdPercentage,
        genderData,
        raceData,
        incomeData,
    };
});
</script>

<template>
    <div class="space-y-4">
        <!-- Bulk Email Button -->
        <!-- Bulk Email Button -->
        <!-- Actions -->
        <div class="space-y-2">
            <!-- Bulk Email -->
            <button
                v-if="
                    !route.path.includes('/selecao/estudante') &&
                    !route.path.includes('/bolsas/admin') &&
                    !route.path.includes('/carometro')
                "
                @click="handleOpenBulkEmail"
                class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"
            >
                <span>Email Geral</span>
                <svg
                    class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                </svg>
            </button>

            <!-- Excel Export -->
            <button
                v-if="showExcelExport"
                @click="emit('export-excel')"
                :disabled="
                    isExcelLoading || isExcelAllLoading || isWeeklyReportLoading
                "
                class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div class="flex flex-col items-start">
                    <span>{{
                        isExcelLoading ? "Baixando..." : "Baixar Excel"
                    }}</span>
                </div>
                <div
                    v-if="isExcelLoading"
                    class="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"
                ></div>
                <svg
                    v-else
                    class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                </svg>
            </button>

            <!-- Lista de Alunos -->
            <button
                v-if="showListaAlunos"
                @click="emit('open-lista-alunos')"
                class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"
            >
                <div class="flex flex-col items-start">
                    <span>Lista de Alunos</span>
                    <span class="text-[10px] text-secondary-500"
                        >Gerar lista para impressão</span
                    >
                </div>
                <svg
                    class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    ></path>
                </svg>
            </button>

            <button
                v-if="route.path.includes('/selecao/estudante')"
                @click="emit('export-excel-all-courses')"
                :disabled="
                    isExcelLoading || isExcelAllLoading || isWeeklyReportLoading
                "
                class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div class="flex flex-col items-start">
                    <span>{{
                        isExcelAllLoading
                            ? "Baixando..."
                            : "Baixar Excel (Todos os Cursos)"
                    }}</span>
                    <span class="text-[10px] text-secondary-500"
                        >Mesmo período e aba, sem depender da turma</span
                    >
                </div>
                <div
                    v-if="isExcelAllLoading"
                    class="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"
                ></div>
                <svg
                    v-else
                    class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                </svg>
            </button>

            <button
                v-if="route.path.includes('/selecao/estudante')"
                @click="emit('open-weekly-report-modal')"
                :disabled="
                    isExcelLoading ||
                    isExcelAllLoading ||
                    isWeeklyReportLoading ||
                    isWeeklyReportModalLoading
                "
                class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div class="flex flex-col items-start">
                    <span>{{
                        isWeeklyReportModalLoading
                            ? "Carregando painel..."
                            : "Relatório Inscrições"
                    }}</span>
                    <span class="text-[10px] text-secondary-500"
                        >Visualização no app com os mesmos dados do PDF</span
                    >
                </div>
                <div
                    v-if="isWeeklyReportModalLoading"
                    class="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"
                ></div>
                <svg
                    v-else
                    class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14 3h7m0 0v7m0-7L10 14"
                    ></path>
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 5h5M5 10h8M5 15h8M5 20h14"
                    ></path>
                </svg>
            </button>

            <button
                v-if="route.path.includes('/selecao/estudante')"
                @click="emit('export-weekly-report-pdf')"
                :disabled="
                    isExcelLoading || isExcelAllLoading || isWeeklyReportLoading
                "
                class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div class="flex flex-col items-start">
                    <span>{{
                        isWeeklyReportLoading
                            ? "Gerando PDF..."
                            : "Relatório Inscrições (PDF)"
                    }}</span>
                    <span class="text-[10px] text-secondary-500"
                        >Semanas por turma com totais por dia</span
                    >
                </div>
                <div
                    v-if="isWeeklyReportLoading"
                    class="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"
                ></div>
                <svg
                    v-else
                    class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 7h10M7 11h10M7 15h6m5 4H6a2 2 0 01-2-2V7a2 2 0 012-2h8l6 6v6a2 2 0 01-2 2z"
                    ></path>
                </svg>
            </button>

            <!-- Relatório Atribuição (Bolsas) -->
            <button
                v-if="showRelatorioAtribuicao ?? false"
                @click="emit('open-relatorio-atribuicao')"
                :disabled="isRelatorioAtribuicaoLoading"
                class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div class="flex flex-col items-start">
                    <span>{{
                        isRelatorioAtribuicaoLoading
                            ? "Carregando..."
                            : relatorioAtribuicaoLabel
                    }}</span>
                    <span class="text-[10px] text-secondary-500">{{
                        relatorioAtribuicaoHint
                    }}</span>
                </div>
                <div
                    v-if="isRelatorioAtribuicaoLoading"
                    class="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"
                ></div>
                <svg
                    v-else
                    class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                </svg>
            </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-3">
            <!-- Total -->
            <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
                <div
                    class="text-[10px] text-secondary-600 uppercase tracking-wide mb-1"
                >
                    Total
                </div>
                <div class="text-2xl font-bold text-white">
                    {{ totalCount }}
                </div>
                <div class="text-[10px] text-gray-500 mt-0.5">candidatos</div>
            </div>

            <!-- PCD -->
            <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
                <div
                    class="text-[10px] text-secondary-600 uppercase tracking-wide mb-1"
                >
                    PCD
                </div>
                <div class="text-2xl font-bold text-blue-400">
                    {{ stats.pcdPercentage }}%
                </div>
                <div class="text-[10px] text-gray-500 mt-0.5">
                    {{ stats.pcdCount }} pessoas
                </div>
            </div>
        </div>

        <!-- Gender Distribution -->
        <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
            <div class="text-xs font-semibold text-white mb-3">
                Identidade de Gênero
            </div>
            <div class="space-y-2">
                <div
                    v-for="item in stats.genderData"
                    :key="item.name"
                    class="space-y-1"
                >
                    <div class="flex justify-between text-[10px]">
                        <span class="text-gray-400 truncate">{{
                            item.name
                        }}</span>
                        <span class="text-white font-medium">{{
                            item.count
                        }}</span>
                    </div>
                    <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-gradient-to-r from-primary to-primary rounded-full transition-all"
                            :style="{ width: item.percentage + '%' }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Race Distribution -->
        <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
            <div class="text-xs font-semibold text-white mb-3">Raça/Cor</div>
            <div class="space-y-2">
                <div
                    v-for="item in stats.raceData"
                    :key="item.name"
                    class="space-y-1"
                >
                    <div class="flex justify-between text-[10px]">
                        <span class="text-gray-400 truncate">{{
                            item.name
                        }}</span>
                        <span class="text-white font-medium">{{
                            item.count
                        }}</span>
                    </div>
                    <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                            :style="{ width: item.percentage + '%' }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Income Distribution -->
        <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
            <div class="text-xs font-semibold text-white mb-3">
                Renda Familiar
            </div>
            <div class="space-y-2">
                <div
                    v-for="item in stats.incomeData"
                    :key="item.name"
                    class="space-y-1"
                >
                    <div class="flex justify-between text-[10px]">
                        <span class="text-gray-400 truncate text-[9px]">{{
                            item.name
                        }}</span>
                        <span class="text-white font-medium">{{
                            item.count
                        }}</span>
                    </div>
                    <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                            :style="{ width: item.percentage + '%' }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <ModalEmailBulk
            :isOpen="showBulkEmailModal"
            :availableAreas="availableAreas || []"
            :currentAnoSemestre="currentAnoSemestre || getAnoSemestre()"
            @close="showBulkEmailModal = false"
            @send="handleSendBulkEmail"
        />
    </div>
</template>
