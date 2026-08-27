<template>
    <div class="flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">

        <!-- ── Estado: não iniciada ────────────────────── -->
        <template v-if="!submissao">
            <div class="flex flex-col gap-1">
                <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Avaliação</span>
                <h2 class="text-lg font-black text-text">{{ item.titulo }}</h2>
                <p v-if="item.descricao" class="text-xs font-semibold text-secondary leading-relaxed whitespace-pre-wrap">{{ item.descricao }}</p>
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
                    <Icon name="ph:file-text-bold" class="w-5 h-5 text-primary" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span class="text-xs font-bold text-text">Arquivo de referência</span>
                    <span class="text-[10px] font-semibold text-secondary/60">Clique para abrir</span>
                </div>
                <button @click="abrirArquivo(item.id_arquivo)" class="open-btn">Abrir</button>
            </div>

            <!-- Já entregue -->
            <div v-if="item.avaliacao_status === 'entregue'" class="entregue-card">
                <Icon name="ph:check-circle-bold" class="w-7 h-7 text-emerald-500" />
                <span class="text-sm font-black text-text">Avaliação entregue!</span>
                <span v-if="item.avaliacao_nota !== null && item.avaliacao_nota !== undefined" class="nota-destaque">
                    Sua nota: {{ item.avaliacao_nota }}
                </span>
                <span v-else class="text-[11px] font-semibold text-secondary/60">Aguardando correção</span>
                <button v-if="podeIniciar" @click="$emit('iniciar')" class="btn-iniciar" :disabled="loading">
                    <div v-if="loading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Tentar novamente
                </button>
            </div>

            <!-- Feedback do professor -->
            <div v-if="item.avaliacao_status === 'entregue' && item.avaliacao_comentario" class="feedback-card">
                <span class="feedback-titulo">Feedback do professor</span>
                <p class="feedback-texto">{{ item.avaliacao_comentario }}</p>
                <span v-if="item.avaliacao_corrigido_por_nome || item.avaliacao_corrigido_em" class="feedback-meta">
                    Corrigido{{ item.avaliacao_corrigido_por_nome ? ' por ' + item.avaliacao_corrigido_por_nome : '' }}{{ item.avaliacao_corrigido_em ? ' · ' + formatarDataHora(item.avaliacao_corrigido_em) : '' }}
                </span>
            </div>

            <!-- Iniciar -->
            <div v-else-if="item.status_visibilidade === 'disponivel'" class="iniciar-card">
                <p class="text-xs font-semibold text-secondary leading-relaxed text-center max-w-md">
                    Ao iniciar, o cronômetro começa a contar. Suas respostas serão enviadas automaticamente ao término do tempo.
                </p>
                <button @click="$emit('iniciar')" class="btn-iniciar" :disabled="loading">
                    <div v-if="loading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {{ loading ? "Preparando..." : "Iniciar avaliação" }}
                </button>
            </div>

            <!-- Bloqueado -->
            <div v-else class="bloqueado-card">
                <Icon name="ph:lock-bold" class="w-7 h-7 text-secondary/40" />
                <span class="text-sm font-black text-secondary">Avaliação indisponível</span>
                <span v-if="item.status_visibilidade === 'agendado'" class="text-[11px] font-semibold text-secondary/60">
                    Disponível a partir de {{ formatData(item.data_disponivel) }}
                </span>
                <span v-else class="text-[11px] font-semibold text-secondary/60">Prazo encerrado</span>
            </div>
        </template>

        <!-- ── Estado: em andamento ────────────────────── -->
        <template v-else>
            <!-- Timer -->
            <div v-if="timerAtivo" class="timer-bar" :class="{ 'timer-bar--alert': tempoRestanteSeg <= 300 }">
                <div class="flex items-center gap-2">
                    <Icon name="ph:clock-bold" class="w-4 h-4" />
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
                    <span v-if="p.obrigatoria" class="text-[9px] font-bold text-secondary/50 uppercase">* obrigatória</span>
                </div>

                <p class="pergunta-enunciado whitespace-pre-wrap">{{ p.enunciado }}</p>

                <!-- Anexo da pergunta -->
                <button v-if="p.id_arquivo" @click="abrirArquivo(p.id_arquivo)" class="pergunta-anexo" title="Abrir anexo">
                    <Icon name="ph:paperclip-bold" class="w-3 h-3" />
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
                            <div v-if="respostaDe(p.id_pergunta)?.id_resposta_possivel === alt.id_resposta_possivel" class="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <span class="alternativa-texto">{{ alt.texto }}</span>
                        <button v-if="alt.id_arquivo" @click.stop="abrirArquivo(alt.id_arquivo)" class="alternativa-anexo" title="Abrir anexo">
                            <Icon name="ph:paperclip-bold" class="w-3.5 h-3.5" />
                        </button>
                    </button>
                </div>

                <!-- Dissertativa -->
                <div v-else class="flex flex-col gap-2 mt-3">
                    <textarea
                        :value="respostaDe(p.id_pergunta)?.texto_resposta || ''"
                        @input="$emit('marcar-texto', { id_pergunta: p.id_pergunta, texto: ($event.target as HTMLTextAreaElement).value })"
                        rows="3"
                        placeholder="Digite sua resposta..."
                        class="dissertativa-input"
                    />
                    <div class="flex items-center gap-2">
                        <UploadMini
                            :model-value="respostaDe(p.id_pergunta)?.id_arquivo_envio || null"
                            :getUserExpandidoId="() => (useAppStore() as any).user_expandido_id"
                            :getIdEntidade="getEntidadeId"
                            @update:model-value="(v: string | null) => $emit('marcar-arquivo', { id_pergunta: p.id_pergunta, id_arquivo: v })"
                        />
                        <span class="text-[9px] font-bold text-secondary/60">Anexar arquivo (opcional)</span>
                    </div>
                </div>
            </div>

            <!-- Finalizar -->
            <div class="flex items-center justify-between pt-2 border-t border-divider">
                <span class="text-[10px] font-bold text-secondary/60">{{ perguntas.length }} pergunta(s) · tentativa {{ submissao.tentativa }}</span>
                <button @click="$emit('finalizar')" class="btn-finalizar" :disabled="saving">
                    <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {{ saving ? "Enviando..." : "Finalizar e entregar" }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { useAppStore } from "~~/stores/app";
import UploadMini from "~/components/programacao_atividades/UploadMini.vue";

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
    getEntidadeId?: () => string | null;
    flagsAvaliacao?: { ambiente_seguro: boolean; autoavaliacao: boolean } | null;
}>();

