<template>
    <section id="diferencial" class="relative px-6 md:px-16 py-24 md:py-32 overflow-hidden">
        <!-- Fundo violeta escuro -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#1a102e] via-background to-[#1a102e] -z-10" />

        <!-- Dot pattern -->
        <div class="absolute inset-0 z-0 opacity-[0.04]"
            style="background-image: radial-gradient(#8b5cf6 1.5px, transparent 1.5px); background-size: 20px 20px;" />

        <!-- Glows -->
        <div class="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div class="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl -z-10" />

        <div class="max-w-4xl mx-auto text-center relative z-10">
            <span
                class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-6 inline-block">
                O diferencial
            </span>

            <h2 class="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-8">
                O básico pronto.
                <span class="text-primary">O resto? Do seu jeito.</span>
            </h2>

            <p class="text-secondary text-lg leading-relaxed max-w-3xl mx-auto mb-12">
                O Educlick não é só mais um software de prateleira. É uma base sólida
                e pronta construída com anos de experiência em gestão escolar.
                A diferença entre contratar alguém para desenhar tudo do zero e escolher
                o Educlick é simples: aqui você parte de algo que já funciona,
                e desenvolve apenas o que é específico da sua operação.
                Menos tempo perdido com o óbvio, mais energia no que realmente diferencia
                sua escola.
            </p>

            <!-- CTA -->
            <button
                class="bg-primary text-white font-black text-sm uppercase tracking-wider px-10 py-5 rounded-xl transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary-dark"
                style="box-shadow: 5px 5px 0 #4c1d95;">
                Quero conhecer o Educlick
            </button>

            <p class="text-secondary/40 text-xs mt-6">
                Sem contrato de longo prazo. Sem surpresas.
            </p>
        </div>
    </section>
</template>

<style scoped>
/* SFC Style */
</style>
