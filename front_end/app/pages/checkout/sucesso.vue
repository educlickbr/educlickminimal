<template>
  <div data-theme="dark" class="min-h-screen bg-[#0a0a0c] text-white font-sans flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center">
      <div class="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-green-400">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="text-2xl font-black mb-2">Matrícula Confirmada!</h1>
      <p class="text-sm text-secondary/60 mb-6">Sua matrícula foi realizada com sucesso.</p>
      <NuxtLink to="/meus-cursos" class="inline-block px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
        Ver Meus Cursos
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>

<style scoped>
/* SFC Style */
</style>
