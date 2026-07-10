<script setup lang="ts">
const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};
</script>

<template>
    <nav
        class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 md:px-16 py-4 bg-background/80 backdrop-blur-md border-b border-white/5"
    >
        <!-- Logo -->
        <a href="#" class="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img
                src="/educlick_logo.png"
                alt="Educlick"
                class="h-8 w-auto"
            />
        </a>

        <!-- Links desktop -->
        <div class="hidden md:flex items-center gap-8">
            <button
                @click="scrollTo('dor')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider"
            >
                O problema
            </button>
            <button
                @click="scrollTo('core')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider"
            >
                Como funciona
            </button>
            <button
                @click="scrollTo('funcionalidades')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider"
            >
                Funcionalidades
            </button>
            <button
                @click="scrollTo('diferencial')"
                class="text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider"
            >
                Diferencial
            </button>
        </div>

        <!-- CTA -->
        <div class="flex items-center gap-3">
            <NuxtLink
                to="/auth/login"
                class="hidden sm:flex text-[11px] font-bold text-secondary hover:text-primary uppercase tracking-wider transition-colors"
            >
                Entrar
            </NuxtLink>
            <button
                @click="scrollTo('diferencial')"
                class="bg-primary text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-all hover:-translate-y-0.5"
                style="box-shadow: 3px 3px 0 #4c1d95;"
            >
                Agendar demo
            </button>
        </div>
    </nav>
</template>
