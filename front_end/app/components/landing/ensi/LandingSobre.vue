<script setup lang="ts">
/**
 * LandingSobre.vue - Seção Institucional / História da ENSI
 *
 * Apresenta a história oficial da ENSI, fundada em 2013 por docentes universitários da área da saúde.
 */
const areasSaude = [
    "Biomedicina",
    "Enfermagem",
    "Farmácia",
    "Fisioterapia",
    "Fonoaudiologia",
    "Nutrição",
    "Psicologia"
];
</script>

<template>
    <section id="sobre" class="py-20 md:py-28 px-5 md:px-16 bg-background relative border-t border-divider">
        <div class="max-w-6xl mx-auto space-y-16">
            
            <!-- Cabeçalho da Seção -->
            <div class="text-center max-w-3xl mx-auto space-y-4">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md">
                    História & Propósito
                </span>
                <h2 class="text-3xl md:text-4xl font-black text-text tracking-tight">
                    Nossa trajetória na formação em saúde
                </h2>
                <p class="text-base font-bold text-primary italic max-w-2xl mx-auto">
                    “Somos mais que uma escola de saúde, somos uma casa onde seus integrantes partilham dos mesmos valores e objetivos.”
                </p>
            </div>

            <!-- História Oficial da ENSI -->
            <div class="bg-div-15 border border-divider rounded-3xl p-8 md:p-12 space-y-6 max-w-4xl mx-auto shadow-sm">
                <div class="space-y-4 text-sm md:text-base font-bold text-secondary/90 leading-relaxed">
                    <p class="text-text font-black text-lg md:text-xl leading-snug">
                        Fundada em 2013, a Escola Nacional de Saúde Integrada (ENSI), teve sua história iniciada antes mesmo de sua concepção.
                    </p>
                    <p>
                        Ela se configurou a partir da experiência de um grupo de docentes universitários envolvidos na formação de profissionais de diversos cursos da área da saúde, entre elas a biomedicina, a enfermagem, a farmácia, a fisioterapia, a fonoaudiologia, a nutrição e a psicologia. Este grupo partilhava a experiência de desenvolver disciplinas integradas na graduação.
                    </p>
                </div>

                <!-- Badges das Áreas da Saúde Integradas -->
                <div class="pt-6 border-t border-divider space-y-3">
                    <p class="text-[10px] font-black uppercase tracking-widest text-primary">
                        Formação Integrada Multidisciplinar
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <span
                            v-for="area in areasSaude"
                            :key="area"
                            class="text-xs font-bold text-text bg-background border border-divider px-3.5 py-1.5 rounded-xl hover:border-primary/40 transition-colors"
                        >
                            {{ area }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Três Pilares ENSI -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Pilar 1 -->
                <div class="bg-div-15 border border-divider rounded-2xl p-8 hover:border-primary/40 transition-all group">
                    <div class="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Icon name="ph:first-aid-kit-bold" class="w-6 h-6" />
                    </div>
                    <h3 class="text-lg font-black text-text mb-3">Saúde Integrada</h3>
                    <p class="text-xs font-bold text-secondary/80 leading-relaxed">
                        Visão holística e interdisciplinar que une diferentes saberes da saúde para o cuidado completo do paciente.
                    </p>
                </div>

                <!-- Pilar 2 -->
                <div class="bg-div-15 border border-divider rounded-2xl p-8 hover:border-primary/40 transition-all group">
                    <div class="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Icon name="ph:graduation-cap-bold" class="w-6 h-6" />
                    </div>
                    <h3 class="text-lg font-black text-text mb-3">Docentes Universitários</h3>
                    <p class="text-xs font-bold text-secondary/80 leading-relaxed">
                        Corpo docente formado por professores experientes no ensino superior e na prática clínica.
                    </p>
                </div>

                <!-- Pilar 3 -->
                <div class="bg-div-15 border border-divider rounded-2xl p-8 hover:border-primary/40 transition-all group">
                    <div class="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Icon name="ph:atom-bold" class="w-6 h-6" />
                    </div>
                    <h3 class="text-lg font-black text-text mb-3">Produção Científica</h3>
                    <p class="text-xs font-bold text-secondary/80 leading-relaxed">
                        Forte embasamento teórico e incentivo à pesquisa e desenvolvimento de evidências científicas.
                    </p>
                </div>
            </div>

        </div>
    </section>
</template>

<style scoped>
/* SFC Style - Sobre ENSI */
</style>