const emit = defineEmits<{
    iniciar: [];
    finalizar: [];
    saida: [];
    "marcar-alternativa": [payload: { id_pergunta: string; id_resposta: string }];
    "marcar-texto": [payload: { id_pergunta: string; texto: string }];
    "marcar-arquivo": [payload: { id_pergunta: string; id_arquivo: string | null }];
}>();

// ── Modo prova (ambiente seguro) ───────────────────
const modoProva = ref(false);

function ativarModoProva() {
    if (!props.submissao || !props.flagsAvaliacao?.ambiente_seguro) return;
    modoProva.value = true;
    document.documentElement.requestFullscreen?.().catch(() => {});
}

function desativarModoProva() {
    if (!modoProva.value) return;
    modoProva.value = false;
    if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
    }
}

function onVisibilidade() {
    if (modoProva.value && document.hidden) {
        emit("saida");
    }
}

watch(
    () => props.submissao,
    (s) => {
        if (s) ativarModoProva();
        else desativarModoProva();
    },
    { immediate: true },
);

document.addEventListener("visibilitychange", onVisibilidade);
onUnmounted(() => {
    document.removeEventListener("visibilitychange", onVisibilidade);
    desativarModoProva();
});

function respostaDe(idPergunta: string) {
    return props.respostas.find((r: any) => r.id_pergunta === idPergunta);
}

