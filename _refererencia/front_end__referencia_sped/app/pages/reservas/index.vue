<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import { useReservasDashboard } from "../../composables/reservas/useReservasDashboard";
import { useReservasList } from "../../composables/reservas/useReservasList";
import ReservasGrid from "../../components/reservas/ReservasGrid.vue";
import ModalCriarReserva from "../../components/reservas/ModalCriarReserva.vue";
import DashboardMetrics from "../../components/reservas/DashboardMetrics.vue";
import WeeklySchedule from "../../components/reservas/WeeklySchedule.vue";
import RecentActivity from "../../components/reservas/RecentActivity.vue";
import ConfirmationModal from "../../components/ConfirmationModal.vue";
import ModalRelatorioSemanal from "../../components/reservas/ModalRelatorioSemanal.vue";

const { showToast } = useToast();
const {
    stats,
    weeklySchedule,
    recentActivity,
    isLoading: dashLoading,
    fetchDashboard,
} = useReservasDashboard();
const {
    reservas,
    isLoading: listLoading,
    pagination,
    expandedItems,
    loadingDetails,
    expandedReservas,
    fetchReservas,
    updateStatus,
    deleteReserva,
    fetchDetails,
} = useReservasList();

// ── UI state ──────────────────────────────────────────────
const activeTab = ref<"dashboard" | "reservas">("dashboard");
const buscaReservas = ref("");

// ── Modal state ───────────────────────────────────────────
const showCreateModal = ref(false);
const showDeleteConfirm = ref(false);
const itemToDelete = ref<any>(null);
const isDeleting = ref(false);
const isReportModalOpen = ref(false);

// ── Handlers ──────────────────────────────────────────────
const handleStatusUpdate = async (reserva: any, newStatus: string) => {
    try {
        await updateStatus(reserva.ids, newStatus);
        showToast(`Reserva atualizada para: ${newStatus}`, { type: "success" });
        fetchReservas(
            pagination.value.pagina_atual,
            buscaReservas.value || undefined,
        );
    } catch (e: any) {
        showToast("Erro ao atualizar status: " + e.message, { type: "error" });
    }
};

const handleDelete = (reserva: any) => {
    itemToDelete.value = {
        ...reserva,
        type: "reserva",
        nome: `Reserva de ${reserva.nome_usuario}`,
    };
    showDeleteConfirm.value = true;
};

const handleToggleExpand = async (reserva: any) => {
    const id = reserva.ids[0];
    if (expandedReservas.value.has(id)) {
        expandedReservas.value.delete(id);
    } else {
        expandedReservas.value.add(id);
        if (!expandedItems.value[id]) {
            try {
                await fetchDetails(reserva.ids);
            } catch (e: any) {
                showToast("Erro ao carregar detalhes: " + e.message, {
                    type: "error",
                });
            }
        }
    }
};

const confirmDelete = async () => {
    if (!itemToDelete.value) return;
    isDeleting.value = true;
    try {
        await deleteReserva(itemToDelete.value.ids);
        showToast("Reserva excluída com sucesso!", { type: "success" });
        fetchReservas(
            pagination.value.pagina_atual,
            buscaReservas.value || undefined,
        );
        showDeleteConfirm.value = false;
        itemToDelete.value = null;
    } catch (e: any) {
        showToast(e.message, { type: "error" });
    } finally {
        isDeleting.value = false;
    }
};

const handleSaved = () => {
    fetchReservas(
        pagination.value.pagina_atual,
        buscaReservas.value || undefined,
    );
};

// ── Wrappers ──────────────────────────────────────────────
const fetchDashboardWrapper = () => {
    fetchDashboard().catch((e: any) => {
        showToast("Erro ao carregar dashboard: " + e.message, {
            type: "error",
        });
    });
};

const fetchReservasWrapper = (page: number = 1) => {
    fetchReservas(page, buscaReservas.value || undefined).catch((e: any) => {
        showToast("Erro ao carregar reservas: " + e.message, { type: "error" });
    });
};

// ── Search debounce ───────────────────────────────────────
let searchTimeout: any;
watch(buscaReservas, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchReservasWrapper(1), 500);
});

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
    if (activeTab.value === "dashboard") fetchDashboardWrapper();
    else fetchReservasWrapper();
});

