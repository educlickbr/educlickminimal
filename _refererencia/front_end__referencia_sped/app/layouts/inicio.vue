<script setup lang="ts">
const store = useAppStore();

// Garante que a sessão está carregada (inclusive em refresh na página)
onMounted(async () => {
    if (!store.initialized) {
        await store.initSession();
    }
});

// Show popup only for estudantes
const isEstudante = computed(() => store.hasRoleByName(["estudante"]));
</script>

<template>
    <div class="h-screen w-screen bg-background overflow-hidden">
        <!-- Permanent Menu -->
        <FullPageMenu :isOpen="true" :disableClose="true" />
        <slot />

        <!-- Divulgação popup for estudantes -->
        <PopupEstudante v-if="isEstudante" />
    </div>
</template>
