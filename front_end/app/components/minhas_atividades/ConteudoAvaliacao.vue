<template>
    <div class="flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">

        <!-- ── Estado: não iniciada ────────────────────── -->
        <template v-if="!submissao">
            <div class="flex flex-col gap-1">
                <span class="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Avaliação</span>
                <h2 class="text-lg font-black text-white/90">{{ item.titulo }}</h2>
                <p v-if="item.descricao" class="text-xs font-semibold text-white/40 leading-relaxed whitespace-pre-wrap">{{ item.descricao }}</p>
            </div>

            <div class="flex gap-2 flex-wrap">
                <span v-if="item.status_visibilidade === 'agendado'" class="status-pill status--agendado">
                    ⏰ Disponível a partir de {{ formatData(item.data_disponivel) }}
                </span>
                <span v-if="item.status_visibilidade === 'prazo_encerrado'" class="status-pill status--prazo">
                    ✕ Prazo encerrado em {{ formatData(item.data_entrega_limite) }}
                </span>
                <span v-if="item.data_entrega_limite && item.status_visibilidade === 'disponivel'" class="status-pill status--prazo-lite">
                    📅 Prazo: {{ formatData(item.data_entrega_limite) }}
                </span>
                <span v-if="item.duracao_minutos" class="status-pill status--prazo-lite">⏱ {{ item.duracao_minutos }} min</span>
                <span v-if="item.tentativas_permitidas" class="status-pill status--prazo-lite">🎯 {{ item.tentativas_permitidas }} tentativa(s)</span>
                <span v-if="item.avaliacao_status === 'entregue'" class="status-pill status--ok">✓ Entregue</span>
                <span v-if="item.avaliacao_nota !== null && item.avaliacao_nota !== undefined" class="status-pill status--nota">Nota: {{ item.avaliacao_nota }}</span>
            </div>

            <!-- Arquivo de referência -->
            <div v-if="item.id_arquivo" class="file-card">
                <div class="file-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span class="text-xs font-bold text-white/75">Arquivo de referência</span>
                    <span class="text-[10px] font-semibold text-white/30">Clique para abrir</span>
                </div>
                <button @click="abrirArquivo(item.id_arquivo)" class="open-btn">Abrir</button>
            </div>

            <!-- Já entregue -->
            <div v-if="item.avaliacao_status === 'entregue'" class="entregue-card">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span class="text-sm font-black text-white/80">Avaliação entregue!</span>
                <span class="text-[11px] font-semibold text-white/30">Aguardando correção</span>
            </div>

            <!-- Iniciar -->
            <div v-else-if="item.status_visibilidade === 'disponivel'" class="iniciar-card">
                <p class="text-xs font-semibold text-white/40 leading-relaxed text-center max-w-md">
                    Ao iniciar, o cronômetro começa a contar. Suas respostas serão enviadas automaticamente ao término do tempo.
                </p>
                <button @click="$emit('iniciar')" class="btn-iniciar" :disabled="loading">
                    <div v-if="loading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {{ loading ? "Preparando..." : "Iniciar avaliação" }}
                </button>
            </div>

            <!-- Bloqueado -->
            <div v-else class="bloqueado-card">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span class="text-sm font-black text-white/60">Avaliação indisponível</span>
                <span v-if="item.status_visibilidade === 'agendado'" class="text-[11px] font-semibold text-white/25">
                    Disponível a partir de {{ formatData(item.data_disponivel) }}
                </span>
                <span v-else class="text-[11px] font-semibold text-white/25">Prazo encerrado</span>
            </div>
        </template>

        <!-- ── Estado: em andamento ────────────────────── -->
        <template v-else>
            <!-- Timer -->
            <div v-if="timerAtivo" class="timer-bar" :class="{ 'timer-bar--alert': tempoRestanteSeg <= 300 }">
                <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span class="text-xs font-black uppercase tracking-widest">Tempo restante</span>
                </div>
                <span class="text-sm font-black tabular-nums">{{ tempoRestante }}</span>
            </div>

            <!-- Perguntas -->
            <div v-for="(p, idx) in perguntas" :key="p.id_pergunta" class="pergunta-card">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="pergunta-num">{{ idx + 1 }}</span>
                        <span class="pergunta-tipo">{{ p.tipo === 'dissertativa' ? 'Dissertativa' : 'Múltipla escolha' }}</span>
                        <span v-if="p.pontuacao > 0" class="pergunta-pontos">{{ p.pontuacao }} pts</span>
                    </div>
                    <span v-if="p.obrigatoria" class="text-[9px] font-bold text-white/20 uppercase">* obrigatória</span>
                </div>

                <p class="pergunta-enunciado whitespace-pre-wrap">{{ p.enunciado }}</p>

                <!-- Anexo da pergunta -->
                <button v-if="p.id_arquivo" @click="abrirArquivo(p.id_arquivo)" class="pergunta-anexo" title="Abrir anexo">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                    Anexo
                </button>

                <!-- Múltipla escolha -->
                <div v-if="p.tipo === 'multipla_escolha'" class="flex flex-col gap-2 mt-3">
                    <button v-for="alt in p.alternativas" :key="alt.id_resposta_possivel"
                        @click="$emit('marcar-alternativa', { id_pergunta: p.id_pergunta, id_resposta: alt.id_resposta_possivel })"
                        class="alternativa"
                        :class="{ 'alternativa--selecionada': respostaDe(p.id_pergunta)?.id_resposta_possivel === alt.id_resposta_possivel }"
                    >
                        <div class="radio" :class="{ 'radio--on': respostaDe(p.id_pergunta)?.id_resposta_possivel === alt.id_resposta_possivel }">
                            <svg v-if="respostaDe(p.id_pergunta)?.id_resposta_possivel === alt.id_resposta_possivel" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <circle cx="5" cy="5" r="3" fill="#8b5cf6"/>
                            </svg>
                        </div>
                        <span class="alternativa-texto">{{ alt.texto }}</span>
                        <button v-if="alt.id_arquivo" @click.stop="abrirArquivo(alt.id_arquivo)" class="alternativa-anexo" title="Abrir anexo">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                        </button>
                    </button>
                </div>

                <!-- Dissertativa -->
                <textarea v-else
                    :value="respostaDe(p.id_pergunta)?.texto_resposta || ''"
                    @input="$emit('marcar-texto', { id_pergunta: p.id_pergunta, texto: ($event.target as HTMLTextAreaElement).value })"
                    rows="3"
                    placeholder="Digite sua resposta..."
                    class="dissertativa-input"
                />
            </div>

            <!-- Finalizar -->
            <div class="flex items-center justify-between pt-2 border-t border-white/5">
                <span class="text-[10px] font-bold text-white/20">{{ perguntas.length }} pergunta(s) · tentativa {{ submissao.tentativa }}</span>
                <button @click="$emit('finalizar')" class="btn-finalizar" :disabled="saving">
                    <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {{ saving ? "Enviando..." : "Finalizar e entregar" }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    item: any;
    submissao: any;
    perguntas: any[];
    respostas: any[];
    loading: boolean;
    saving: boolean;
    podeIniciar: boolean;
    tempoRestante: string;
    tempoRestanteSeg: number;
    timerAtivo: boolean;
    abrirArquivo: (id: string) => void;
}>();

