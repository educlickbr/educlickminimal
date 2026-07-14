<template>
  <div
    class="bg-[#16161E] border border-white/5 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
  >
    <div class="space-y-1">
      <label
        class="text-xs text-secondary font-bold uppercase tracking-wider"
        >Ano / Semestre</label
      >
      <BaseSelect
        :model-value="selectedAnoSemestre"
        :options="anoSemestreOptions"
        placeholder="Selecione o período..."
        @update:model-value="$emit('update:anoSemestre', $event)"
      />
    </div>
    <div class="space-y-1">
      <label
        class="text-xs text-secondary font-bold uppercase tracking-wider"
        >Turma / Curso</label
      >
      <BaseSelect
        :model-value="selectedMatriculaId"
        :options="turmasOptions"
        label-key="nome"
        value-key="id"
        placeholder="Selecione a turma..."
        :disabled="!selectedAnoSemestre"
        @update:model-value="$emit('update:matricula', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseSelect from "~/components/BaseSelect.vue"

defineProps<{
  selectedAnoSemestre: string
  anoSemestreOptions: { id: string; nome: string }[]
  selectedMatriculaId: string | null
  turmasOptions: { id: string; nome: string; id_matricula: string; id_turma: string }[]
}>()

defineEmits<{
  "update:anoSemestre": [value: string]
  "update:matricula": [value: string | null]
}>()
</script>
