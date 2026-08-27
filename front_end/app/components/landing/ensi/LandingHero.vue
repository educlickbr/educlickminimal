<script setup lang="ts">
/**
 * LandingHero.vue - Seção Hero da ENSI
 *
 * Apresentação principal da marca, chamada para ação e métricas oficiais da ENSI.
 */
const scrollTo = (id: string) => {
    if (!import.meta.client) return;
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
};
</script>

<template>
    <section class="relative pt-32 pb-20 md:pt-44 md:pb-28 px-5 md:px-16 overflow-hidden bg-background">
        <!-- Background Accents -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[160px]"></div>
            <div class="absolute -top-20 right-0 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[140px]"></div>
        </div>

        <div class="max-w-6xl mx-auto relative z-10">
            <div class="text-center max-w-3xl mx-auto space-y-6">
                
                <!-- Tag / Badge Superior -->
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                    <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>Escola Nacional de Saúde Integrada • Desde 2013</span>
                </div>

                <!-- Headline Principal -->
                <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-text tracking-tight leading-[1.1]">
                    Formando profissionais de excelência na <span class="text-primary">área da saúde</span>
                </h1>

                <!-- Subtítulo / Frase da Marca -->
                <p class="text-base sm:text-lg font-bold text-secondary/90 max-w-2xl mx-auto leading-relaxed">
                    Somos mais que uma escola de saúde, somos uma casa onde seus integrantes partilham dos mesmos valores e objetivos.
                </p>

                <!-- Botões de Ação -->
                <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                        @click="scrollTo('cursos')"
                        class="w-full sm:w-auto bg-primary text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-3 cursor-pointer"
                    >
                        <span>Conhecer Nossos Cursos</span>
                        <Icon name="ph:arrow-right-bold" class="w-4 h-4" />
                    </button>

                    <NuxtLink
                        to="/auth/login"
                        class="w-full sm:w-auto bg-div-15 border border-divider text-text font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-div-30 transition-all flex items-center justify-center gap-2"
                    >
                        <Icon name="ph:user-bold" class="w-4 h-4 text-primary" />
                        <span>Ambiente do Aluno</span>
                    </NuxtLink>
                </div>

            </div>

            <!-- Métricas Oficiais da ENSI (Conforme Imagem de Referência) -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 md:mt-24 pt-10 border-t border-divider">
                
                <!-- Stat 1: 10 Anos no Mercado -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 text-center flex flex-col items-center justify-center group hover:border-primary/40 transition-all">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon name="ph:seal-check-bold" class="w-6 h-6" />
                    </div>
                    <p class="text-lg md:text-xl font-black text-text uppercase tracking-tight">10 Anos</p>
                    <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">No Mercado</p>
                </div>

                <!-- Stat 2: Mais de 1.000 Alunos -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 text-center flex flex-col items-center justify-center group hover:border-primary/40 transition-all">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon name="ph:users-three-bold" class="w-6 h-6" />
                    </div>
                    <p class="text-lg md:text-xl font-black text-text uppercase tracking-tight">Mais de 1.000</p>
                    <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Alunos</p>
                </div>

                <!-- Stat 3: + de 40 Cursos Realizados -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 text-center flex flex-col items-center justify-center group hover:border-primary/40 transition-all">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon name="ph:certificate-bold" class="w-6 h-6" />
                    </div>
                    <p class="text-lg md:text-xl font-black text-text uppercase tracking-tight">+ de 40 Cursos</p>
                    <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Realizados</p>
                </div>

                <!-- Stat 4: Dezenas de Produções Científicas -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 text-center flex flex-col items-center justify-center group hover:border-primary/40 transition-all">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon name="ph:brain-bold" class="w-6 h-6" />
                    </div>
                    <p class="text-lg md:text-xl font-black text-text uppercase tracking-tight">Dezenas de</p>
                    <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Produções Científicas</p>
                </div>

            </div>

        </div>
    </section>
</template>

<style scoped>
/* SFC Style - Hero ENSI */
</style>