defineEmits<{
    iniciar: [];
    finalizar: [];
    "marcar-alternativa": [payload: { id_pergunta: string; id_resposta: string }];
    "marcar-texto": [payload: { id_pergunta: string; texto: string }];
}>();

function respostaDe(idPergunta: string) {
    return props.respostas.find((r: any) => r.id_pergunta === idPergunta);
}

function formatData(d: string | null): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
</script>

<style scoped>
.status-pill { font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 8px; }
.status--agendado { background: rgba(251,191,36,0.08); color: #fbbf24; border: 1px solid rgba(251,191,36,0.15); }
.status--prazo { background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.15); }
.status--prazo-lite { background: rgba(148,163,184,0.08); color: #94a3b8; border: 1px solid rgba(148,163,184,0.15); }
.status--ok { background: rgba(52,211,153,0.08); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.15); }
.status--nota { background: rgba(139,92,246,0.1); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.2); }

.file-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
.file-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.16); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.open-btn { padding: 8px 18px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
.open-btn:hover { transform: translateY(-1px); }

.iniciar-card { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px 24px; border-radius: 14px; border: 1px solid rgba(139,92,246,0.15); background: rgba(139,92,246,0.03); }
.btn-iniciar { padding: 11px 28px; border-radius: 10px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 4px 14px rgba(139,92,246,0.35); }
.btn-iniciar:hover:not(:disabled) { transform: translateY(-1px); }
.btn-iniciar:disabled { opacity: 0.6; cursor: wait; }

.entregue-card, .bloqueado-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 48px 24px; border-radius: 14px; border: 1px solid rgba(52,211,153,0.15); background: rgba(52,211,153,0.03); color: #6ee7b7; }
.bloqueado-card { border-color: rgba(148,163,184,0.12); background: rgba(148,163,184,0.02); color: #94a3b8; }

/* Timer */
.timer-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 10px; border: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.05); color: #c4b5fd; position: sticky; top: 0; z-index: 5; backdrop-filter: blur(6px); }
.timer-bar--alert { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.07); color: #f87171; }

/* Perguntas */
.pergunta-card { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.015); }
.pergunta-num { width: 24px; height: 24px; border-radius: 7px; background: rgba(139,92,246,0.1); color: #c4b5fd; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pergunta-tipo { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.3); }
.pergunta-pontos { font-size: 9px; font-weight: 800; color: rgba(139,92,246,0.5); }
.pergunta-enunciado { font-size: 13px; font-weight: 700; color: rgba(232,230,240,0.85); line-height: 1.5; }
.pergunta-anexo { align-self: flex-start; display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 7px; border: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.06); color: #a78bfa; font-size: 9px; font-weight: 800; cursor: pointer; transition: all 0.15s; }
.pergunta-anexo:hover { background: rgba(139,92,246,0.12); }

/* Alternativas */
.alternativa { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.015); cursor: pointer; transition: all 0.15s; text-align: left; }
.alternativa:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
.alternativa--selecionada { border-color: rgba(139,92,246,0.35); background: rgba(139,92,246,0.05); }
.radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
.radio--on { border-color: #8b5cf6; }
.alternativa-texto { font-size: 12px; font-weight: 600; color: rgba(232,230,240,0.8); flex: 1; }
.alternativa-anexo { width: 24px; height: 24px; border-radius: 6px; border: none; background: transparent; color: rgba(255,255,255,0.25); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.alternativa-anexo:hover { color: #a78bfa; background: rgba(139,92,246,0.1); }

/* Dissertativa */
.dissertativa-input { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); color: rgba(232,230,240,0.8); font-size: 12px; font-weight: 600; outline: none; transition: all 0.15s; resize: vertical; font-family: inherit; }
.dissertativa-input:focus { border-color: rgba(139,92,246,0.35); box-shadow: 0 0 0 2px rgba(139,92,246,0.08); }

.btn-finalizar { padding: 10px 24px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 4px 14px rgba(139,92,246,0.35); }
.btn-finalizar:hover:not(:disabled) { transform: translateY(-1px); }
.btn-finalizar:disabled { opacity: 0.5; cursor: not-allowed; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
</style>
