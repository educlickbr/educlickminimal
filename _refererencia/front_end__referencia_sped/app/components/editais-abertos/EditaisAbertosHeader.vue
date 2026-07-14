<template>
  <div
    class="flex flex-col md:flex-row items-center justify-end gap-6 mb-8"
  >
    <div class="flex items-center gap-4 w-full md:w-auto">
      <div class="relative w-full md:w-40">
        <select
          :value="anoSemestre"
          @change="$emit('update:anoSemestre', ($event.target as HTMLSelectElement).value)"
          class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
        >
          <option
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  anoSemestre: string
  options: { value: string; label: string }[]
}>()

defineEmits<{
  "update:anoSemestre": [value: string]
}>()
</script>
