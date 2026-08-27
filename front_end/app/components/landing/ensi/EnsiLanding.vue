<script setup lang="ts">
import LandingHeader from "./LandingHeader.vue";
import LandingHero from "./LandingHero.vue";
import LandingSobre from "./LandingSobre.vue";
import LandingCursos from "./LandingCursos.vue";
import LandingDiferenciais from "./LandingDiferenciais.vue";
import LandingDuvidas from "./LandingDuvidas.vue";
import LandingContato from "./LandingContato.vue";
import LandingFooter from "./LandingFooter.vue";

const logoAberto = ref<string | null>(null);
const logoFechado = ref<string | null>(null);

onMounted(async () => {
    const { aplicarTemaDaEntidadePublica } = useTemaEntidade();
    const res = await aplicarTemaDaEntidadePublica();
    if (res.success && res.entidade?.branding) {
        const b = res.entidade.branding;
        logoAberto.value = b.logo_aberto || null;
        logoFechado.value = b.logo_fechado || b.logo_aberto || null;
    }
});
</script>

<template>
    <div class="landing-ensi-container bg-background text-text min-h-screen font-sans antialiased overflow-x-hidden">
        <LandingHeader :logo="logoFechado" />
        <main>
            <LandingHero />
            <LandingSobre />
            <LandingCursos />
            <LandingDiferenciais />
            <LandingDuvidas />
            <LandingContato />
        </main>
        <LandingFooter :logo="logoAberto" />
    </div>
</template>

<style scoped>
/* Container principal da Landing Page ENSI */
</style>
