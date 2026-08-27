<template>
    <div class="flex flex-col gap-5">

        <!-- ── ESTADO 1: Lista de cursos ─────────────────── -->
        <Transition name="card-enter" mode="out-in">
            <div v-if="!ctx.programaSelecionado.value" class="flex flex-col gap-5">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Meus cursos</span>
                    <span class="text-[9px] font-black text-secondary bg-secondary-surface border border-divider px-2.5 py-0.5 rounded-full">
                        {{ ctx.programas.value.length }} curso(s)
                    </span>
                </div>

                <div v-if="ctx.loadingProgramas.value" class="flex flex-col items-center justify-center py-24 gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Carregando...</span>
                </div>

                <div v-else-if="ctx.programas.value.length === 0" class="flex flex-col items-center justify-center py-24 gap-2 empty-state-box">
                    <Icon name="ph:books-bold" class="w-8 h-8 text-secondary/30" />
                    <p class="text-sm font-bold text-text/80">Nenhum curso encontrado</p>
                    <p class="text-[10px] font-black text-secondary/60 uppercase tracking-widest mt-1">Você ainda não tem matrículas ativas</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <button v-for="p in ctx.programas.value" :key="p.id_programa"
                        @click="entrarNoCurso(p)"
                        class="curso-card group"
                    >
                        <div class="curso-accent" />
                        <div class="curso-avatar">
                            <Icon name="ph:student-bold" class="w-5 h-5" />
                        </div>
                        <div class="flex flex-col items-start gap-1 text-left flex-1 min-w-0">
                            <span class="curso-titulo">{{ p.descricao }}</span>
                            <span class="curso-sub">{{ p.nome_curso }}</span>
                            <span class="curso-ciclos">{{ p.qtd_ciclos }} ciclo(s)</span>
                        </div>
                        <Icon name="ph:caret-right-bold" class="curso-arrow w-4 h-4" />
                    </button>
                </div>
            </div>
        </Transition>

        <!-- ── ESTADO 2: Contexto do curso ──────────────── -->
        <Transition name="card-enter" mode="out-in">
            <div v-if="ctx.programaSelecionado.value" class="flex flex-col gap-4">
                <!-- Topo: voltar + programa -->
                <div class="flex items-center gap-3">
                    <button @click="ctx.voltarParaCursos()" class="voltar-btn" title="Voltar para meus cursos">
                        <Icon name="ph:caret-left-bold" class="w-3.5 h-3.5" />
                        <span>Cursos</span>
                    </button>
                    <div class="flex flex-col leading-none gap-1">
                        <span class="text-sm font-black text-text">{{ ctx.programaSelecionado.value.descricao }}</span>
                        <span class="text-[10px] font-black text-secondary/60">{{ ctx.programaSelecionado.value.nome_curso }}</span>
                    </div>
                </div>

                <div class="flex gap-5" style="height: calc(100vh - 220px); min-height: 500px;">

                    <!-- ══ SEM CONTEÚDO: visão central em tamanho grande ══ -->
                    <template v-if="!ctx.conteudoAtivo.value">

                        <!-- Visão Menu: árvore grande -->
                        <ConteudoArvore v-if="ctx.visaoCentral.value === 'menu'" :ctx="ctx" class="flex-1">
                            <template #header-right>
                                <VisaoToggle :ctx="ctx" />
                            </template>
                        </ConteudoArvore>

                        <!-- Visão Resumo: lista grande -->
                        <div v-else class="flex-1 flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative">
                            <div class="px-5 py-4 border-b border-divider bg-div-15 flex items-center justify-between gap-2">
                                <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Resumo</span>
                                <div class="flex items-center gap-2">
                                    <VisaoToggle :ctx="ctx" />
                                    <button class="filtros-btn lg:!hidden" @click="filtrosAbertos = true" title="Filtros e resumo">
                                        <Icon name="ph:funnel-bold" class="w-3 h-3" />
                                        Filtros
                                    </button>
                                </div>
                            </div>
                            <div v-if="ctx.loadingEstrutura.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                                <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Carregando...</span>
                            </div>
                            <div v-else class="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                <ConteudoLista
                                    :secoes="ctx.secoesLista.value"
                                    :ativo-id="null"
                                    @abrir="ctx.selecionarConteudo($event)" />
                            </div>
                        </div>
                    </template>

                    <!-- ══ COM CONTEÚDO: visão recolhe à esquerda + conteúdo no centro ══ -->
                    <template v-else>

                        <!-- Visão recolhida (desktop apenas) -->
                        <div class="hidden lg:flex w-80 flex-shrink-0 flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative">
                            <ConteudoArvore v-if="ctx.visaoCentral.value === 'menu'" :ctx="ctx" class="flex-1">
                                <template #header-right>
                                    <VisaoToggle :ctx="ctx" />
                                </template>
                            </ConteudoArvore>
                            <template v-else>
                                <div class="px-5 py-4 border-b border-divider bg-div-15 flex items-center justify-between gap-2">
                                    <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Resumo</span>
                                    <VisaoToggle :ctx="ctx" />
                                </div>
                                <div class="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                    <ConteudoLista
                                        :secoes="ctx.secoesLista.value"
                                        :ativo-id="ctx.conteudoAtivo.value?.id_conteudo || null"
                                        @abrir="ctx.selecionarConteudo($event)" />
                                </div>
                            </template>
                        </div>

                        <!-- Conteúdo no centro -->
                        <div class="flex-1 flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative">
                            <div class="flex items-center justify-between gap-2 px-4 pt-3 shrink-0">
                                <button @click="ctx.voltarParaLista()" class="voltar-lista-btn">
                                    <Icon name="ph:caret-left-bold" class="w-3 h-3" />
                                    Todos os conteúdos
                                </button>
                                <div class="flex items-center gap-2 lg:hidden">
                                    <button class="filtros-btn" @click="visaoAbertos = true" title="Navegar pelos conteúdos">
                                        <Icon name="ph:list-bold" class="w-3 h-3" />
                                        Menu
                                    </button>
                                    <button class="filtros-btn" @click="filtrosAbertos = true" title="Filtros e resumo">
                                        <Icon name="ph:funnel-bold" class="w-3 h-3" />
                                        Filtros
                                    </button>
                                </div>
                            </div>

                            <!-- Material -->
                            <ConteudoMaterial v-if="ctx.conteudoAtivo.value.tipo === 'material'"
                                :item="ctx.conteudoAtivo.value"
                                :abrir-arquivo="ctx.abrirArquivo"
                                @aberto="ctx.marcarMaterialVisto()" />

                            <!-- Atividade -->
                            <ConteudoAtividade v-else-if="ctx.conteudoAtivo.value.tipo === 'atividade'"
                                :item="ctx.conteudoAtivo.value"
                                :texto="ctx.textoAtividade.value"
                                :arquivo="ctx.arquivoAtividade.value"
                                :saving="ctx.savingAtividade.value"
                                :pode-entregar="ctx.podeEntregar.value"
                                :abrir-arquivo="ctx.abrirArquivo"
                                @update:texto="ctx.textoAtividade.value = $event"
                                @update:arquivo="ctx.arquivoAtividade.value = $event"
                                @rascunho="ctx.salvarAtividade('rascunho')"
                                @entregar="ctx.salvarAtividade('entregue')" />

                            <!-- Avaliação -->
                            <ConteudoAvaliacao v-else
                                :item="ctx.conteudoAtivo.value"
                                :submissao="ctx.submissaoAvaliacao.value"
                                :perguntas="ctx.perguntasAvaliacao.value"
                                :respostas="ctx.respostasAvaliacao.value"
                                :loading="ctx.loadingAvaliacao.value"
                                :saving="ctx.savingAvaliacao.value"
                                :pode-iniciar="ctx.podeIniciarAvaliacao.value"
                                :tempo-restante="ctx.tempoFormatado()"
                                :tempo-restante-seg="ctx.tempoRestanteSeg.value"
                                :timer-ativo="ctx.timerAtivo.value"
                                :abrir-arquivo="ctx.abrirArquivo"
                                :get-entidade-id="getEntidadeId"
                                :flags-avaliacao="ctx.flagsAvaliacao.value"
                                @iniciar="ctx.iniciarAvaliacao()"
                                @marcar-alternativa="ctx.marcarAlternativa($event.id_pergunta, $event.id_resposta)"
                                @marcar-texto="ctx.marcarTexto($event.id_pergunta, $event.texto)"
                                @marcar-arquivo="ctx.marcarArquivo($event.id_pergunta, $event.id_arquivo)"
                                @saida="toast.showToast('Você saiu da avaliação! Sua resposta continua salva.', { type: 'error' })"
                                @finalizar="ctx.finalizarAvaliacao()" />
                        </div>
                    </template>
                </div>
            </div>
        </Transition>
    </div>

    <!-- Drawer mobile: filtros e resumo -->
    <Teleport to="body">
        <div v-if="filtrosAbertos" class="drawer-overlay" @click="filtrosAbertos = false">
            <div class="drawer-panel" @click.stop>
                <div class="drawer-header">
                    <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Filtros e resumo</span>
                    <button @click="filtrosAbertos = false" class="drawer-close" title="Fechar">
                        <Icon name="ph:x-bold" class="w-3.5 h-3.5" />
                    </button>
                </div>
                <div class="drawer-content">
                    <MinhasAtividadesSidebar :ctx="ctx" />
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Drawer mobile: visão -->
    <Teleport to="body">
        <div v-if="visaoAbertos" class="drawer-overlay" @click="visaoAbertos = false">
            <div class="drawer-panel" @click.stop>
                <div class="drawer-header">
                    <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                        {{ ctx.visaoCentral.value === 'menu' ? 'Menu de conteúdos' : 'Resumo' }}
                    </span>
                    <button @click="visaoAbertos = false" class="drawer-close" title="Fechar">
                        <Icon name="ph:x-bold" class="w-3.5 h-3.5" />
                    </button>
                </div>
                <div class="drawer-content">
                    <ConteudoArvore v-if="ctx.visaoCentral.value === 'menu'" :ctx="ctx" class="h-full" />
                    <template v-else>
                        <ConteudoLista
                            :secoes="ctx.secoesLista.value"
                            :ativo-id="ctx.conteudoAtivo.value?.id_conteudo || null"
                            @abrir="ctx.selecionarConteudo($event)" />
                    </template>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMinhasAtividades } from "~/composables/programacao_atividades/useMinhasAtividades";
