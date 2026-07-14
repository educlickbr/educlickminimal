<script setup lang="ts">
await navigateTo({
  path: '/inscricao/fabrica-cultura/vespertino',
  query: {
    tipo: 'estudante',
    area: 'regulares',
    processo: 'seletivo'
  }
}, { replace: true })
</script>

<template>
  <div class="p-4 text-sm text-secondary">Redirecionando...</div>
</template>
