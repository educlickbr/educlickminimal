<script setup lang="ts">
/**
 * LandingDuvidas.vue - Seção de Dúvidas Frequentes (FAQ Accordion) da ENSI
 *
 * Exibe os esclarecimentos das dúvidas mais comuns dos alunos em formato de acordeão interativo.
 */

const openIndex = ref<number | null>(null);

const toggleAccordion = (index: number) => {
    openIndex.value = openIndex.value === index ? null : index;
};

const duvidas = [
    {
        pergunta: "É possível fazer aulas isoladas dos cursos de aprimoramento, formação e capacitação?",
        resposta: "Se for a primeira vez que participa NÃO é possível fazer aulas isoladas dentro dos cursos de capacitação, formação e aprimoramento, pois os conteúdos são interligados e obedecem a uma sequência ordenada e progressiva. Queremos que você tenha a melhor formação e para isso nossa equipe acompanha de perto a evolução de cada aluno."
    },
    {
        pergunta: "Sou aluno ENSI, posso refazer aulas isoladas do curso que conclui?",
        resposta: "SIM. Se você já fez o curso na ENSI, você pode repetir a(s) aula(s) que desejar de forma isolada. Desta maneira, você estará reforçando o aprendizado."
    },
    {
        pergunta: "O que acontece se eu faltar em alguma aula do curso?",
        resposta: "Todo aluno que não comparece a uma ou mais aulas de forma justificada é convidado a realizar reposição em outra turma. A ENSI quer que todos os alunos tenham a mesma experiência e qualidade na sua formação."
    },
    {
        pergunta: "Os cursos on-line ficam gravados?",
        resposta: "Alguns sim, outros não. Na modalidade on-line, os cursos podem ter atividades síncronas e/ou assíncronas, interativas ou não, a depender dos objetivos e programa. Ao se inscrever verifique em qual modelo o curso pretendido se encaixa."
    },
    {
        pergunta: "Quais são as formas de pagamento?",
        resposta: "Os pagamentos podem ser realizados por transferência bancária, boletos, PIX. Para cursos e eventos adquiridos via e-commerce poderá ser utilizado cartão de crédito."
    },
    {
        pergunta: "Alunos ENSI tem desconto em outros cursos?",
        resposta: "SIM. É considerado aluno ENSI com direito a desconto, aquele que está matriculado em curso de longa duração ou que já realizou um total de 120 h/a em cursos diversos."
    }
];
</script>

<template>
    <section id="duvidas" class="py-20 md:py-28 px-5 md:px-16 bg-background relative border-t border-divider">
        <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            <!-- Coluna da Esquerda: Título / Chamada Principal -->
            <div class="lg:col-span-5 space-y-4">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md inline-block">
                    Dúvidas Frequentes
                </span>
                <h2 class="text-3xl md:text-4xl font-black text-primary tracking-tight leading-[1.2]">
                    Aqui dispomos esclarecimentos para dúvidas mais comuns. Veja se elas também atendem você.
                </h2>
            </div>

            <!-- Coluna da Direita: Acordeão de Perguntas & Respostas -->
            <div class="lg:col-span-7 space-y-2">
                <div
                    v-for="(item, idx) in duvidas"
                    :key="idx"
                    class="border-b border-divider transition-colors"
                >
                    <!-- Pergunta (Trigger Botão) -->
                    <button
                        @click="toggleAccordion(idx)"
                        class="w-full py-5 text-left flex items-center justify-between gap-4 font-bold text-sm md:text-base text-text hover:text-primary transition-colors cursor-pointer group"
                    >
                        <span class="pr-2 leading-snug">{{ item.pergunta }}</span>
                        <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200"
                             :class="openIndex === idx ? 'bg-primary/20 text-primary rotate-90' : 'text-primary group-hover:bg-primary/10'">
                            <Icon name="ph:caret-right-bold" class="w-4 h-4" />
                        </div>
                    </button>

                    <!-- Resposta (Conteúdo Expansível) -->
                    <Transition
                        enter-active-class="transition-all duration-200 ease-out overflow-hidden"
                        enter-from-class="max-h-0 opacity-0 py-0"
                        enter-to-class="max-h-96 opacity-100 py-3"
                        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
                        leave-from-class="max-h-96 opacity-100 py-3"
                        leave-to-class="max-h-0 opacity-0 py-0"
                    >
                        <div v-show="openIndex === idx" class="pb-5 pt-1">
                            <div class="bg-div-15 border border-divider rounded-xl p-4 md:p-5 text-xs md:text-sm font-bold text-secondary/90 leading-relaxed shadow-inner">
                                {{ item.resposta }}
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>

        </div>
    </section>
</template>

<style scoped>
/* SFC Style - Dúvidas Frequentes ENSI */
</style>
