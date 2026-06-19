<template>
  <div class="flex flex-col gap-6">
    <template v-if="origem === 'curso'">
      <div class="flex flex-col gap-2">
        <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Selecione o Curso Base</label>
        <select :model-value="idCurso" @change="$emit('update:idCurso', ($event.target as HTMLSelectElement).value); $emit('fetchCursoCiclos')"
          class="w-full px-4 py-3 rounded-lg border border-secondary/10 text-sm font-bold text-primary outline-none">
          <option :value="null" disabled>Selecione um Curso</option>
          <option v-for="c in listCursos" :key="c.id" :value="c.id">{{ c.nome_curso }}</option>
        </select>
      </div>
    </template>

    <div v-if="loadingCiclos" class="py-8 flex flex-col items-center justify-center text-secondary/40">
      <Icon name="ph:circle-notched-bold" class="w-8 h-8 animate-spin mb-2" />
      <span class="text-[10px] uppercase font-bold tracking-widest">Buscando ciclos disponíveis...</span>
    </div>

    <div v-else-if="ciclosEncontrados.length > 0" class="flex flex-col gap-4 mt-2">
      <h4 class="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
        <Icon name="ph:calendar-check-bold" class="w-4 h-4 text-green-500" /> Ciclos Disponíveis
      </h4>
      <div class="grid grid-cols-1 gap-3">
        <label v-for="ciclo in ciclosEncontrados" :key="ciclo.id"
          class="flex flex-col p-4 rounded-xl border border-secondary/10 bg-div-5 hover:bg-div-10 cursor-pointer transition-colors relative">
          <div class="flex items-start gap-4">
            <div class="pt-1">
              <input type="checkbox" :value="ciclo.id"
                :checked="ciclosSelecionados.includes(ciclo.id)"
                @change="toggleCiclo(ciclo.id, ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4 rounded border-secondary/30 text-primary focus:ring-primary/20" />
            </div>
            <div class="flex flex-col gap-1 w-full relative">
              <p class="text-xs font-black text-primary">{{ ciclo.modulo_nome }}</p>
              <p class="text-[10px] font-bold text-secondary/60">{{ ciclo.descricao || "Sem descrição" }}</p>
              <div class="flex items-center gap-4 mt-2 pt-2 border-t border-secondary/5 text-[9px] font-bold uppercase tracking-widest text-secondary/40">
                <span class="flex items-center gap-1"><Icon name="ph:calendar-bold" /> {{ formatDateShort(ciclo.data_ini) }} até {{ formatDateShort(ciclo.data_fim) }}</span>
              </div>
            </div>
          </div>
        </label>
      </div>
      <div v-if="origem === 'curso' && modulosPendentesCurso.length > 0" class="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
        <Icon name="ph:warning-circle-fill" class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div class="flex flex-col gap-1">
          <span class="text-xs font-black text-orange-500 uppercase tracking-widest">Matriz Incompleta</span>
          <p class="text-[10px] text-orange-500/80 leading-relaxed">Existem módulos deste curso que não possuem nenhum ciclo disponível programado.</p>
        </div>
      </div>
    </div>

    <div v-else-if="(origem === 'curso' && idCurso) || origem === 'ciclo'"
      class="py-8 text-center text-secondary/50 text-xs font-bold uppercase tracking-widest bg-div-5 rounded-xl border border-secondary/10 border-dashed">
      Nenhum ciclo programado foi encontrado.
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  origem: string | null;
  idCurso: string | null;
  ciclosSelecionados: string[];
  listCursos: any[];
  ciclosEncontrados: any[];
  loadingCiclos: boolean;
  modulosPendentesCurso: string[];
  formatDateShort: (d: string) => string;
}>();

const emit = defineEmits<{
  'update:idCurso': [value: string | null];
  'update:ciclosSelecionados': [value: string[]];
  fetchCursoCiclos: [];
}>();

function toggleCiclo(id: string, checked: boolean) {
  const updated = checked
    ? [...props.ciclosSelecionados, id]
    : props.ciclosSelecionados.filter((c) => c !== id);
  emit('update:ciclosSelecionados', updated);
}
</script>
