<script setup lang="ts">
definePageMeta({
    layout: false
})

import { useAppStore } from '../../stores/app'
const store = useAppStore()

onMounted(() => {
   store.initTheme()
   store.initSession() // Single BFF call for everything
})
</script>

<template>
  <div class="h-screen w-screen bg-background overflow-hidden relative">
     <FullPageMenu :isOpen="true" :isStatic="true" />
  </div>
</template>
