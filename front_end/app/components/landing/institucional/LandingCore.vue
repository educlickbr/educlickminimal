<template>
    <section id="core" class="px-6 md:px-16 py-24 md:py-32">
        <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-16">
                <span
                    class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 inline-block">
                    Como funciona
                </span>
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4">
                    Uma estrutura que separa o planejamento da execução
                </h2>
            </div>

            <!-- 3 Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Card 1 -->
                <div
                    class="group bg-white/[0.04] border border-white/5 rounded-xl p-7 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                    <div
                        class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                        class="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                        <Icon name="ph:stack-bold" class="w-6 h-6 text-primary" />
                    </div>
                    <h3 class="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
                        Base Pedagógica Reutilizável
                    </h3>
                    <p class="text-secondary text-sm leading-relaxed">
                        Cadastre componentes, módulos e matrizes curriculares uma única vez.
                        Atualize no repositório central e veja o reflexo em todas as turmas —
                        sem duplicar conteúdo manualmente.
                    </p>
                </div>

                <!-- Card 2 -->
                <div
                    class="group bg-white/[0.04] border border-white/5 rounded-xl p-7 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                    <div
                        class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                        class="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                        <Icon name="ph:student-bold" class="w-6 h-6 text-primary" />
                    </div>
                    <h3 class="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
                        Conteúdo que Acompanha o Aluno
                    </h3>
                    <p class="text-secondary text-sm leading-relaxed">
                        O aluno recebe o material base do curso combinado com o que há de mais
                        novo: avisos da semana, tarefas com prazo, conteúdos temporários —
                        tudo organizado no programa vigente.
                    </p>
                </div>

                <!-- Card 3 -->
                <div
                    class="group bg-white/[0.04] border border-white/5 rounded-xl p-7 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                    <div
                        class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                        class="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                        <Icon name="ph:shopping-cart-bold" class="w-6 h-6 text-primary" />
                    </div>
                    <h3 class="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
                        Operação Comercial sem Atrito
                    </h3>
                    <p class="text-secondary text-sm leading-relaxed">
                        Crie ofertas de cursos, oficinas ou extensão em poucos cliques.
                        O sistema organiza ciclos e gerencia requisitos automaticamente.
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>
