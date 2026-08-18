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
                            <span class="curso-sub">{{ p.curso_nome }}</span>
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
                        <span class="text-[10px] font-bold text-white/25">{{ ctx.programaSelecionado.value.curso_nome }}</span>
                    </div>
                </div>

                <div class="flex gap-5" style="height: calc(100vh - 220px); min-height: 500px;">

                    <!-- ── ESQUERDA: árvore ───────────────── -->
                    <div class="w-80 flex-shrink-0 flex flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
                        <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01]">
                            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Conteúdos</span>
                        </div>

                        <div v-if="ctx.loadingEstrutura.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                            <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                            <span class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">Carregando...</span>
                        </div>

                        <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">

                            <!-- Programa -->
                            <div class="flex flex-col">
                                <button @click="ctx.toggleSection('programa')" class="accordion-trigger">
                                    <svg :class="{ 'rotated': ctx.isExpanded('programa') }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                    <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                                    Programa
                                    <span class="accordion-count">{{ ctx.getConteudos('programa').length }}</span>
                                </button>
                                <div v-if="ctx.isExpanded('programa')" class="accordion-content">
                                    <div v-if="ctx.isLoadingConteudos('programa')" class="flex items-center gap-2 p-3">
                                        <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                    </div>
                                    <ConteudoLinha v-for="c in ctx.getConteudos('programa')" :key="'prog_' + c.id_conteudo"
                                        :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                        @select="ctx.selecionarConteudo(c)" />
                                </div>
                            </div>

                            <!-- Componentes -->
                            <div v-if="(ctx.estrutura.value?.componentes || []).length > 0" class="flex flex-col">
                                <button @click="togglePasta('componentes')" class="accordion-trigger">
                                    <svg :class="{ 'rotated': pastaAberta.componentes }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                    <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                    Componentes
                                    <span class="accordion-count">{{ ctx.estrutura.value.componentes.length }}</span>
                                </button>
                                <div v-if="pastaAberta.componentes" class="accordion-content">
                                    <div v-for="comp in ctx.estrutura.value.componentes" :key="'comp_' + comp.id" class="flex flex-col">
                                        <button @click="ctx.toggleSection('componente:' + comp.id)" class="accordion-trigger sub">
                                            <svg :class="{ 'rotated': ctx.isExpanded('componente:' + comp.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                            <span class="flex-1 text-left truncate">{{ comp.nome }}</span>
                                            <span class="accordion-count">{{ ctx.getConteudos('componente:' + comp.id).length }}</span>
                                        </button>
                                        <div v-if="ctx.isExpanded('componente:' + comp.id)" class="accordion-content">
                                            <div v-if="ctx.isLoadingConteudos('componente:' + comp.id)" class="flex items-center gap-2 p-3">
                                                <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                            </div>
                                            <ConteudoLinha v-for="c in ctx.getConteudos('componente:' + comp.id)" :key="'comp_' + c.id_conteudo"
                                                :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                                @select="ctx.selecionarConteudo(c)" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Módulos/Ciclos -->
                            <div v-if="(ctx.estrutura.value?.modulos || []).length > 0" class="flex flex-col">
                                <button @click="togglePasta('modulos')" class="accordion-trigger">
                                    <svg :class="{ 'rotated': pastaAberta.modulos }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                    <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                    Módulos/Ciclos
                                    <span class="accordion-count">{{ ctx.estrutura.value.modulos.length }}</span>
                                </button>
                                <div v-if="pastaAberta.modulos" class="accordion-content">
                                    <div v-for="mod in ctx.estrutura.value.modulos" :key="'mod_' + mod.id" class="flex flex-col">
                                        <button @click="ctx.toggleSection('modulo:' + mod.id)" class="accordion-trigger sub">
                                            <svg :class="{ 'rotated': ctx.isExpanded('modulo:' + mod.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                            <span class="flex-1 text-left truncate">{{ mod.nome }}</span>
                                            <span class="accordion-count">{{ ctx.getConteudos('modulo:' + mod.id).length + ctx.aulasDoModulo(mod.id).length }}</span>
                                        </button>
                                        <div v-if="ctx.isExpanded('modulo:' + mod.id)" class="accordion-content">
                                            <div v-if="ctx.isLoadingConteudos('modulo:' + mod.id)" class="flex items-center gap-2 p-3">
                                                <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                            </div>
                                            <ConteudoLinha v-for="c in ctx.getConteudos('modulo:' + mod.id)" :key="'mod_' + c.id_conteudo"
                                                :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                                @select="ctx.selecionarConteudo(c)" />

                                            <!-- Aulas do módulo -->
                                            <div v-if="ctx.aulasDoModulo(mod.id).length > 0" class="flex flex-col ml-3 mt-2 mb-1">
                                                <span class="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <svg class="text-white/20" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                    Aulas
                                                </span>
                                                <div v-for="aula in ctx.aulasDoModulo(mod.id)" :key="'aula_' + aula.id" class="flex flex-col">
                                                    <button @click="ctx.toggleSection('calendario:' + aula.id)" class="accordion-trigger sub">
                                                        <svg :class="{ 'rotated': ctx.isExpanded('calendario:' + aula.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                                        <span class="flex-1 text-left truncate">{{ aula.nome }}</span>
                                                        <span class="accordion-count">{{ ctx.getConteudos('calendario:' + aula.id).length }}</span>
                                                    </button>
                                                    <div v-if="ctx.isExpanded('calendario:' + aula.id)" class="accordion-content">
                                                        <div v-if="ctx.isLoadingConteudos('calendario:' + aula.id)" class="flex items-center gap-2 p-3">
                                                            <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                                        </div>
                                                        <ConteudoLinha v-for="c in ctx.getConteudos('calendario:' + aula.id)" :key="'aula_' + c.id_conteudo"
                                                            :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                                            @select="ctx.selecionarConteudo(c)" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── DIREITA: conteúdo selecionado ───── -->
                    <div class="flex-1 flex flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
                        <div v-if="!ctx.conteudoAtivo.value" class="flex-1 flex flex-col items-center justify-center gap-2 empty-state">
                            <p class="text-sm font-bold text-white/30">Selecione um conteúdo</p>
                            <p class="text-[10px] font-bold text-white/15 uppercase tracking-widest mt-1">Escolha na árvore ao lado</p>
                        </div>

                        <template v-else>
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
                                @iniciar="ctx.iniciarAvaliacao()"
                                @marcar-alternativa="ctx.marcarAlternativa($event.id_pergunta, $event.id_resposta)"
                                @marcar-texto="ctx.marcarTexto($event.id_pergunta, $event.texto)"
                                @finalizar="ctx.finalizarAvaliacao()" />
                        </template>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useProgAtividadesCore } from "~/composables/programacao_atividades/useProgAtividadesCore";
