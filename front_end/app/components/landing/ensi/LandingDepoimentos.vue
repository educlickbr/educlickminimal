<script setup lang="ts">
/**
 * LandingDepoimentos.vue - Prova social e depoimentos de alunos da ENSI
 *
 * Contém depoimentos de exemplo com placeholders claros para o usuário substituir.
 */

/**
 * PLACEHOLDER: O usuário irá atualizar estes depoimentos com fotos, nomes e avaliações reais
 */
const depoimentos = [
    {
        id: 1,
        nome: "Mariana Silva",
        cargo: "Gerente de Inovação",
        empresa: "TechCorp",
        depoimento: "A pós-graduação na ENSI transformou completamente a minha visão estratégica de negócios. Os professores trazem cases reais que apliquei diretamente no meu trabalho.",
        curso: "MBA em Gestão & Inovação"
    },
    {
        id: 2,
        nome: "Carlos Eduardo",
        cargo: "Diretor de Operações",
        empresa: "LogiGroup",
        depoimento: "O treinamento In-Company realizado com nosso time elevou o nível de produtividade da equipe em poucas semanas. Excelente metodologia e acompanhamento.",
        curso: "Treinamento Corporativo"
    },
    {
        id: 3,
        nome: "Patricia Mendes",
        cargo: "Líder de Produtos",
        empresa: "Fintech Solutions",
        depoimento: "A plataforma de ensino é fantástica e a rede de networking criada durante o curso abriu portas incríveis para a minha transição de carreira.",
        curso: "Extensão em Leadership"
    }
];
</script>

<template>
    <section id="depoimentos" class="py-20 md:py-28 px-5 md:px-16 bg-background relative">
        <div class="max-w-6xl mx-auto space-y-16">
            
            <!-- Cabeçalho -->
            <div class="text-center max-w-3xl mx-auto space-y-4">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md">
                    Depoimentos
                </span>
                <h2 class="text-3xl md:text-4xl font-black text-text tracking-tight">
                    Histórias de sucesso que nos inspiram
                </h2>
                <p class="text-sm font-bold text-secondary/80">
                    Veja o que dizem os profissionais e empresas que transformaram suas trajetórias com a ENSI.
                </p>
            </div>

            <!-- Cards de Depoimentos (Placeholders) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    v-for="item in depoimentos"
                    :key="item.id"
                    class="bg-div-15 border border-divider rounded-2xl p-8 flex flex-col justify-between space-y-6 hover:border-primary/30 transition-all"
                >
                    <div class="space-y-4">
                        <!-- Aspas / Ícone -->
                        <div class="text-primary font-black text-4xl leading-none">“</div>
                        <p class="text-xs font-bold text-secondary/90 italic leading-relaxed">
                            {{ item.depoimento }}
                        </p>
                    </div>

                    <div class="pt-4 border-t border-divider flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            {{ item.nome.charAt(0) }}
                        </div>
                        <div>
                            <p class="text-xs font-black text-text">{{ item.nome }}</p>
                            <p class="text-[10px] font-bold text-secondary">{{ item.cargo }} • {{ item.empresa }}</p>
                            <span class="inline-block text-[9px] font-bold text-primary uppercase tracking-wider mt-1">
                                {{ item.curso }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>

<style scoped>
/* SFC Style - Depoimentos ENSI */
</style>
