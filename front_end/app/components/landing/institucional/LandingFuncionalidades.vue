<template>
    <section id="funcionalidades" class="px-6 md:px-16 py-24 md:py-32 relative">
        <!-- Background accent -->
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent -z-10" />

        <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-16">
                <span
                    class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 inline-block">
                    Funcionalidades
                </span>
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                    Tudo que você precisa, pronto para usar
                </h2>
            </div>

            <!-- Cards de funcionalidades -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Diário de Classe -->
                <div
                    class="bg-white/[0.04] border border-white/5 rounded-xl overflow-hidden group hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <div class="p-7 flex-1">
                        <div
                            class="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                            <Icon name="ph:clipboard-text-bold" class="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 class="text-lg font-bold mb-3">
                            Diário de Classe Inteligente
                        </h3>
                        <p class="text-secondary text-sm leading-relaxed">
                            Frequência integrada. Aluno enviou atestado? O sistema processa
                            e automatiza abonos — menos trabalho manual pra secretaria.
                        </p>
                    </div>
                    <div class="px-7 pb-7">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Automação
                        </span>
                    </div>
                </div>

                <!-- Processo Seletivo -->
                <div
                    class="bg-white/[0.04] border border-white/5 rounded-xl overflow-hidden group hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <div class="p-7 flex-1">
                        <div
                            class="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                            <Icon name="ph:files-bold" class="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 class="text-lg font-bold mb-3">
                            Processo Seletivo & Matrícula Digital
                        </h3>
                        <p class="text-secondary text-sm leading-relaxed">
                            Da inscrição ao contrato e documentos. Fluxo completo pro aluno,
                            painel de controle centralizado pra sua equipe.
                        </p>
                    </div>
                    <div class="px-7 pb-7">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Ponta a ponta
                        </span>
                    </div>
                </div>

                <!-- Calendários -->
                <div
                    class="bg-white/[0.04] border border-white/5 rounded-xl overflow-hidden group hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <div class="p-7 flex-1">
                        <div
                            class="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-5">
                            <Icon name="ph:calendar-bold" class="w-6 h-6 text-sky-400" />
                        </div>
                        <h3 class="text-lg font-bold mb-3">
                            Gestão de Espaços e Calendários
                        </h3>
                        <p class="text-secondary text-sm leading-relaxed">
                            Calendário escolar + salas integrados. Sem choque de horários,
                            com visibilidade em tempo real.
                        </p>
                    </div>
                    <div class="px-7 pb-7">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            Integração
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
