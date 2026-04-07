<script setup lang="ts">
definePageMeta({
  layout: 'base'
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header Card -->
    <div class="bg-div-15 rounded-xl p-6 border border-secondary/5">
      <h1 class="text-xl font-black text-white uppercase tracking-widest">
        Página de Teste
      </h1>
      <p class="text-xs font-bold text-secondary/60 mt-1 uppercase tracking-wider">
        Verificando o layout base e componentes
      </p>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Card 1 -->
      <div class="bg-div-15 p-6 rounded-xl border border-secondary/5">
        <h2 class="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
          Seção 1
        </h2>
        <p class="text-sm text-secondary">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>

      <!-- Card 2 -->
      <div class="bg-div-15 p-6 rounded-xl border border-secondary/5">
        <h2 class="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
          Seção 2
        </h2>
        <p class="text-sm text-secondary">
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>
    </div>
  </div>
</template>
