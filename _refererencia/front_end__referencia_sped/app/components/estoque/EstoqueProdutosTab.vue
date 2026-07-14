<script setup lang="ts">
defineProps<{
  produtos: any[];
  isLoading: boolean;
  pagination: { pagina_atual: number; qtd_paginas: number; qtd_itens: number };
}>();

const busca = defineModel<string>("busca", { default: "" });

const emit = defineEmits<{
  (e: "create"): void;
  (e: "edit", prod: any): void;
  (e: "delete", prod: any): void;
  (e: "addStock", prod: any): void;
  (e: "pageChange", page: number): void;
}>();
</script>

<template>
  <div>
    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <input
          v-model="busca"
          type="text"
          placeholder="Buscar produtos por nome..."
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
    <div v-if="isLoading && produtos.length === 0" class="py-20 flex justify-center">
      <svg
        class="animate-spin h-8 w-8 text-primary"
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="prod in produtos"
        :key="prod.id"
        class="bg-[#16161E] border border-white/5 rounded-xl p-5 flex flex-col justify-between hover:border-white/10 transition-all group relative overflow-hidden"
      >
        <!-- Badges -->
        <div class="flex items-center gap-2 mb-3">
          <span
            v-if="prod.categoria"
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20"
          >
            {{ prod.categoria.nome }}
          </span>
          <span
            v-if="prod.tipo"
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-secondary border border-white/10"
          >
            {{ prod.tipo.nome }}
          </span>
        </div>

        <!-- Actions -->
        <div class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            @click.stop="emit('edit', prod)"
            class="p-1.5 rounded hover:bg-white/10 text-secondary hover:text-white transition-colors backdrop-blur-sm"
            title="Editar Produto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button
            @click.stop="emit('delete', prod)"
            class="p-1.5 rounded hover:bg-danger/10 text-secondary hover:text-danger transition-colors backdrop-blur-sm"
            title="Excluir Produto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="mb-6">
          <h3 class="text-base font-bold text-white leading-tight mb-1 line-clamp-2" :title="prod.nome">
            {{ prod.nome }}
          </h3>
          <div class="flex items-center gap-2 text-xs text-secondary/60">
            <span v-if="prod.unidade">{{ prod.unidade.nome }}</span>
            <span v-if="prod.codigo_barras" class="font-mono bg-black/30 px-1 rounded text-[10px]">{{ prod.codigo_barras }}</span>
          </div>
        </div>

        <!-- Footer / Stock -->
        <div class="mt-auto pt-4 border-t border-white/5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="prod.total_estoque > (prod.treshold || 0) ? 'bg-emerald-500' : 'bg-red-500'"></div>
              <span class="text-xs font-medium text-white">
                Estoque: <span class="font-bold">{{ prod.total_estoque }}</span>
              </span>
            </div>
            <span v-if="prod.treshold" class="text-[10px] text-secondary" title="Estoque Mínimo">Min: {{ prod.treshold }}</span>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model.number="prod.quantidade_a_adicionar"
              type="number"
              min="0"
              placeholder="+ Qtd"
              class="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary focus:outline-none placeholder-secondary/30 transition-colors"
              @click.stop
            />
            <button
              @click.stop="emit('addStock', prod)"
              :disabled="!prod.quantidade_a_adicionar || prod.quantidade_a_adicionar <= 0"
              class="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex-shrink-0"
              title="Adicionar ao Estoque"
            >
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="produtos.length > 0" class="flex flex-col md:flex-row items-center justify-between gap-3 mt-8 pt-4 border-t border-white/5">
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
