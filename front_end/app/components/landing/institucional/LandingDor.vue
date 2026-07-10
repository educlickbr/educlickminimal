<template>
    <section id="dor" class="relative px-6 md:px-16 py-24 md:py-32">
        <!-- Background accent -->
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent -z-10" />

        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                <!-- Texto -->
                <div class="md:col-span-6 relative z-10">
                    <span
                        class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 inline-block">
                        O problema
                    </span>
                    <h2 class="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-8">
                        Por que os sistemas prontos deixam sua equipe na mão?
                    </h2>

                    <div
                        class="bg-white/[0.04] border border-white/5 rounded-xl p-6 md:p-8 -rotate-1 hover:rotate-0 transition-transform duration-300"
                        style="box-shadow: 4px 4px 0 rgba(139, 92, 246, 0.25);">
                        <p class="text-secondary leading-relaxed mb-4">
                            A maioria dos sistemas educacionais força sua escola a se encaixar em
                            um <strong class="text-text font-bold">modelo fechado</strong>.
                            Seu modelo pedagógico muda, o sistema não acompanha.
                        </p>
                        <p class="text-secondary leading-relaxed">
                            Resultado? Sua equipe cria planilhas paralelas, retrabalho e ruído
                            entre dois registros da mesma informação.
                        </p>

                        <div class="mt-6 flex flex-wrap gap-2">
                            <span
                                class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border border-danger/30 text-danger bg-danger/5">
                                Planilhas paralelas
                            </span>
                            <span
                                class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border border-warning/40 text-warning bg-warning/5">
                                Retrabalho
                            </span>
                            <span
                                class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border border-secondary/30 text-secondary bg-white/[0.02]">
                                Dupla informação
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Virada de chave -->
                <div class="md:col-span-6 mt-8 md:mt-0">
                    <div
                        class="bg-gradient-to-br from-primary-dark/30 to-primary/10 border border-primary/20 rounded-2xl p-8 relative overflow-hidden"
                        style="box-shadow: 4px 4px 0 rgba(139, 92, 246, 0.35);">
                        <!-- Glow interno -->
                        <div
                            class="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />

                        <Icon name="ph:lightbulb-filament-bold"
                            class="w-10 h-10 text-primary mb-4 relative z-10" />

                        <h3 class="text-xl font-black mb-4 relative z-10">
                            O Educlick resolve o que é comum a toda escola,
                            mas foi feito para ser <span class="text-primary">adaptado</span>
                            exatamente onde sua operação é única.
                        </h3>

                        <p class="text-secondary text-sm leading-relaxed relative z-10">
                            Não é só mais um sistema. É uma base sólida que cresce com você.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