function formatData(d: string | null): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarDataHora(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
</script>

<style scoped>
.status-pill { font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 8px; }
.status--agendado { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.status--prazo { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
.status--prazo-lite { background: var(--color-secondary-surface-hover); color: var(--color-secondary); border: 1px solid var(--color-divider); }
.status--ok { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
.status--nota { background: rgba(139,92,246,0.12); color: var(--color-primary); border: 1px solid rgba(139,92,246,0.25); }

.file-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 12px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); }
.file-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.open-btn { padding: 8px 18px; border-radius: 9px; border: none; background: var(--color-primary); color: white; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
.open-btn:hover { transform: translateY(-1px); }

.iniciar-card { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px 24px; border-radius: 14px; border: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.05); }
.btn-iniciar { padding: 11px 28px; border-radius: 10px; border: none; background: var(--color-primary); color: white; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.35); }
.btn-iniciar:hover:not(:disabled) { transform: translateY(-1px); }
.btn-iniciar:disabled { opacity: 0.6; cursor: wait; }

.entregue-card, .bloqueado-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 48px 24px; border-radius: 14px; border: 1px solid rgba(16,185,129,0.2); background: rgba(16,185,129,0.04); }
.bloqueado-card { border-color: var(--color-divider); background: var(--color-secondary-surface); }
.nota-destaque { font-size: 15px; font-weight: 900; color: var(--color-primary); background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); padding: 6px 18px; border-radius: 10px; }

.feedback-card { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: 12px; border: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.05); }
.feedback-titulo { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-primary); }
.feedback-texto { font-size: 12px; font-weight: 600; color: var(--color-text); line-height: 1.6; white-space: pre-wrap; }
.feedback-meta { font-size: 9.5px; font-weight: 700; color: var(--color-secondary); }

/* Timer */
.timer-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 10px; border: 1px solid rgba(139,92,246,0.25); background: rgba(139,92,246,0.08); color: var(--color-primary); position: sticky; top: 0; z-index: 5; backdrop-filter: blur(6px); }
.timer-bar--alert { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); color: #ef4444; }

/* Perguntas */
.pergunta-card { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; border-radius: 12px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); }
.pergunta-num { width: 24px; height: 24px; border-radius: 7px; background: rgba(139,92,246,0.12); color: var(--color-primary); font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pergunta-tipo { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-secondary); }
.pergunta-pontos { font-size: 9px; font-weight: 800; color: var(--color-primary); }
.pergunta-enunciado { font-size: 13px; font-weight: 700; color: var(--color-text); line-height: 1.5; }
.pergunta-anexo { align-self: flex-start; display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 7px; border: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.08); color: var(--color-primary); font-size: 9px; font-weight: 900; cursor: pointer; transition: all 0.15s; }
.pergunta-anexo:hover { background: rgba(139,92,246,0.15); }

/* Alternativas */
.alternativa { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); cursor: pointer; transition: all 0.15s; text-align: left; }
.alternativa:hover { border-color: rgba(139,92,246,0.3); background: var(--color-secondary-surface-hover); }
.alternativa--selecionada { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.08); }
.radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--color-divider); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
.radio--on { border-color: var(--color-primary); }
.alternativa-texto { font-size: 12px; font-weight: 600; color: var(--color-text); flex: 1; }
.alternativa-anexo { width: 24px; height: 24px; border-radius: 6px; border: none; background: transparent; color: var(--color-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.alternativa-anexo:hover { color: var(--color-primary); background: rgba(139,92,246,0.1); }

/* Dissertativa */
.dissertativa-input { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid var(--field-border); background: var(--field-bg); color: var(--field-text); font-size: 12px; font-weight: 600; outline: none; transition: all 0.15s; resize: vertical; font-family: inherit; }
.dissertativa-input:focus { border-color: rgba(139,92,246,0.5); box-shadow: 0 0 0 2px rgba(139,92,246,0.1); }

.btn-finalizar { padding: 10px 24px; border-radius: 9px; border: none; background: var(--color-primary); color: white; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.35); }
.btn-finalizar:hover:not(:disabled) { transform: translateY(-1px); }
.btn-finalizar:disabled { opacity: 0.5; cursor: not-allowed; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-divider); border-radius: 4px; }
</style>
