<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div
      class="bg-[#16161E] rounded-xl p-6 border border-white/5 flex flex-col items-center text-center"
    >
      <span
        class="text-xs text-secondary font-bold uppercase tracking-wider mb-2"
        >Presença</span
      >
      <div
        class="text-4xl font-bold"
        :class="
          Number(percentualPresenca) >= 75
            ? 'text-green-500'
            : 'text-red-500'
        "
      >
        {{ percentualPresenca }}%
      </div>
      <span class="text-xs text-white/50 mt-2"
        >Mínimo exigido: 75%</span
      >
    </div>
    <div
      class="bg-[#16161E] rounded-xl p-6 border border-white/5 flex flex-col items-center text-center"
    >
      <span
        class="text-xs text-secondary font-bold uppercase tracking-wider mb-2"
        >Faltas Computadas</span
      >
      <div class="text-4xl font-bold text-white">
        {{ horasFaltadas }}h
      </div>
      <span class="text-xs text-white/50 mt-2"
        >de {{ horasTotais }}h totais</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  percentualPresenca: string | number
  horasFaltadas: string | number
  horasTotais: string | number
}>()
</script>