watch(activeTab, (tab) => {
    if (tab === "dashboard") fetchDashboardWrapper();
    if (tab === "reservas" && reservas.value.length === 0)
        fetchReservasWrapper();
});

definePageMeta({
    layout: false,
});
</script>

<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full relative"
        >
            <!-- HEADER -->
            <div
                class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
            >
                <div>
                    <h1 class="text-2xl font-bold text-white mb-2">
                        Reservas de Produtos
                    </h1>
                    <p class="text-secondary text-sm">
                        Gerencie reservas, retiradas e devoluções.
                    </p>
                </div>
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <button
                        @click="showCreateModal = true"
                        class="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-2 transition-colors h-[32px]"
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
                                d="M12 4v16m8-8H4"
                            ></path>
                        </svg>
                        Nova Reserva
                    </button>
                </div>
            </div>

            <!-- Tabs -->
            <div
                class="flex items-center gap-6 border-b border-secondary/10 w-full mb-8 pb-1 overflow-x-auto no-scrollbar"
            >
                <button
                    @click="activeTab = 'dashboard'"
                    class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                    :class="
                        activeTab === 'dashboard'
                            ? 'text-primary'
                            : 'text-secondary hover:text-white'
                    "
                >
                    Visão Geral
                    <span
                        v-if="activeTab === 'dashboard'"
                        class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                    ></span>
                </button>
                <button
                    @click="activeTab = 'reservas'"
                    class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                    :class="
                        activeTab === 'reservas'
                            ? 'text-primary'
                            : 'text-secondary hover:text-white'
                    "
                >
                    Todas as Reservas
                    <span
                        v-if="activeTab === 'reservas'"
                        class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                    ></span>
                </button>
            </div>

            <!-- CONTENT -->
            <div>
                <!-- Dashboard Tab -->
                <div v-if="activeTab === 'dashboard'">
                    <div v-if="dashLoading" class="flex justify-center py-20">
                        <svg
                            class="animate-spin h-8 w-8 text-primary"
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
                    <div v-else class="flex flex-col h-full">
                        <WeeklySchedule
                            :events="weeklySchedule"
                            class="h-full"
                        />
                    </div>
                </div>

                <!-- Reservas Tab -->
                <ReservasGrid
                    v-if="activeTab === 'reservas'"
                    v-model:busca="buscaReservas"
                    :reservas="reservas"
                    :is-loading="listLoading"
                    :pagination="pagination"
                    :expanded-reservas="expandedReservas"
                    :expanded-items="expandedItems"
                    :loading-details="loadingDetails"
                    @status-update="handleStatusUpdate"
                    @delete="handleDelete"
                    @toggle-expand="handleToggleExpand"
                    @page-change="fetchReservasWrapper"
                />
            </div>

            <!-- Create Modal -->
            <ModalCriarReserva
                :isOpen="showCreateModal"
                @close="showCreateModal = false"
                @saved="handleSaved"
            />

            <!-- Delete Confirmation -->
            <ConfirmationModal
                :isOpen="showDeleteConfirm"
                title="Excluir Item"
                :message="`Tem certeza que deseja excluir '${itemToDelete?.nome}'? Esta ação não pode ser desfeita.`"
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                :loading="isDeleting"
                @close="showDeleteConfirm = false"
                @confirm="confirmDelete"
            />

            <!-- Report Modal -->
            <ModalRelatorioSemanal
                :isOpen="isReportModalOpen"
                @close="isReportModalOpen = false"
            />
        </div>

        <template #sidebar>
            <div class="space-y-6">
                <div class="bg-[#16161E] border border-white/5 rounded-xl p-4">
                    <h3
                        class="text-xs font-bold text-secondary uppercase tracking-wider mb-4"
                    >
                        Ações Rápidas
                    </h3>
                    <button
                        @click="isReportModalOpen = true"
                        class="w-full bg-white/5 hover:bg-white/10 text-xs font-bold text-secondary hover:text-white py-3 px-4 rounded-lg border border-white/5 transition-colors flex items-center justify-between group"
                    >
                        <span>Relatório Semanal</span>
                        <svg
                            class="w-4 h-4 opacity-50 group-hover:opacity-100"
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
                <DashboardMetrics :stats="stats" class="!grid-cols-2" />
                <RecentActivity :activity="recentActivity" />
            </div>
        </template>
    </NuxtLayout>
</template>
