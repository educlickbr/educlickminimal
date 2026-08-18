<script setup lang="ts">
definePageMeta({ layout: "base" });

import MinhasAtividadesPage from "~/components/minhas_atividades/MinhasAtividadesPage.vue";
</script>

<template>
    <div class="page-wrap">
        <MinhasAtividadesPage />
    </div>
</template>

<style scoped>
.page-wrap {
    padding: 1.5rem 1.75rem;
    min-height: 100vh;
}
</style>
