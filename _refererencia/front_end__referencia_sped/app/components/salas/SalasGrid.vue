<script setup lang="ts">
defineProps<{
  salas: any[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: "edit", sala: any): void;
  (e: "delete", sala: any): void;
}>();
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading && salas.length === 0" class="py-20 flex justify-center">
      <svg
        class="animate-spin h-8 w-8 text-primary"
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Empty -->
    <div
      v-else-if="salas.length === 0"
      class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
    >
      <div class="text-4xl mb-4 text-secondary/50">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
      </div>
      <p class="text-white font-medium">Nenhuma sala encontrada</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="sala in salas"
        :key="sala.id"
        class="bg-[#16161E] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-primary/50 transition-colors"
      >
        <div
          class="absolute left-0 top-0 bottom-0 w-1.5"
          :style="{ backgroundColor: sala.cor }"
        ></div>

        <div class="pl-3">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-white text-lg">{{ sala.nome }}</h3>
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="emit('edit', sala)"
                class="text-secondary hover:text-white p-1"
                title="Editar"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button
                @click="emit('delete', sala)"
                class="text-secondary hover:text-danger p-1"
                title="Excluir"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
