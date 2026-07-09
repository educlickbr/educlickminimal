<template>
  <div class="bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden">
    <div class="h-1 bg-gradient-to-r from-primary to-purple-500" />

    <div class="p-8">
      <div class="flex items-center justify-between mb-6">
        <span class="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
          {{ oferta?.nome_area || "Curso" }}
        </span>
        <span :class="['px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest',
          isGratuito ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400']">
          {{ valorFormatado }}
        </span>
      </div>

      <h1 class="text-2xl font-black mb-2">{{ oferta?.programa_descricao || "Carregando..." }}</h1>
      <p v-if="oferta?.nome_curso" class="text-sm text-secondary/60 mb-4">{{ oferta.nome_curso }}</p>
      <p v-if="oferta?.nome_curto" class="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-6">{{ oferta.nome_curto }}</p>

      <div class="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <div class="flex flex-col gap-1">
          <span class="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Produto</span>
          <span class="text-xs font-bold text-white/90">{{ oferta?.nome_produto || "—" }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Tipo</span>
          <span class="text-xs font-bold text-white/90">
            {{ oferta?.tipo_pagamento === 'recorrente' ? `Recorrente (${oferta?.recorrencia_periodo || ''})` : 'Pagamento Único' }}
          </span>
        </div>
      </div>

      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  oferta: any
  valorFormatado: string
  isGratuito: boolean
}>()
</script>
