<template>
  <div class="flex flex-col gap-6">
    <div v-if="!savedModuloId" class="py-12 text-center bg-div-10/30 rounded-xl border border-dashed border-secondary/10">
      <Icon name="ph:info-duotone" class="w-10 h-10 text-secondary/20 mx-auto mb-3" />
      <p class="text-xs text-secondary/60 font-medium">Salve o módulo primeiro para gerenciar os componentes.</p>
    </div>
    <div v-else class="flex flex-col gap-6">
      <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
        <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Icon name="ph:plus-circle-bold" /> Adicionar Componente ao Módulo</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1.5 md:col-span-2">
            <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Componente Curricular</label>
            <select v-model="formMC.id_componente" class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none">
              <option :value="null" disabled>Selecione um componente...</option>
              <option v-for="comp in componentesDisponiveis" :key="comp.id" :value="comp.id">{{ comp.nome_componente }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Carga Horária (h:m)</label>
            <div class="flex items-center gap-1">
              <input type="number" v-model="formMC.horas" placeholder="00" min="0" class="w-14 px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary text-center outline-none" />
              <span class="text-secondary/40 font-bold">:</span>
              <input type="number" v-model="formMC.minutos" placeholder="00" min="0" max="59" class="w-14 px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary text-center outline-none" />
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-4">
          <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" v-model="formMC.obrigatorio" class="w-3.5 h-3.5 accent-primary rounded" /><span class="text-[10px] font-bold text-secondary/60 uppercase tracking-widest">Componente obrigatório</span></label>
          <button @click="$emit('addComponente')" :disabled="loadingAddComponente || !formMC.id_componente" class="px-4 py-1.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all">{{ loadingAddComponente ? "Adicionando..." : "Adicionar" }}</button>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <p class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">Componentes do Módulo ({{ componentesDoModulo.length }})</p>
        <div v-if="loadingComponentesModulo" class="py-4 flex justify-center"><div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div></div>
        <div v-else-if="componentesDoModulo.length === 0" class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-div-5 rounded-lg border border-secondary/5">Nenhum componente associado a este módulo.</div>
        <div v-for="(mc, index) in componentesDoModulo" :key="mc.id_componente" class="flex items-center gap-0 rounded-lg border border-secondary/5 bg-div-10 group hover:border-primary/20 transition-all overflow-hidden">
          <div class="w-10 shrink-0 h-full flex items-center justify-center bg-div-10/50 border-r border-secondary/5"><span class="text-[10px] font-black text-secondary/30 tabular-nums">{{ index + 1 }}</span></div>
          <div class="flex-1 min-w-0 px-4 py-3">
            <div class="flex items-center gap-2"><p class="text-xs font-black text-primary truncate">{{ mc.nome_componente }}</p><span v-if="mc.obrigatorio" class="shrink-0 text-[8px] font-black bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Obrig.</span></div>
            <div class="flex items-center gap-3 mt-0.5"><p v-if="mc.carga_horaria" class="text-[10px] font-black text-secondary/60 tabular-nums">{{ Math.floor(mc.carga_horaria / 60).toString().padStart(2, "0") }}:{{ (mc.carga_horaria % 60).toString().padStart(2, "0") }} <span class="text-[8px] text-secondary/20 font-bold ml-1 uppercase">({{ mc.carga_horaria }} min)</span></p></div>
          </div>
          <button @click="$emit('removeComponente', mc.id_componente)" class="w-11 h-full flex items-center justify-center text-secondary/30 hover:text-red-400 hover:bg-red-500/5 transition-all border-l border-secondary/5" title="Remover" style="min-height: 44px"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  savedModuloId: string | null;
  formMC: { id_componente: string | null; horas: number | null; minutos: number | null; obrigatorio: boolean };
  componentesDisponiveis: { id: string; nome_componente: string }[];
  componentesDoModulo: any[];
  loadingComponentesModulo: boolean;
  loadingAddComponente: boolean;
}>();
defineEmits<{ addComponente: []; removeComponente: [id_componente: string] }>();
</script>
