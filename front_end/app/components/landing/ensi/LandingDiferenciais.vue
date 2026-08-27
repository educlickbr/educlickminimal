<script setup lang="ts">
/**
 * LandingDiferenciais.vue - Diferenciais competitivos da ENSI
 *
 * Apresenta os pontos fortes da instituição (plataforma digital, docentes, suporte).
 */
</script>

<template>
    <section id="diferenciais" class="py-20 md:py-28 px-5 md:px-16 bg-background relative border-t border-b border-divider">
        <div class="max-w-6xl mx-auto space-y-16">
            
            <!-- Cabeçalho -->
            <div class="text-center max-w-3xl mx-auto space-y-4">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md">
                    Diferenciais ENSI
                </span>
                <h2 class="text-3xl md:text-4xl font-black text-text tracking-tight">
                    Por que profissionais escolhem a ENSI?
                </h2>
                <p class="text-sm font-bold text-secondary/80">
                    Uma infraestrutura educacional moderna projetada para oferecer a melhor experiência de aprendizagem e acompanhamento.
                </p>
            </div>

            <!-- Grid de Diferenciais -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <!-- Diferencial 1 -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 relative overflow-hidden group">
                    <div class="h-1 bg-primary w-full absolute top-0 left-0"></div>
                    <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-4 mt-2">
                        <Icon name="ph:student-bold" class="w-5 h-5" />
                    </div>
                    <h3 class="text-base font-black text-text mb-2">Corpo Docente de Elite</h3>
                    <p class="text-xs font-bold text-secondary/80 leading-relaxed">
                        <!-- PLACEHOLDER -->
                        Aulas com executivos, diretores e consultores de grandes corporações nacionais e multinacionais.
                    </p>
                </div>

                <!-- Diferencial 2 -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 relative overflow-hidden group">
                    <div class="h-1 bg-primary w-full absolute top-0 left-0"></div>
                    <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-4 mt-2">
                        <Icon name="ph:desktop-bold" class="w-5 h-5" />
                    </div>
                    <h3 class="text-base font-black text-text mb-2">Plataforma Exclusiva</h3>
                    <p class="text-xs font-bold text-secondary/80 leading-relaxed">
                        <!-- PLACEHOLDER -->
                        Ambiente virtual de aprendizado intuitivo, moderno e acessível de qualquer dispositivo.
                    </p>
                </div>

                <!-- Diferencial 3 -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 relative overflow-hidden group">
                    <div class="h-1 bg-primary w-full absolute top-0 left-0"></div>
                    <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-4 mt-2">
                        <Icon name="ph:certificate-bold" class="w-5 h-5" />
                    </div>
                    <h3 class="text-base font-black text-text mb-2">Certificação Válida</h3>
                    <p class="text-xs font-bold text-secondary/80 leading-relaxed">
                        <!-- PLACEHOLDER -->
                        Certificados com chancela institucional de peso para enriquecer seu currículo e LinkedIn.
                    </p>
                </div>

                <!-- Diferencial 4 -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 relative overflow-hidden group">
                    <div class="h-1 bg-primary w-full absolute top-0 left-0"></div>
                    <div class="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mb-4 mt-2">
                        <Icon name="ph:headset-bold" class="w-5 h-5" />
                    </div>
                    <h3 class="text-base font-black text-text mb-2">Suporte Individualizado</h3>
                    <p class="text-xs font-bold text-secondary/80 leading-relaxed">
                        <!-- PLACEHOLDER -->
                        Equipe pedagógica dedicada a apoiar a sua jornada do primeiro dia até a conclusão do curso.
                    </p>
                </div>

            </div>

        </div>
    </section>
</template>

<style scoped>
/* SFC Style - Diferenciais ENSI */
</style>
