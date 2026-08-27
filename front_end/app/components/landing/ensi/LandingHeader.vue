<script setup lang="ts">
/**
 * LandingHeader.vue - Header exclusivo da marca ENSI
 *
 * Exibe o logo_fechado da entidade (com fallback) no topo da página.
 */
const props = defineProps<{
    logo?: string | null;
}>();

const localLogo = ref<string | null>(null);

onMounted(async () => {
    if (!props.logo) {
        const { aplicarTemaDaEntidadePublica } = useTemaEntidade();
        const res = await aplicarTemaDaEntidadePublica();
        if (res.success && res.entidade?.branding) {
            localLogo.value = res.entidade.branding.logo_fechado || res.entidade.branding.logo_aberto || null;
        }
    }
});

const currentLogo = computed(() => props.logo || localLogo.value);

const scrollTo = (id: string) => {
    if (!import.meta.client) return;
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
};
</script>

<template>
    <header
        class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 md:px-16 py-4 bg-background/90 backdrop-blur-md border-b border-divider shadow-sm transition-all"
    >
        <!-- Logo / Marca ENSI (Header: logo fechado) -->
        <a href="#" class="flex items-center gap-3 group">
            <img
                v-if="currentLogo"
                :src="currentLogo"
                alt="ENSI Logo"
                class="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div
                v-else
                class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-md shadow-primary/30 group-hover:scale-105 transition-transform"
            >
                E
            </div>
            <div class="flex flex-col">
                <span class="text-lg font-black text-text tracking-wider leading-none">ENSI</span>
                <span class="text-[9px] font-bold text-primary uppercase tracking-widest leading-none mt-0.5">Escola Nacional de Saúde Integrada</span>
            </div>
        </a>

        <!-- Links Desktop -->
        <nav class="hidden lg:flex items-center gap-8">
            <button
                @click="scrollTo('sobre')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider cursor-pointer"
            >
                Sobre a ENSI
            </button>
            <button
                @click="scrollTo('cursos')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider cursor-pointer"
            >
                Cursos & Soluções
            </button>
            <button
                @click="scrollTo('diferenciais')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider cursor-pointer"
            >
                Diferenciais
            </button>
            <button
                @click="scrollTo('duvidas')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider cursor-pointer"
            >
                Dúvidas
            </button>
            <button
                @click="scrollTo('contato')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider cursor-pointer"
            >
                Contato
            </button>
        </nav>

        <!-- CTA Acesso / Portal do Aluno -->
        <div class="flex items-center gap-4">
            <NuxtLink
                to="/auth/login"
                class="bg-primary text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/25 flex items-center gap-2"
            >
                <Icon name="ph:user-bold" class="w-4 h-4" />
                <span>Área do Aluno</span>
            </NuxtLink>
        </div>
    </header>
</template>

<style scoped>
/* SFC Style - Header ENSI */
</style>