import { useToast } from "~/composables/useToast";
import ConteudoArvore from "~/components/minhas_atividades/ConteudoArvore.vue";
import ConteudoLista from "~/components/minhas_atividades/ConteudoLista.vue";
import VisaoToggle from "~/components/minhas_atividades/VisaoToggle.vue";
import ConteudoMaterial from "~/components/minhas_atividades/ConteudoMaterial.vue";
import ConteudoAtividade from "~/components/minhas_atividades/ConteudoAtividade.vue";
import ConteudoAvaliacao from "~/components/minhas_atividades/ConteudoAvaliacao.vue";
import MinhasAtividadesSidebar from "~/components/minhas_atividades/MinhasAtividadesSidebar.vue";

const props = defineProps<{
    ctx: ReturnType<typeof useMinhasAtividades>;
    getEntidadeId?: () => string | null;
}>();

const toast = useToast();
const filtrosAbertos = ref(false);
const visaoAbertos = ref(false);

function entrarNoCurso(p: any) {
    props.ctx.selecionarPrograma(p);
}

onMounted(() => props.ctx.fetchProgramas());
</script>

<style scoped>
/* ── Cards de curso ────────────────────────────── */
.curso-card {
    display: flex; align-items: center; gap: 14px; padding: 16px 18px;
    border-radius: 14px; border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface); cursor: pointer; transition: all 0.2s ease;
    position: relative; overflow: hidden; text-align: left;
}
.curso-card:hover {
    border-color: rgba(139,92,246,0.3);
    background: var(--color-secondary-surface-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.curso-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--color-primary); opacity: 0; transition: opacity 0.2s; }
