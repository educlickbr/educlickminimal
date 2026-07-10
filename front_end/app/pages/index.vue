<script setup lang="ts">
definePageMeta({
    layout: false,
});

import { useAppStore } from "../../stores/app";

// Import explícito para garantir que o Nuxt inclua no bundle
import LandingInstitucionalLandingFormulario from "~/components/landing/institucional/LandingFormulario.vue";

const store = useAppStore();
const user = useSupabaseUser();

const ready = ref(false);
const showLanding = ref(false);

onMounted(async () => {
    try {
        store.initTheme();
        await store.initSession();

        if (user.value) {
            showLanding.value = false;
        } else {
            showLanding.value = true;
        }
    } catch (err) {
        console.error("[index] Erro na inicialização:", err);
        showLanding.value = true;
    }
    ready.value = true;
});
</script>

<template>
    <div class="bg-background min-h-screen text-text font-sans antialiased overflow-x-hidden">
        <div v-if="!ready" class="h-screen w-full flex items-center justify-center">
            <div class="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>

        <FullPageMenu v-else-if="!showLanding" :isOpen="true" :isStatic="true" />

        <div v-else>
            <LandingInstitucionalLandingHeader />
            <main>
                <LandingInstitucionalLandingHero />
                <LandingInstitucionalLandingDor />
                <LandingInstitucionalLandingCore />
                <LandingInstitucionalLandingFuncionalidades />
                <LandingInstitucionalLandingDiferencial />
                <LandingInstitucionalLandingFormulario />
            </main>
            <LandingInstitucionalLandingFooter />
        </div>
    </div>
</template>
