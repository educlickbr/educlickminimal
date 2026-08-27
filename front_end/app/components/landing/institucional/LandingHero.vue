<script setup lang="ts">
const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};
</script>

<template>
    <section
        class="relative min-h-[90vh] flex flex-col justify-center items-center px-6 pt-32 pb-20 overflow-hidden"
    >
        <!-- Dot pattern -->
        <div class="absolute inset-0 z-0 opacity-[0.06]"
            style="background-image: radial-gradient(#8b5cf6 1.5px, transparent 1.5px); background-size: 24px 24px;" />

        <!-- Abstract shapes -->
        <div
            class="absolute top-1/4 left-10 w-48 h-48 md:w-72 md:h-72 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div
            class="absolute bottom-1/4 right-10 w-56 h-56 md:w-80 md:h-80 bg-purple-600/15 rounded-full blur-3xl -z-10" />
        <div
            class="absolute top-1/3 right-1/3 w-32 h-32 border border-primary/20 rotate-12 -z-10 hidden md:block" />
        <div
            class="absolute bottom-1/3 left-1/4 w-24 h-24 border border-primary/15 rotate-45 -z-10 hidden md:block" />

        <!-- Content -->
        <div class="max-w-5xl z-10 text-center flex flex-col items-center gap-8">
            <h1
                class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl">
                O sistema de gestão educacional que se
                <span class="text-primary">
                    adapta à sua escola
                </span>
                . Não o contrário.
            </h1>

            <div
                class="bg-white/[0.04] border border-white/5 border-l-2 border-l-primary rounded-xl p-6 max-w-2xl text-left">
                <p class="text-secondary text-base md:text-lg leading-relaxed">
                    Chega de pagar por softwares engessados e ainda depender de planilhas.
                    O Educlick entrega um núcleo acadêmico completo com a flexibilidade
                    de um sistema feito para a realidade da sua instituição —
                    e não para uma média do mercado.
                </p>
            </div>

            <div class="mt-4">
                <button
                    @click="scrollTo('diferencial')"
                    class="bg-primary text-white font-black text-sm uppercase tracking-wider px-8 py-4 rounded-xl transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary-dark"
                    style="box-shadow: 5px 5px 0 #4c1d95;"
                >
                    Agende uma demonstração
                </button>
            </div>
        </div>

        <!-- Scroll indicator -->
        <div class="absolute bottom-8 animate-bounce opacity-40">
            <Icon name="ph:arrow-down-bold" class="w-6 h-6 text-primary" />
        </div>
    </section>
</template>

<style scoped>
/* SFC Style */
</style>
