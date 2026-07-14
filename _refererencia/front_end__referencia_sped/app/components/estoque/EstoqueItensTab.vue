<script setup lang="ts">
defineProps<{
  itens: any[];
  isLoading: boolean;
  pagination: { pagina_atual: number; qtd_paginas: number; qtd_itens: number };
}>();

const busca = defineModel<string>("busca", { default: "" });

const emit = defineEmits<{
  (e: "avarias", item: any): void;
  (e: "delete", item: any): void;
  (e: "pageChange", page: number): void;
}>();

// Pure utility functions — duplicated from composable (same pattern as CalendarioGrid)
const hasActiveAvaria = (avarias: any[]) => {
  if (!avarias || avarias.length === 0) return false;
  return avarias.some(
    (a: any) => !["Reparado", "Não se Aplica", "Descartado"].includes(a.status_reparo)
  );
};

const getActiveAvariaStatus = (item: any) => {
  if (!item.avarias || !Array.isArray(item.avarias)) return "AVARIA";
  const active = item.avarias.find((a: any) =>
    ["Pendente", "Em Reparo", "Descartado"].includes(a.status_reparo)
  );
  return active ? active.status_reparo : "AVARIA";
};
</script>

<template>
  <div>
    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <input
          v-model="busca"
          type="text"
          placeholder="Buscar itens em estoque por nome do produto..."
          class="w-full bg-[#16161E] border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 transition-colors"
        />
        <div class="absolute left-4 top-3.5 text-secondary/50">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && itens.length === 0" class="py-20 flex justify-center">
      <svg
        class="animate-spin h-8 w-8 text-primary"
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Empty -->
    <div v-else-if="itens.length === 0" class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl">
      <div class="text-4xl mb-4 text-secondary/50">
        <svg class="w-16 h-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
      </div>
      <p class="text-white font-medium">Nenhum item de estoque encontrado</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="item in itens"
        :key="item.id"
        class="bg-[#16161E] border border-white/5 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/50 transition-colors"
      >
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-bold text-white text-sm line-clamp-2 leading-tight">
              {{ item.produto?.nome || 'Produto Desconhecido' }}
            </h4>
            <span class="text-[10px] uppercase font-bold text-secondary mt-1 block">
              ID: {{ item.id.split('-')[0] }}
            </span>
          </div>
          <div class="bg-white/5 rounded px-2 py-1">
            <p class="text-[10px] font-mono text-secondary">
              {{ item.produto?.codigo_barras || 'S/N' }}
            </p>
          </div>
        </div>

        <!-- Status -->
        <div class="flex items-center gap-2 flex-wrap mt-auto pt-2 border-t border-white/5">
          <div
            v-if="hasActiveAvaria(item.avarias)"
            class="flex items-center gap-1 text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
          >
            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span class="text-[10px] font-bold uppercase">
              {{ item.status_item }} / {{ getActiveAvariaStatus(item) }}
            </span>
          </div>

          <span
            v-else
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
            :class="item.status_item === 'disponível' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-secondary border-white/10'"
          >
            {{ item.status_item }}
          </span>
        </div>

        <!-- Action -->
        <button
          @click="emit('avarias', item)"
          class="w-full bg-white/5 hover:bg-white/10 text-secondary hover:text-white border border-white/10 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Gerenciar Avarias
        </button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="itens.length > 0" class="flex flex-col md:flex-row items-center justify-between gap-3 mt-8 pt-4 border-t border-white/5">
      <span class="text-xs md:text-sm text-secondary-500 order-2 md:order-1">
        <span class="font-medium text-white">{{ (pagination.pagina_atual - 1) * 12 + 1 }}</span>
        a <span class="font-medium text-white">{{ Math.min(pagination.pagina_atual * 12, pagination.qtd_itens) }}</span>
        de <span class="font-medium text-white">{{ pagination.qtd_itens }}</span>
      </span>
      <div class="flex gap-2 order-1 md:order-2">
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
