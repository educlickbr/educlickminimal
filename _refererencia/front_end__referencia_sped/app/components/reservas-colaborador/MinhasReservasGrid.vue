<script setup lang="ts">
const props = defineProps<{
  reservas: any[];
  isLoading: boolean;
  pagination: { pagina_atual: number; qtd_paginas: number; qtd_itens: number };
  expandedReservas: Set<string>;
  expandedItems: Record<string, any[]>;
  loadingDetails: Record<string, boolean>;
  filterStatus: string;
}>();

const busca = defineModel<string>("busca", { default: "" });

const emit = defineEmits<{
  (e: "search"): void;
  (e: "filterChange", status: string): void;
  (e: "delete", reserva: any): void;
  (e: "toggleExpand", reserva: any): void;
  (e: "pageChange", page: number): void;
}>();

const showFilters = ref(false);

const isExpanded = (reserva: any) => {
  return props.expandedReservas.has(reserva.ids[0]);
};

const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    reservado: "Reservado",
    retirado: "Retirado",
    devolvido: "Devolvido",
    cancelado: "Cancelado",
    atrasado: "Atrasado",
  };
  return map[status] || status;
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    reservado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    retirado: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    devolvido: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    cancelado: "bg-red-500/10 text-red-500 border-red-500/20",
    atrasado: "bg-red-600/10 text-red-600 border-red-600/20",
  };
  return map[status] || "bg-white/5 text-secondary border-white/5";
};

const translateItemStatus = (status: string) => {
  const map: Record<string, string> = {
    disponivel: "Disponivel",
    reservado: "Reservado",
    retirado: "Retirado",
    devolvido: "Devolvido",
    indisponivel: "Indisponivel",
    manutencao: "Manutencao",
  };
  return map[status] || status || "Indefinido";
};

