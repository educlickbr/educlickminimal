<template>
    <div class="flex flex-col gap-4">
        <!-- Header dinâmico por nível -->
        <div class="flex items-center gap-3">
            <!-- Nível 1: conteúdos -->
            <template v-if="!ctx.conteudoSelecionado.value">
                <div class="flex flex-col leading-none gap-0.5">
                    <span class="text-sm font-black text-text">Atividades e Entregas</span>
                    <span class="text-[10px] font-bold text-secondary/60">Conteúdos com entregas para corrigir</span>
                </div>
            </template>
            <!-- Nível 2: entregas do conteúdo -->
            <template v-else-if="!ctx.entregaSelecionada.value">
                <button @click="ctx.voltarParaConteudos()" class="voltar-btn" title="Voltar aos conteúdos">
                    <Icon name="ph:caret-left-bold" class="w-3.5 h-3.5" />
                    <span>Conteúdos</span>
                </button>
                <div class="flex flex-col leading-none gap-0.5 min-w-0">
                    <span class="text-sm font-black text-text truncate">{{ ctx.conteudoSelecionado.value.titulo }}</span>
                    <span class="text-[10px] font-bold text-secondary/60">
                        {{ tipoLabel(ctx.conteudoSelecionado.value.tipo) }} · {{ ctx.conteudoSelecionado.value.qtd_pendentes }} pendente(s) de {{ ctx.conteudoSelecionado.value.qtd_total }}
                        <span v-if="!ctx.conteudoSelecionado.value.eh_meu" class="text-amber-500">· 🔒 somente leitura</span>
                    </span>
                </div>
            </template>
            <!-- Nível 3: correção -->
            <template v-else>
                <div class="flex flex-col leading-none gap-0.5 min-w-0">
                    <span class="text-sm font-black text-text truncate">{{ ctx.entregaSelecionada.value.aluno_nome }}</span>
                    <span class="text-[10px] font-bold text-secondary/60">
                        Tentativa {{ ctx.entregaSelecionada.value.tentativa }} · {{ ctx.entregaSelecionada.value.nota !== null && ctx.entregaSelecionada.value.nota !== undefined ? 'Corrigida' : 'Pendente' }}
                    </span>
                </div>
            </template>
        </div>

        <!-- Corpo: lista + detalhe com recolhimento -->
        <div class="relative flex gap-5 overflow-hidden" style="height: calc(100vh - 220px); min-height: 500px;">
            <div class="flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                :class="classesColuna">
                <DocenteConteudosLista :ctx="ctx" />
            </div>

            <Transition name="painel-direita">
                <div v-if="ctx.conteudoSelecionado.value" class="flex gap-5 flex-1 min-w-0">
                    <div class="flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        :class="classesAlunos">
                        <DocenteEntregasLista :ctx="ctx" />
                    </div>

                    <Transition name="correcao-in">
                        <div v-if="ctx.entregaSelecionada.value"
                            class="flex-1 flex flex-col min-w-0 bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative">
                            <div class="flex items-center gap-2 px-3 pt-2.5 shrink-0">
                                <button @click="ctx.voltarParaEntregas()" class="voltar-btn" title="Voltar para conteúdos e alunos">
                                    <Icon name="ph:caret-left-bold" class="w-3.5 h-3.5" />
                                    <span>Voltar</span>
                                </button>
                            </div>
                            <div v-if="ctx.loadingDetalhe.value || !ctx.detalhe.value"
                                class="flex-1 flex flex-col items-center justify-center gap-3">
                                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                                <span class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Carregando entrega...</span>
                            </div>
                            <DocenteCorrecao v-else
                                :detalhe="ctx.detalhe.value"
                                :nota="ctx.notaCorrecao.value"
                                :comentario="ctx.comentarioCorrecao.value"
                                :saving="ctx.savingCorrecao.value"
                                :corrigivel="ctx.detalhe.value?.eh_meu === true"
                                :abrir-arquivo="abrirArquivo"
                                @update:nota="ctx.notaCorrecao.value = $event"
                                @update:comentario="ctx.comentarioCorrecao.value = $event"
                                @salvar="ctx.salvarCorrecao()" />
                        </div>
                    </Transition>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDocenteEntregas } from "~/composables/programacao_atividades/useDocenteEntregas";
import DocenteConteudosLista from "~/components/programacao_atividades/DocenteConteudosLista.vue";
import DocenteEntregasLista from "~/components/programacao_atividades/DocenteEntregasLista.vue";
import DocenteCorrecao from "~/components/programacao_atividades/DocenteCorrecao.vue";

const props = defineProps<{
    ctx: ReturnType<typeof useDocenteEntregas>;
}>();

const classesColuna = computed(() => {
    if (!props.ctx.conteudoSelecionado.value) {
        return "flex w-full relative z-10";
    }
    if (props.ctx.entregaSelecionada.value) {
        return "hidden lg:flex absolute left-0 top-0 bottom-0 z-10 w-80 -translate-x-[105%] opacity-0 pointer-events-none";
    }
    return "hidden lg:flex w-80 flex-shrink-0 relative z-10";
});

const classesAlunos = computed(() => {
    if (!props.ctx.entregaSelecionada.value) {
        return "flex w-full";
    }
    return "hidden lg:flex w-80 flex-shrink-0";
});

function tipoLabel(tipo: string): string {
    return tipo === "avaliacao" ? "Avaliação" : "Atividade";
}

async function abrirArquivo(id: string) {
    try {
        const res = (await $fetch("/api/r2/sign", { params: { id } })) as any;
        if (res?.signedUrl) window.open(res.signedUrl, "_blank");
    } catch (e) {
        console.error("Erro ao abrir arquivo", e);
    }
}

onMounted(() => props.ctx.fetchConteudos());
</script>

<style scoped>
.voltar-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 9px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
.voltar-btn:hover { color: var(--color-primary); border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.05); }

.painel-direita-enter-active, .painel-direita-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; }
.painel-direita-enter-from { transform: translateX(60px); opacity: 0; }
.painel-direita-leave-to { transform: translateX(100%); opacity: 0; }

.correcao-in-enter-active, .correcao-in-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; }
.correcao-in-enter-from { transform: translateX(80px); opacity: 0; }
.correcao-in-leave-to { transform: translateX(80px); opacity: 0; }
</style>
