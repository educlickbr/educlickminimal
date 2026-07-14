<template>
  <div class="bg-[#16161E] border border-white/5 rounded-xl overflow-hidden">
    <div class="p-4 border-b border-white/5">
      <h4 class="text-sm font-bold text-white flex items-center gap-2">
        <svg
          class="w-4 h-4 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
        Histórico de Aulas
      </h4>
    </div>

    <div v-if="registros && registros.length > 0">
      <!-- Header -->
      <div
        :style="gridStyle"
        class="text-[10px] font-bold text-secondary uppercase bg-white/5 p-3 text-center items-center gap-2 border-b border-white/5"
      >
        <div class="text-left pl-2">Data</div>
        <div v-if="qtdPeriodos >= 1">P1</div>
        <div v-if="qtdPeriodos >= 2">P2</div>
        <div v-if="qtdPeriodos >= 3">P3</div>
        <div v-if="qtdPeriodos >= 4">P4</div>
      </div>

      <div class="divide-y divide-white/5">
        <div
          v-for="(log, idx) in registros"
          :key="idx"
          :style="gridStyle"
          class="text-sm p-3 items-center text-center hover:bg-white/5 transition-colors gap-2"
        >
          <div class="text-left font-mono text-white/80 pl-2 truncate">
            {{ formatDate(log.data) }}
          </div>

          <div
            v-if="qtdPeriodos >= 1"
            class="flex justify-center"
          >
            <span
              class="w-6 h-6 flex items-center justify-center rounded border text-xs font-bold"
              :class="getStatusColor(log.p1)"
            >
              {{ getStatusLabel(log.p1) }}
            </span>
          </div>
          <div
            v-if="qtdPeriodos >= 2"
            class="flex justify-center"
          >
            <span
              class="w-6 h-6 flex items-center justify-center rounded border text-xs font-bold"
              :class="getStatusColor(log.p2)"
            >
              {{ getStatusLabel(log.p2) }}
            </span>
          </div>
          <div
            v-if="qtdPeriodos >= 3"
            class="flex justify-center"
          >
            <span
              class="w-6 h-6 flex items-center justify-center rounded border text-xs font-bold"
              :class="getStatusColor(log.p3)"
            >
              {{ getStatusLabel(log.p3) }}
            </span>
          </div>
          <div
            v-if="qtdPeriodos >= 4"
            class="flex justify-center"
          >
            <span
              class="w-6 h-6 flex items-center justify-center rounded border text-xs font-bold"
              :class="getStatusColor(log.p4)"
            >
              {{ getStatusLabel(log.p4) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="text-center py-12 text-secondary text-sm"
    >
      Nenhum registro de aula encontrado para esta turma.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  registros: any[] | null
  qtdPeriodos: number
  formatDate: (date: string) => string
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
}>()

const gridStyle = computed(() => {
  const periodos = props.qtdPeriodos || 1
  return {
    display: "grid",
    gridTemplateColumns: `minmax(100px, 1.5fr) repeat(${periodos}, 1fr)`,
  }
})
</script>
