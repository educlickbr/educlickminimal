<script setup lang="ts">
interface Course {
  id: string
  title: string
  category: string
  anoSemestre: string
}

const props = defineProps<{
  course: Course | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const getAnoSemestreLabel = (anoSemestre: string) => {
  const normalized = String(anoSemestre || "").trim();
  if (!normalized) return "o período selecionado";

  const yearPrefix = normalized.slice(0, 2);
  const year = Number(yearPrefix);
  const fullYear = Number.isNaN(year) ? "" : `20${yearPrefix}`;

  if (normalized.includes("IIs"))
    return `o Segundo Semestre de ${fullYear || "____"}`;
  if (normalized.includes("Is"))
    return `o Primeiro Semestre de ${fullYear || "____"}`;

  return fullYear
    ? `o período ${normalized} (${fullYear})`
    : `o período ${normalized}`;
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[120] flex items-center justify-center p-4"
  >
    <div
      class="absolute inset-0 bg-black/75 backdrop-blur-sm"
      @click="emit('close')"
    ></div>

    <div
      class="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#16161E] shadow-2xl overflow-hidden"
    >
      <div class="px-6 py-5 border-b border-white/10">
        <p
          class="text-[11px] uppercase tracking-wider font-black text-primary"
        >
          Confirmação de Inscrição
        </p>
        <h3 class="text-lg md:text-xl font-bold text-white mt-1">
          Revise antes de avançar
        </h3>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div
          class="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <p
            class="text-xs uppercase tracking-wider text-secondary/70 font-bold"
          >
            Curso selecionado
          </p>
          <p class="text-base font-bold text-white mt-1 break-words">
            {{ course?.title || "Curso não informado" }}
          </p>
          <p class="text-xs text-secondary mt-1">
            Área: {{ course?.category || "-" }}
            | Período: {{ course?.anoSemestre || "-" }}
          </p>
        </div>

        <div
          class="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
        >
          <p class="text-sm font-bold text-amber-200">
            Atenção
          </p>
          <p class="text-sm text-amber-100/90 mt-2 leading-relaxed">
            Ao se inscrever neste curso, você não poderá se inscrever em outros
            cursos Regulares para
            {{ getAnoSemestreLabel(course?.anoSemestre || "") }}.
          </p>
          <p class="text-sm text-amber-100/90 mt-2 leading-relaxed">
            Segundo as regras do edital para este processo seletivo, cada CPF
            pode escolher apenas um curso.
          </p>
        </div>
      </div>

      <div
        class="px-6 py-4 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-white/[0.02]"
      >
        <button
          @click="emit('close')"
          class="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-secondary hover:text-white font-bold transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="emit('confirm')"
          class="px-5 py-2.5 rounded-lg bg-primary hover:bg-[#b81151] text-white font-bold transition-colors"
        >
          Avançar com inscrição
        </button>
      </div>
    </div>
  </div>
</template>
