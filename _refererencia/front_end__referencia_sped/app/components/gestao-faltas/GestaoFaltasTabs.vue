<template>
  <div
    class="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
  >
    <!-- Tabs -->
    <div
      class="flex items-center gap-6 border-b border-secondary/10 w-full md:w-auto pb-1 overflow-x-auto no-scrollbar"
    >
      <button
        @click="$emit('update:activeTab', 'minhas-faltas')"
        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
        :class="
          activeTab === 'minhas-faltas'
            ? 'text-primary'
            : 'text-secondary hover:text-white'
        "
      >
        Minhas Faltas
        <span
          v-if="activeTab === 'minhas-faltas'"
          class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
        ></span>
      </button>
      <button
        @click="$emit('update:activeTab', 'justificativas')"
        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
        :class="
          activeTab === 'justificativas'
            ? 'text-primary'
            : 'text-secondary hover:text-white'
        "
      >
        Justificativas
        <span
          v-if="activeTab === 'justificativas'"
          class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
        ></span>
      </button>
      <button
        @click="$emit('update:activeTab', 'atestados')"
        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
        :class="
          activeTab === 'atestados'
            ? 'text-primary'
            : 'text-secondary hover:text-white'
        "
      >
        Atestados
        <span
          v-if="activeTab === 'atestados'"
          class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
        ></span>
      </button>
    </div>

    <!-- Dynamic Actions -->
    <div class="text-right flex items-center gap-3">
      <button
        v-if="activeTab === 'justificativas'"
        @click="$emit('open-modal', 'justificativa')"
        :disabled="!userExpandidoId"
        class="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Nova Justificativa
      </button>

      <button
        v-if="activeTab === 'atestados'"
        @click="$emit('open-modal', 'atestado')"
        :disabled="!userExpandidoId"
        class="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Novo Atestado
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: string
  userExpandidoId: string | null
}>()

defineEmits<{
  "update:activeTab": [value: string]
  "open-modal": [tipo: "atestado" | "justificativa"]
}>()
</script>
