<script setup lang="ts">
definePageMeta({
    layout: false,
});

import { useAppStore } from "../../stores/app";
const store = useAppStore();
const user = useSupabaseUser();

const ready = ref(false);

onMounted(async () => {
    store.initTheme();
    await store.initSession();

    // Se usuário não está logado, redireciona para a página pública de ofertas
    if (!user.value) {
        await navigateTo("/oferta", { replace: true });
        return;
    }

    ready.value = true;
});
</script>

<template>
    <div class="h-screen w-screen bg-background overflow-hidden relative">
        <!-- Splash / Loader enquanto verifica autenticação -->
        <div
            v-if="!ready"
            class="h-full w-full flex items-center justify-center"
        >
            <div
                class="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
            />
        </div>

        <!-- Só renderiza o menu depois de confirmar que está autenticado -->
        <FullPageMenu v-else :isOpen="true" :isStatic="true" />
    </div>
</template>