import { useMinhasAtividades } from "~/composables/programacao_atividades/useMinhasAtividades";
import { useToast } from "~/composables/useToast";
import ConteudoLinha from "~/components/minhas_atividades/ConteudoLinha.vue";
import ConteudoMaterial from "~/components/minhas_atividades/ConteudoMaterial.vue";
import ConteudoAtividade from "~/components/minhas_atividades/ConteudoAtividade.vue";
import ConteudoAvaliacao from "~/components/minhas_atividades/ConteudoAvaliacao.vue";

const core = useProgAtividadesCore();
const toast = useToast();

const ctx = useMinhasAtividades({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});

const pastaAberta = reactive({
    componentes: false,
    modulos: false,
});

function togglePasta(pasta: "componentes" | "modulos") {
    pastaAberta[pasta] = !pastaAberta[pasta];
}

function entrarNoCurso(p: any) {
    ctx.selecionarPrograma(p);
}

onMounted(() => ctx.fetchProgramas());
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

/* ── Transição cards → contexto ────────────────── */
.card-enter-enter-active, .card-enter-leave-active { transition: all 0.25s ease; }
.card-enter-enter-from { opacity: 0; transform: scale(0.98); }
.card-enter-leave-to { opacity: 0; transform: scale(1.02); }
</style>
