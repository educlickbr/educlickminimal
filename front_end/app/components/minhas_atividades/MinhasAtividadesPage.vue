<template>
    <div class="flex flex-col gap-5">

        <!-- ── ESTADO 1: Lista de cursos ─────────────────── -->
        <Transition name="card-enter" mode="out-in">
            <div v-if="!ctx.programaSelecionado.value" class="flex flex-col gap-5">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Meus cursos</span>
                    <span class="text-[9px] font-black text-secondary/20 bg-white/5 px-2 py-0.5 rounded-full">{{ ctx.programas.value.length }} curso(s)</span>
                </div>

                <div v-if="ctx.loadingProgramas.value" class="flex flex-col items-center justify-center py-24 gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">Carregando...</span>
                </div>

                <div v-else-if="ctx.programas.value.length === 0" class="flex flex-col items-center justify-center py-24 gap-2">
                    <p class="text-sm font-bold text-white/30">Nenhum curso encontrado</p>
                    <p class="text-[10px] font-bold text-white/15 uppercase tracking-widest mt-1">Você ainda não tem matrículas ativas</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <button v-for="p in ctx.programas.value" :key="p.id_programa"
                        @click="entrarNoCurso(p)"
                        class="curso-card group"
                    >
                        <div class="curso-accent" />
                        <div class="curso-avatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                        </div>
                        <div class="flex flex-col items-start gap-1 text-left flex-1 min-w-0">
                            <span class="curso-titulo">{{ p.descricao }}</span>
                            <span class="curso-sub">{{ p.nome_curso }}</span>
                            <span class="curso-ciclos">{{ p.qtd_ciclos }} ciclo(s)</span>
                        </div>
                        <svg class="curso-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
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
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Cursos</span>
                    </button>
                    <div class="flex flex-col leading-none gap-0.5">
                        <span class="text-sm font-black text-white/85">{{ ctx.programaSelecionado.value.descricao }}</span>
                        <span class="text-[10px] font-bold text-white/25">{{ ctx.programaSelecionado.value.nome_curso }}</span>
                    </div>
                </div>

                <div class="flex gap-5" style="height: calc(100vh - 220px); min-height: 500px;">

                    <!-- ══ SEM CONTEÚDO: visão central em tamanho grande ══ -->
                    <template v-if="!ctx.conteudoAtivo.value">

                        <!-- Visão Menu: árvore grande (como o currículo) -->
                        <ConteudoArvore v-if="ctx.visaoCentral.value === 'menu'" :ctx="ctx" class="flex-1">
                            <template #header-right>
                                <VisaoToggle :ctx="ctx" />
                            </template>
                        </ConteudoArvore>

                        <!-- Visão Resumo: lista grande -->
                        <div v-else class="flex-1 flex flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
                            <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
                                <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Resumo</span>
                                <div class="flex items-center gap-2">
                                    <VisaoToggle :ctx="ctx" />
                                    <button class="filtros-btn lg:!hidden" @click="filtrosAbertos = true" title="Filtros e resumo">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"></path></svg>
                                        Filtros
                                    </button>
                                </div>
                            </div>
                            <div v-if="ctx.loadingEstrutura.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                                <span class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">Carregando...</span>
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
                        <div class="hidden lg:flex w-80 flex-shrink-0 flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
                            <ConteudoArvore v-if="ctx.visaoCentral.value === 'menu'" :ctx="ctx" class="flex-1">
                                <template #header-right>
                                    <VisaoToggle :ctx="ctx" />
                                </template>
                            </ConteudoArvore>
                            <template v-else>
                                <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
                                    <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Resumo</span>
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
                        <div class="flex-1 flex flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
                            <div class="flex items-center justify-between gap-2 px-4 pt-3 shrink-0">
                                <button @click="ctx.voltarParaLista()" class="voltar-lista-btn">
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    Todos os conteúdos
                                </button>
                                <div class="flex items-center gap-2 lg:hidden">
                                    <button class="filtros-btn" @click="visaoAbertos = true" title="Navegar pelos conteúdos">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M6 12h12M10 18h4"></path></svg>
                                        Menu
                                    </button>
                                    <button class="filtros-btn" @click="filtrosAbertos = true" title="Filtros e resumo">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"></path></svg>
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

    <!-- Drawer mobile: filtros e resumo (mesmo componente do sidebar) -->
    <Teleport to="body">
        <div v-if="filtrosAbertos" class="drawer-overlay" @click="filtrosAbertos = false">
            <div class="drawer-panel" @click.stop>
                <div class="drawer-header">
                    <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Filtros e resumo</span>
                    <button @click="filtrosAbertos = false" class="drawer-close" title="Fechar">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    </button>
                </div>
                <div class="drawer-content">
                    <MinhasAtividadesSidebar :ctx="ctx" />
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Drawer mobile: visão (menu/árvore ou resumo) abrindo da direita -->
    <Teleport to="body">
        <div v-if="visaoAbertos" class="drawer-overlay" @click="visaoAbertos = false">
            <div class="drawer-panel" @click.stop>
                <div class="drawer-header">
                    <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">
                        {{ ctx.visaoCentral.value === 'menu' ? 'Menu de conteúdos' : 'Resumo' }}
                    </span>
                    <button @click="visaoAbertos = false" class="drawer-close" title="Fechar">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
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
.curso-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.025); cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; text-align: left; }
.curso-card:hover { border-color: rgba(139,92,246,0.25); background: rgba(139,92,246,0.03); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
.curso-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #7c3aed, #a78bfa); opacity: 0; transition: opacity 0.2s; }
.curso-card:hover .curso-accent { opacity: 1; }
.curso-avatar { width: 40px; height: 40px; border-radius: 11px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.16); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.curso-titulo { font-size: 13px; font-weight: 800; color: rgba(232,230,240,0.9); }
.curso-sub { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); }
.curso-ciclos { font-size: 9px; font-weight: 700; color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.06); padding: 1px 8px; border-radius: 5px; }
.curso-arrow { color: rgba(255,255,255,0.2); flex-shrink: 0; transition: all 0.2s; }
.curso-card:hover .curso-arrow { color: #a78bfa; transform: translateX(2px); }

/* ── Botão voltar ──────────────────────────────── */
.voltar-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.voltar-btn:hover { color: #c4b5fd; border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.05); }

/* ── Accordion ─────────────────────────────────── */
.accordion-trigger { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border-radius: 10px; border: none; background: rgba(255,255,255,0.02); color: rgba(232,230,240,0.85); font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: left; }
.accordion-trigger:hover { background: rgba(139,92,246,0.05); }
.accordion-trigger.sub { padding: 7px 12px; border-radius: 8px; font-size: 11px; background: rgba(255,255,255,0.015); }
.accordion-arrow { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: transform 0.15s; }
.accordion-arrow.rotated { transform: rotate(180deg); }
.accordion-count { margin-left: auto; font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
.accordion-content { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 2px 16px; border-left: 1px solid rgba(255,255,255,0.05); margin-left: 6px; }

.empty-state { padding: 3rem 1.5rem; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }

/* ── Header do painel / botões ─────────────────── */
.filtros-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.06); color: #a78bfa; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all 0.15s; }
.filtros-btn:hover { background: rgba(139,92,246,0.12); }
.voltar-lista-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.45); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.voltar-lista-btn:hover { color: #c4b5fd; border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.05); }

/* ── Drawer mobile ─────────────────────────────── */
.drawer-overlay { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,0.7); backdrop-filter: blur(3px); }
.drawer-panel { position: absolute; right: 0; top: 0; bottom: 0; width: min(340px, 85vw); background: #13131a; border-left: 1px solid rgba(139,92,246,0.2); display: flex; flex-direction: column; animation: drawerSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes drawerSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.drawer-close { width: 28px; height: 28px; border-radius: 8px; border: none; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.drawer-close:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
.drawer-content { flex: 1; overflow-y: auto; padding: 14px 16px; }

/* ── Transição cards → contexto ────────────────── */
.card-enter-enter-active, .card-enter-leave-active { transition: all 0.25s ease; }
.card-enter-enter-from { opacity: 0; transform: scale(0.98); }
.card-enter-leave-to { opacity: 0; transform: scale(1.02); }
</style>
