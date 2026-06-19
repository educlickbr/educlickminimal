<template>
  <div class="flex flex-col gap-6">
    <div v-if="!savedModuloId" class="py-12 text-center bg-div-10/30 rounded-xl border border-dashed border-secondary/10">
      <Icon name="ph:info-duotone" class="w-10 h-10 text-secondary/20 mx-auto mb-3" />
      <p class="text-xs text-secondary/60 font-medium">Salve o módulo primeiro para gerenciar os planos de aula.</p>
    </div>
    <div v-else class="flex flex-col gap-6">
      <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
        <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Icon name="ph:plus-circle-bold" /> {{ editingPlanoId ? "Editar" : "Adicionar" }} Plano de Aula</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5"><label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Componente Curricular</label><select v-model="formPlano.id_componente" class="w-full px-3 py-2 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"><option :value="null" disabled>Selecione um componente...</option><option v-for="comp in componentesParaPlano" :key="comp.id" :value="comp.id">{{ comp.nome_componente }}</option></select></div>
          <div class="flex flex-col gap-1.5"><label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Título do Plano</label><input v-model="formPlano.titulo_plano" placeholder="Ex: Introdução ao Minimax" class="w-full px-3 py-2 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none" /></div>
        </div>
        <div class="flex flex-col gap-1.5"><label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Ementa / Conteúdo</label><RichTextEditor v-model="formPlano.ementa" placeholder="Detalhe o conteúdo e os requisitos da aula..." /></div>
        <div class="flex justify-end gap-2">
          <button v-if="editingPlanoId" @click="$emit('resetPlano')" class="px-3 py-1.5 rounded bg-div-10 text-[10px] font-black text-secondary uppercase tracking-widest">Cancelar</button>
          <button @click="$emit('savePlano')" :disabled="loadingPlano" class="px-4 py-1.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50">{{ loadingPlano ? "Salvando..." : editingPlanoId ? "Atualizar Plano" : "Adicionar Plano" }}</button>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <p class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">Planos Cadastrados ({{ planos.length }})</p>
        <div v-if="loadingPlanos" class="py-4 flex justify-center"><LoadingOverlay :show="true" /></div>
        <div v-else-if="planos.length === 0" class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-div-5 rounded-lg border border-secondary/5">Nenhum plano associado a este módulo.</div>
        <div v-for="p in planos" :key="p.id" class="flex items-center justify-between p-3 rounded-lg border border-secondary/5 bg-div-10 group hover:border-primary/20 transition-all">
          <div class="flex flex-col min-w-0"><div class="flex items-center gap-2"><span class="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">{{ p.nome_componente }}</span><h5 class="text-[11px] font-bold text-primary truncate">{{ p.titulo_plano }}</h5></div><p class="text-[10px] text-secondary/50 truncate mt-0.5">{{ p.ementa?.replace(/<[^>]*>/g, "") || "Sem ementa" }}</p></div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="$emit('editPlano', p)" class="p-2 text-secondary/40 hover:text-primary transition-colors rounded"><Icon name="ph:pencil-simple-bold" class="w-4 h-4" /></button>
            <button @click="$emit('deletePlano', p.id!)" class="p-2 text-secondary/40 hover:text-danger hover:bg-danger/10 transition-colors rounded" title="Excluir Plano"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  savedModuloId: string | null;
  editingPlanoId: string | null;
  formPlano: { id_componente: string | null; titulo_plano: string; ementa: string | null };
  componentesParaPlano: { id: string; nome_componente: string }[];
  planos: any[];
  loadingPlanos: boolean;
  loadingPlano: boolean;
}>();
defineEmits<{ savePlano: []; resetPlano: []; editPlano: [p: any]; deletePlano: [id: string] }>();
</script>