const getItemStatusColor = (status: string) => {
  const map: Record<string, string> = {
    disponivel: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    reservado: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    retirado: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    devolvido: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    indisponivel: "bg-red-500/10 text-red-400 border-red-500/20",
    manutencao: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return map[status] || "bg-white/5 text-secondary border-white/10";
};
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="mb-6 flex flex-col md:flex-row gap-4 items-center">
      <div class="relative flex-1 w-full">
        <input
          v-model="busca"
          @input="emit('search')"
          type="text"
          placeholder="Buscar produto..."
          class="w-full bg-[#16161E] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none transition-colors"
        />
        <svg
          class="w-4 h-4 text-secondary absolute left-3.5 top-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>

      <div class="relative">
        <button
          @click="showFilters = !showFilters"
          class="px-4 py-2.5 bg-[#16161E] border border-white/5 rounded-lg text-xs font-bold text-secondary hover:text-white flex items-center gap-2 transition-colors"
          :class="filterStatus ? 'text-primary border-primary/30 bg-primary/5' : ''"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
          {{ filterStatus ? translateStatus(filterStatus) : "Filtrar Status" }}
        </button>

        <div
          v-if="showFilters"
          class="absolute right-0 top-full mt-2 w-48 bg-[#1E1E26] border border-white/10 rounded-lg shadow-xl z-20 py-2"
        >
          <button @click="emit('filterChange', ''); showFilters = false" class="w-full text-left px-4 py-2 text-xs font-medium text-secondary hover:text-white hover:bg-white/5">Todos</button>
          <button @click="emit('filterChange', 'reservado'); showFilters = false" class="w-full text-left px-4 py-2 text-xs font-medium text-secondary hover:text-white hover:bg-white/5">Reservados</button>
          <button @click="emit('filterChange', 'retirado'); showFilters = false" class="w-full text-left px-4 py-2 text-xs font-medium text-secondary hover:text-white hover:bg-white/5">Retirados</button>
          <button @click="emit('filterChange', 'devolvido'); showFilters = false" class="w-full text-left px-4 py-2 text-xs font-medium text-secondary hover:text-white hover:bg-white/5">Devolvidos</button>
          <button @click="emit('filterChange', 'atrasado'); showFilters = false" class="w-full text-left px-4 py-2 text-xs font-medium text-secondary hover:text-white hover:bg-white/5">Atrasados</button>
          <button @click="emit('filterChange', 'cancelado'); showFilters = false" class="w-full text-left px-4 py-2 text-xs font-medium text-secondary hover:text-white hover:bg-white/5">Cancelados</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Empty -->
    <div v-else-if="reservas.length === 0" class="flex flex-col items-center justify-center py-20 opacity-50">
      <svg class="w-12 h-12 mb-4 text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
      </svg>
      <p class="text-secondary font-medium text-sm">Nenhuma reserva encontrada.</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      <div
        v-for="reserva in reservas"
        :key="reserva.ids[0]"
        class="bg-[#16161E] border border-white/5 rounded-xl p-0 hover:border-primary/20 transition-all group overflow-hidden flex flex-col w-full min-w-0"
        :class="reservas.length === 1 ? 'md:col-span-2' : ''"
      >
        <div class="p-4 flex items-start gap-4 border-b border-white/5 pb-4">
          <div class="w-12 h-12 rounded-lg bg-div-30 shrink-0 overflow-hidden border border-white/5">
            <img v-if="reserva.imagem" :src="reserva.imagem" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-xs font-bold text-secondary">IMG</div>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white leading-tight mb-1">{{ reserva.produto_nome }}</h3>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border" :class="getStatusColor(reserva.status)">
                {{ translateStatus(reserva.status) }}
              </span>
              <span class="text-[10px] text-secondary font-medium">{{ reserva.qtd_itens }} un.</span>
            </div>
          </div>
        </div>

        <div class="p-4 space-y-2 flex-1">
          <div class="flex justify-between items-center text-xs">
            <span class="text-secondary">Retirada</span>
            <span class="text-white font-medium">{{ reserva.data_retirada ? new Date(reserva.data_retirada).toLocaleDateString() : "-" }}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-secondary">Devolução</span>
            <span class="text-white font-medium">{{ reserva.data_devolucao ? new Date(reserva.data_devolucao).toLocaleDateString() : "-" }}</span>
          </div>
          <div v-if="reserva.data_devolvido" class="flex justify-between items-center text-xs text-emerald-500/80 mt-1">
            <span>Entregue em</span>
            <span class="font-medium">{{ new Date(reserva.data_devolvido).toLocaleDateString() }}</span>
          </div>
        </div>

        <div class="p-3 bg-white/5 flex items-center justify-between gap-2">
          <button @click="emit('toggleExpand', reserva)" class="text-[10px] font-bold text-secondary hover:text-white transition-colors flex items-center gap-1">
            Detalhes
            <svg class="w-3 h-3 transition-transform" :class="isExpanded(reserva) ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <button @click="emit('delete', reserva)" class="text-[10px] font-bold text-red-500/70 hover:text-red-500 transition-colors flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Excluir
          </button>
        </div>

        <!-- Expanded Details -->
        <div v-if="isExpanded(reserva)" class="border-t border-white/5 bg-[#0f0f15] p-4 text-xs">
          <div v-if="loadingDetails[reserva.ids[0]]" class="flex justify-center p-2">
            <svg class="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              v-for="item in expandedItems[reserva.ids[0]] || []"
              :key="item.id"
              class="rounded-lg border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 transition-colors"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold text-white leading-tight truncate">{{ reserva.produto_nome }}</p>
                  <p class="text-[10px] text-secondary/80">Item reservado</p>
                </div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border" :class="getStatusColor(item.status)">
                  {{ translateStatus(item.status) }}
                </span>
              </div>
              <div class="space-y-1.5 text-[10px]">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-secondary">Status do item</span>
                  <span class="px-1.5 py-0.5 rounded border font-semibold" :class="getItemStatusColor(item.status_item)">
                    {{ translateItemStatus(item.status_item) }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-secondary">Codigo de barras</span>
                  <span class="text-primary font-mono break-all text-right">{{ item.codigo_barras || "Sem codigo" }}</span>
                </div>
                <div class="flex items-start justify-between gap-2">
                  <span class="text-secondary shrink-0">ID completo</span>
                  <span class="text-white/90 font-mono break-all text-right">{{ item.id }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.qtd_paginas > 1" class="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
      <span class="text-xs text-secondary">Página {{ pagination.pagina_atual }} de {{ pagination.qtd_paginas }}</span>
      <div class="flex gap-2">
        <button
          @click="emit('pageChange', pagination.pagina_atual - 1)"
          :disabled="pagination.pagina_atual === 1"
          class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          @click="emit('pageChange', pagination.pagina_atual + 1)"
          :disabled="pagination.pagina_atual >= pagination.qtd_paginas"
          class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>
