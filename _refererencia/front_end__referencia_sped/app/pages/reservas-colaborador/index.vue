<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import { useMinhasReservas } from "../../composables/reservas-colaborador/useMinhasReservas";
import MinhasReservasGrid from "../../components/reservas-colaborador/MinhasReservasGrid.vue";
import CollaboratorReservationModal from "../../components/reservas-colaborador/CollaboratorReservationModal.vue";
import InventarioModal from "../../components/estoque/InventarioModal.vue";
import ConfirmationModal from "../../components/ConfirmationModal.vue";

const user = useSupabaseUser();
const { showToast } = useToast();

// ── Composable (lazy init com userId) ────────────────────
const userId = computed(() => user.value?.id || "");
const {
  reservas,
  isLoading,
  pagination,
  expandedItems,
  loadingDetails,
  expandedReservas,
  fetchReservas,
  deleteReserva,
  fetchDetails,
} = useMinhasReservas(userId.value);

// ── UI state ──────────────────────────────────────────────
const buscaReservas = ref("");
const filterStatus = ref("");

// ── Modal state ───────────────────────────────────────────
const showCreateModal = ref(false);
const showInventarioModal = ref(false);
const showDeleteConfirm = ref(false);
const itemToDelete = ref<any>(null);
const isDeleting = ref(false);

// ── Handlers ──────────────────────────────────────────────
const handleSearch = () => {
  if (!userId.value) return;
  fetchReservas(1, buscaReservas.value || undefined, filterStatus.value || undefined);
};

const handleFilterChange = (status: string) => {
  filterStatus.value = status;
  handleSearch();
};

const handleDelete = (reserva: any) => {
  itemToDelete.value = { ...reserva, type: "reserva", nome: reserva.produto_nome };
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
        showToast("Erro ao carregar detalhes: " + e.message, { type: "error" });
      }
    }
  }
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    await deleteReserva(itemToDelete.value.ids);
    showToast("Reserva excluída com sucesso", { type: "success" });
    showDeleteConfirm.value = false;
    fetchReservas(pagination.value.pagina_atual, buscaReservas.value || undefined, filterStatus.value || undefined);
  } catch (e: any) {
    showToast("Erro ao excluir: " + e.message, { type: "error" });
  } finally {
    isDeleting.value = false;
    itemToDelete.value = null;
  }
};

const handleSaved = () => {
  fetchReservas(1, buscaReservas.value || undefined, filterStatus.value || undefined);
};

// ── Pagination (fica na página) ───────────────────────────
const changePage = (p: number) => {
  if (p >= 1 && p <= pagination.value.qtd_paginas) {
    fetchReservas(p, buscaReservas.value || undefined, filterStatus.value || undefined);
  }
};

// ── Lifecycle ─────────────────────────────────────────────
watch(userId, (id) => {
  if (id) fetchReservas(1);
});

onMounted(() => {
  if (userId.value) fetchReservas(1);
});

definePageMeta({
  layout: false,
});
</script>

<template>
  <NuxtLayout name="base">
    <div class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full relative">
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-bold text-white mb-1">Minhas Reservas</h2>
          <p class="text-xs text-secondary font-medium">Acompanhe e gerencie seus equipamentos.</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="showCreateModal = true"
            class="bg-primary hover:bg-primary-600 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2 group"
          >
            <svg class="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Nova Reserva
          </button>
        </div>
      </div>

      <!-- Grid -->
      <MinhasReservasGrid
        v-model:busca="buscaReservas"
        :reservas="reservas"
        :is-loading="isLoading"
        :pagination="pagination"
        :expanded-reservas="expandedReservas"
        :expanded-items="expandedItems"
        :loading-details="loadingDetails"
        :filter-status="filterStatus"
        @search="handleSearch"
        @filter-change="handleFilterChange"
        @delete="handleDelete"
        @toggle-expand="handleToggleExpand"
        @page-change="changePage"
      />

      <!-- Delete Modal -->
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
    </div>

    <!-- Modals -->
    <CollaboratorReservationModal
      :isOpen="showCreateModal"
      @close="showCreateModal = false"
      @saved="handleSaved"
    />
    <InventarioModal
      :isOpen="showInventarioModal"
      @close="showInventarioModal = false"
    />

    <template #sidebar>
      <div class="space-y-6">
        <div class="bg-[#16161E] border border-white/5 rounded-xl p-4">
          <h3 class="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Ações Rápidas</h3>
          <button
            @click="showInventarioModal = true"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-secondary hover:text-white text-xs font-bold transition-all"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            Ver Inventário
          </button>
        </div>
        <div class="bg-[#16161E] border border-white/5 rounded-xl p-4">
          <h3 class="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Instruções</h3>
          <p class="text-xs text-secondary/80 leading-relaxed">Visualize e gerencie suas solicitações de equipamentos.</p>
          <ul class="mt-4 text-xs text-secondary/70 space-y-2 list-disc pl-4">
            <li>Reservas pendentes podem ser excluídas.</li>
            <li>A retirada deve ser feita na Produção.</li>
            <li>Respeite os prazos de devolução.</li>
          </ul>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>
