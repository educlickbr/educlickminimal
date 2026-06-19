<template>
  <div class="flex flex-col gap-6">
    <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
      <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Icon name="ph:plus-circle-bold" /> {{ formArea.id ? "Editar Área" : "Nova Área Educacional" }}</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Nome da Área</label>
          <input v-model="formArea.nome_area" placeholder="Ex: Exatas, Saúde, Humanas..." class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none" />
        </div>
        <div class="flex flex-col gap-1.5 justify-end">
          <div class="flex gap-2">
            <button @click="$emit('saveArea')" :disabled="loadingArea || !formArea.nome_area.trim()" class="flex-1 px-4 py-2.5 rounded bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all">{{ loadingArea ? "Savin..." : formArea.id ? "Atualizar" : "Criar Área" }}</button>
            <button v-if="formArea.id" @click="$emit('resetFormArea')" class="px-3 py-2.5 rounded border border-secondary/10 text-secondary hover:bg-white/5 transition-all"><Icon name="ph:x-bold" /></button>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-3">
      <p class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">Áreas Cadastradas ({{ areasDisponiveis.length }})</p>
      <div v-if="loadingListAreas" class="py-4 flex justify-center"><div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div></div>
      <div v-else-if="areasDisponiveis.length === 0" class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-div-5 rounded-lg border border-secondary/5">Nenhuma área cadastrada para esta entidade.</div>
      <div v-for="a in areasDisponiveis" :key="a.id" class="flex items-center justify-between px-4 py-3 rounded-lg border border-secondary/5 bg-div-10 group hover:border-primary/20 transition-all">
        <span class="text-xs font-black text-primary">{{ a.nome_area }}</span>
        <div class="flex items-center gap-2">
          <button @click="$emit('editArea', a)" class="p-1.5 text-secondary/30 hover:text-primary transition-all"><Icon name="ph:pencil-simple-bold" /></button>
          <button @click="$emit('deleteArea', a.id)" class="p-1.5 text-secondary/30 hover:text-red-400 transition-all"><Icon name="ph:trash-bold" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  formArea: { id: string | null; nome_area: string; descricao: string };
  areasDisponiveis: any[];
  loadingListAreas: boolean;
  loadingArea: boolean;
}>();
defineEmits<{ saveArea: []; resetFormArea: []; editArea: [a: any]; deleteArea: [id: string] }>();
</script>
