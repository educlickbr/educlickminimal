<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2 mb-2">
      <h4 class="text-sm font-black text-primary uppercase tracking-widest">Qual a base desta oferta?</h4>
      <p class="text-xs text-secondary/60">Escolha se deseja ofertar um Curso completo ou apenas um Módulo/Ciclo avulso.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button @click="$emit('selectOrigem', 'curso')"
        class="flex flex-col items-start text-left p-6 rounded-xl border-2 transition-all relative overflow-hidden group"
        :class="origem === 'curso' ? 'border-primary bg-primary/5' : 'border-secondary/10 bg-div-5 hover:border-primary/50'">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
          :class="origem === 'curso' ? 'bg-primary/20 text-primary' : 'bg-secondary/10 text-secondary/40 group-hover:text-primary'">
          <Icon name="ph:graduation-cap-bold" class="w-6 h-6" />
        </div>
        <h5 class="text-sm font-black text-primary mb-1 uppercase tracking-widest">A partir de um Curso</h5>
        <p class="text-[11px] text-secondary/60 leading-relaxed">Analisa a matriz do curso e agrupa múltiplos ciclos numa trilha completa de formação.</p>
        <div v-if="origem === 'curso'" class="absolute top-4 right-4 text-primary"><Icon name="ph:check-circle-fill" class="w-6 h-6" /></div>
      </button>
      <button @click="$emit('selectOrigem', 'ciclo')"
        class="flex flex-col items-start text-left p-6 rounded-xl border-2 transition-all relative overflow-hidden group"
        :class="origem === 'ciclo' ? 'border-orange-500 bg-orange-500/5' : 'border-secondary/10 bg-div-5 hover:border-orange-500/50'">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
          :class="origem === 'ciclo' ? 'bg-orange-500/20 text-orange-500' : 'bg-secondary/10 text-secondary/40 group-hover:text-orange-500'">
          <Icon name="ph:books-bold" class="w-6 h-6" />
        </div>
        <h5 class="text-sm font-black text-orange-500 mb-1 uppercase tracking-widest">A partir de Ciclos</h5>
        <p class="text-[11px] text-secondary/60 leading-relaxed">Ideal para ofertas avulsas, cursos rápidos ou extensões.</p>
        <div v-if="origem === 'ciclo'" class="absolute top-4 right-4 text-orange-500"><Icon name="ph:check-circle-fill" class="w-6 h-6" /></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ origem: string | null }>();
defineEmits<{ selectOrigem: [val: "curso" | "ciclo"] }>();
</script>
