<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import { useMeusProcessos } from "../../composables/meus-processos/useMeusProcessos";
import ModalMeusDocumentos from "../../components/meus-processos/ModalMeusDocumentos.vue";
import ProcessoCard from "../../components/meus-processos/ProcessoCard.vue";
import JornadaCard from "../../components/meus-processos/JornadaCard.vue";

import { toZonedTime } from "date-fns-tz";

definePageMeta({
    layout: false,
});

const { showToast } = useToast();
const appStore = useAppStore();

// Composables
const { processos, jornadas, isLoading, fetchProcessos } = useMeusProcessos();

// UI State
const showModal = ref(false);
const selectedProcesso = ref<any>(null);

// Computed Stats
const areaStats = computed(() => {
    const stats: Record<string, number> = {};
    processos.value.forEach((p) => {
        const area = p.area_normalizada || "Outros";
        stats[area] = (stats[area] || 0) + 1;
    });
    return stats;
});

// Check Enrollment Availability
const canShowEnrollment = (proc: any) => {
    // 1. Check Course Area
    if (proc.area_curso === "extensao") return false;

    // 2. Check Status
    if (proc.status_processo !== "Aprovado") return false;

    // 3. Check Date Range (Sao Paulo Time)
    const timeZone = "America/Sao_Paulo";
    const now = toZonedTime(new Date(), timeZone);

    // Use exceptional dates if enabled, otherwise use default turma dates
    let startDate, endDate;
    if (proc.matricula_suplente && proc.dt_ini_mat_sup && proc.dt_fim_mat_sup) {
        startDate = toZonedTime(new Date(proc.dt_ini_mat_sup), timeZone);
        endDate = toZonedTime(new Date(proc.dt_fim_mat_sup), timeZone);
    } else {
        if (!proc.dt_ini_mat || !proc.dt_fim_mat) return false;
        startDate = toZonedTime(new Date(proc.dt_ini_mat), timeZone);
        endDate = toZonedTime(new Date(proc.dt_fim_mat), timeZone);
    }

    return now >= startDate && now <= endDate;
};

const openJornadaFormulario = (item: any) => {
    if (!item?.id_edital) return;

    const path =
        item.qual_tempo === "primeiro_tempo"
            ? `/inscricao/jornadas/primeiro-tempo/${item.id_edital}`
            : `/inscricao/jornadas/${item.id_edital}`;

    navigateTo(path);
};

// Handlers
const handleEnrollment = (proc: any) => {
    navigateTo({
        path: `/inscricao/${proc.id_turma}`,
        query: {
            tipo: proc.tipo_candidatura,
            area: proc.area_curso,
            processo: "matricula",
        },
    });
};

// Handlers
const openDocumentModal = (processo: any) => {
    selectedProcesso.value = processo;
    showModal.value = true;
};

// Lifecycle
onMounted(async () => {
    await appStore.refreshHash();
    try {
        await fetchProcessos();
    } catch {
        showToast("Erro ao carregar suas inscrições", { type: "error" });
    }
});
</script>

<template>
    <NuxtLayout name="base">
        <div>
            <!-- Header Removed in previous step -->

            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                ></div>
            </div>

            <!-- Empty State -->
            <div
                v-else-if="processos.length === 0 && jornadas.length === 0"
                class="bg-div-15 rounded-xl p-8 text-center border border-white/5"
            >
                <div class="text-5xl mb-4">📂</div>
                <h3 class="text-xl font-bold text-white mb-2">
                    Nenhuma inscrição encontrada
                </h3>
                <p class="text-secondary-400 text-sm">
                    Você ainda não se inscreveu em nenhum curso.
                </p>
                <NuxtLink
                    to="/selecao/estudante/extensao"
                    class="inline-block mt-4 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors"
                >
                    Ver Cursos Disponíveis
                </NuxtLink>
            </div>

            <!-- List -->
            <div v-else class="space-y-6">
                <div v-if="processos.length > 0" class="grid gap-3">
                    <ProcessoCard
                        v-for="proc in processos"
                        :key="proc.id_processo"
                        :processo="proc"
                        :can-enroll="canShowEnrollment(proc)"
                        @enroll="handleEnrollment"
                        @open-documents="openDocumentModal"
                    />
                </div>

                <div v-if="jornadas.length > 0" class="space-y-3">
                    <div class="pt-2 border-t border-white/10">
                        <h2
                            class="text-sm md:text-base font-black text-white uppercase tracking-[0.2em]"
                        >
                            Jornadas Paulista de Dança
                        </h2>
                    </div>

                    <div class="grid gap-3">
                        <JornadaCard
                            v-for="item in jornadas"
                            :key="item.id_candidatura"
                            :jornada="item"
                            @continue-form="openJornadaFormulario"
                        />
                    </div>
                </div>
            </div>

            <!-- Modal -->
            <ModalMeusDocumentos
                :isOpen="showModal"
                :processo="selectedProcesso"
                @close="showModal = false"
            />
        </div>

        <!-- Sidebar Slot -->
        <template #sidebar>
            <!-- Widget: Instructions -->
            <div>
                <h4
                    class="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Instruções
                </h4>

                <div class="space-y-4">
                    <div
                        class="bg-div-30/50 p-3 rounded-lg border border-secondary/5"
                    >
                        <p
                            class="text-[11px] font-bold text-white mb-1 flex items-center gap-2"
                        >
                            <span
                                class="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center text-[9px]"
                                >1</span
                            >
                            Verificar Inscrições
                        </p>
                        <p
                            class="text-[10px] text-secondary leading-relaxed pl-6"
                        >
                            Use o botão
                            <strong class="text-white">Ver Documentos</strong>
                            para visualizar e conferir os arquivos que você já
                            enviou.
                        </p>
                    </div>

                    <div
                        class="bg-red-500/5 p-3 rounded-lg border border-red-500/10"
                    >
                        <p
                            class="text-[11px] font-bold text-red-400 mb-1 flex items-center gap-2"
                        >
                            <span
                                class="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[9px]"
                                >2</span
                            >
                            Pendências
                        </p>
                        <p
                            class="text-[10px] text-secondary leading-relaxed pl-6"
                        >
                            Caso tenha alguma pendência, você verá um botão
                            <strong class="text-red-400">Corrigir</strong>.
                            Basta clicar e reenviar o documento solicitado.
                        </p>
                    </div>
                </div>
            </div>

            <div class="w-full h-[1px] bg-secondary/10 my-6"></div>

            <!-- Widget: Stats Dashboard -->
            <div>
                <h4
                    class="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-4"
                >
                    Resumo por Área
                </h4>
                <!-- Stats Grid -->
                <div class="grid grid-cols-1 gap-2">
                    <div
                        v-for="(count, area) in areaStats"
                        :key="area"
                        class="bg-div-30 p-3 rounded-lg border border-secondary/5 flex items-center justify-between group hover:border-primary/20 transition-all"
                    >
                        <span
                            class="text-[11px] font-bold text-secondary group-hover:text-primary transition-colors capitalize"
                            >{{ area }}</span
                        >
                        <span
                            class="text-md font-black text-white bg-background px-2 py-0.5 rounded border border-white/5"
                            >{{ count }}</span
                        >
                    </div>
                </div>
                <!-- Total -->
                <div
                    class="mt-3 pt-3 border-t border-secondary/5 flex items-center justify-between text-xs"
                >
                    <span class="font-bold text-secondary"
                        >Total de Inscrições</span
                    >
                    <span class="font-black text-primary">{{
                        processos.length + jornadas.length
                    }}</span>
                </div>
            </div>
        </template>
    </NuxtLayout>
</template>
