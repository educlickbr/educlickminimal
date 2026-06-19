<template>
  <div class="flex flex-col gap-6">
    <div v-if="temOverlapping" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start mb-2">
      <Icon name="ph:warning-octagon-fill" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div class="flex flex-col gap-1">
        <span class="text-xs font-black text-red-500 uppercase tracking-widest">Aviso de Calendário</span>
        <p class="text-[10px] text-red-500/80 leading-relaxed">Foram selecionados ciclos que ocorrem numa mesma faixa de datas.</p>
      </div>
    </div>

    <div v-if="!isEdit && ciclosSelecionados.length > 1" class="flex flex-col gap-3">
      <h4 class="text-[10px] font-black text-primary uppercase tracking-widest">Estratégia de Agrupamento</h4>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer"
          :class="estrategia === 'unica' ? 'border-primary bg-primary/5' : 'border-secondary/10 bg-div-5 hover:border-primary/30'">
          <input type="radio" :checked="estrategia === 'unica'" @change="$emit('update:estrategia', 'unica')" class="sr-only" />
          <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" :class="estrategia === 'unica' ? 'border-primary' : 'border-secondary/40'">
            <div v-if="estrategia === 'unica'" class="w-2 h-2 rounded-full bg-primary"></div>
          </div>
          <div class="flex flex-col"><span class="text-xs font-black text-primary uppercase tracking-widest">Oferta Única Integrada</span><span class="text-[9px] text-secondary/60">Gera 1 Programa com todos os ciclos.</span></div>
        </label>
        <label class="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer"
          :class="estrategia === 'separada' ? 'border-orange-500 bg-orange-500/5' : 'border-secondary/10 bg-div-5 hover:border-orange-500/30'">
          <input type="radio" :checked="estrategia === 'separada'" @change="$emit('update:estrategia', 'separada')" class="sr-only" />
          <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" :class="estrategia === 'separada' ? 'border-orange-500' : 'border-secondary/40'">
            <div v-if="estrategia === 'separada'" class="w-2 h-2 rounded-full bg-orange-500"></div>
          </div>
          <div class="flex flex-col"><span class="text-xs font-black text-orange-500 uppercase tracking-widest">Ofertas Múltiplas</span><span class="text-[9px] text-secondary/60">Gera {{ ciclosSelecionados.length }} Programas distintos.</span></div>
        </label>
      </div>
    </div>

    <div class="flex flex-col gap-4 mt-2">
      <h4 class="text-[10px] font-black text-primary uppercase tracking-widest border-b border-secondary/10 pb-2">Identificação Visual</h4>

      <div v-if="isEdit" class="flex flex-col gap-2">
        <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Curso Vinculado</label>
        <select :value="idCurso" disabled class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary opacity-50 outline-none">
          <option :value="null" disabled>Nenhum curso (Ciclo Isolado)</option>
          <option v-for="c in listCursos" :key="c.id" :value="c.id">{{ c.nome_curso }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Área Acadêmica</label>
        <div v-if="origem === 'curso'" class="px-4 py-3 rounded-lg border border-secondary/10 bg-div-5 text-sm font-bold text-primary opacity-60">Herdada automaticamente do curso vinculado</div>
        <select v-else :value="idArea" @change="$emit('update:idArea', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-3 rounded-lg border border-secondary/10 text-sm font-bold text-primary outline-none focus:border-primary/50">
          <option :value="null" disabled>Selecione a área</option>
          <option v-for="a in listAreas" :key="a.id" :value="a.id">{{ a.nome_area }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">
          {{ estrategia === "separada" && ciclosSelecionados.length > 1 && !isEdit ? "Nomes Acadêmicos das Ofertas" : "Nome Acadêmico da Oferta" }}
        </label>
        <div v-if="estrategia === 'separada' && ciclosSelecionados.length > 1 && !isEdit" class="flex flex-col gap-3">
          <div v-for="cId in ciclosSelecionados" :key="cId" class="flex flex-col gap-1 p-3 rounded-lg border border-secondary/10 bg-div-5">
            <span class="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
              <Icon name="ph:arrow-elbow-down-right-bold" /> {{ ciclosEncontrados.find((c: any) => c.id === cId)?.modulo_nome || "Módulo" }}
            </span>
            <input type="text" :value="descricoesMultiplas[cId]" @input="$emit('update:descricaoMultipla', cId, ($event.target as HTMLInputElement).value)"
              class="w-full px-3 py-2 rounded border border-secondary/10 bg-background text-xs font-bold text-primary focus:border-orange-500/50 transition-all outline-none" />
          </div>
        </div>
        <input v-else type="text" :value="descricao" @input="$emit('update:descricao', ($event.target as HTMLInputElement).value)"
          placeholder="Ex: Formação Fullstack - 2026.1" class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isEdit?: boolean;
  origem: string | null;
  idCurso: string | null;
  idArea: string | null;
  estrategia: string;
  descricao: string;
  descricoesMultiplas: Record<string, string>;
  ciclosSelecionados: string[];
  ciclosEncontrados: any[];
  listCursos: any[];
  listAreas: any[];
  temOverlapping: boolean;
}>();

defineEmits<{
  'update:estrategia': [val: string];
  'update:idArea': [val: string | null];
  'update:descricao': [val: string];
  'update:descricaoMultipla': [cId: string, val: string];
}>();
</script>