.curso-card:hover .curso-accent { opacity: 1; }
.curso-avatar {
    width: 40px; height: 40px; border-radius: 11px;
    background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
    color: var(--color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.curso-titulo { font-size: 13px; font-weight: 900; color: var(--color-text); }
.curso-sub { font-size: 10px; font-weight: 700; color: var(--color-secondary); }
.curso-ciclos { font-size: 9px; font-weight: 900; color: var(--color-primary); background: rgba(139,92,246,0.1); padding: 2px 8px; border-radius: 6px; }
.curso-arrow { color: var(--color-secondary); flex-shrink: 0; transition: all 0.2s; }
.curso-card:hover .curso-arrow { color: var(--color-primary); transform: translateX(2px); }

/* ── Botão voltar ──────────────────────────────── */
.voltar-btn {
    display: flex; align-items: center; gap: 6px; padding: 7px 14px;
    border-radius: 9px; border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface); color: var(--color-secondary);
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s;
}
.voltar-btn:hover { color: var(--color-primary); border-color: rgba(139,92,246,0.3); background: var(--color-secondary-surface-hover); }

/* ── Accordion ─────────────────────────────────── */
.accordion-trigger { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border-radius: 10px; border: none; background: var(--color-secondary-surface); color: var(--color-text); font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: left; }
.accordion-trigger:hover { background: var(--color-secondary-surface-hover); }
.accordion-trigger.sub { padding: 7px 12px; border-radius: 8px; font-size: 11px; background: var(--color-secondary-surface); }
.accordion-arrow { flex-shrink: 0; color: var(--color-secondary); transition: transform 0.15s; }
.accordion-arrow.rotated { transform: rotate(180deg); }
.accordion-count { margin-left: auto; font-size: 9px; font-weight: 800; color: var(--color-secondary); background: var(--color-secondary-surface-hover); padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
.accordion-content { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 2px 16px; border-left: 1px solid var(--color-divider); margin-left: 6px; }

.empty-state-box {
    background: var(--color-secondary-surface);
    border: 1px dashed var(--color-divider);
    border-radius: 14px;
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-divider); border-radius: 4px; }

/* ── Header do painel / botões ─────────────────── */
.filtros-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(139,92,246,0.25); background: rgba(139,92,246,0.1); color: var(--color-primary); font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all 0.15s; }
.filtros-btn:hover { background: rgba(139,92,246,0.18); }
.voltar-lista-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 8px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.voltar-lista-btn:hover { color: var(--color-primary); border-color: rgba(139,92,246,0.3); background: var(--color-secondary-surface-hover); }

/* ── Drawer mobile ─────────────────────────────── */
.drawer-overlay { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
.drawer-panel { position: absolute; right: 0; top: 0; bottom: 0; width: min(340px, 85vw); background: var(--color-background); border-left: 1px solid var(--color-divider); display: flex; flex-direction: column; animation: drawerSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes drawerSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--color-divider); }
.drawer-close { width: 28px; height: 28px; border-radius: 8px; border: none; background: var(--color-secondary-surface); color: var(--color-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.drawer-close:hover { background: var(--color-secondary-surface-hover); color: var(--color-text); }
.drawer-content { flex: 1; overflow-y: auto; padding: 14px 16px; }

/* ── Transição cards → contexto ────────────────── */
.card-enter-enter-active, .card-enter-leave-active { transition: all 0.25s ease; }
.card-enter-enter-from { opacity: 0; transform: scale(0.98); }
.card-enter-leave-to { opacity: 0; transform: scale(1.02); }
</style>
