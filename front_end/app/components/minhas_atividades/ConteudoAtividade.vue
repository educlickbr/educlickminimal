<template>
    <div class="flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Cabeçalho -->
        <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Atividade</span>
            <h2 class="text-lg font-black text-text">{{ item.titulo }}</h2>
            <p v-if="item.descricao" class="text-xs font-semibold text-secondary leading-relaxed whitespace-pre-wrap">{{ item.descricao }}</p>
        </div>

        <!-- Status -->
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
            <span v-if="item.atividade_status === 'rascunho'" class="status-pill status--rascunho">✎ Rascunho salvo</span>
            <span v-if="item.atividade_status === 'entregue'" class="status-pill status--ok">✓ Entregue</span>
            <span v-if="temNota" class="status-pill status--nota">Nota: {{ item.atividade_nota }}</span>
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

        <!-- Form de entrega -->
        <template v-if="item.status_visibilidade === 'disponivel' && item.atividade_status !== 'entregue'">
            <div class="flex flex-col gap-2">
                <label class="field-label">Sua resposta</label>
                <textarea v-model="texto" rows="4" placeholder="Escreva sua resposta aqui..."
                    class="field-input field-textarea" :disabled="saving" />
            </div>

            <div class="flex flex-col gap-2">
                <label class="field-label">Anexar arquivo (opcional)</label>
                <UploadMini
                    v-model="arquivo"
                    :getUserExpandidoId="() => (useAppStore() as any).user_expandido_id"
                    :getIdEntidade="getEntidadeId"
                />
            </div>

            <div class="flex items-center gap-3 pt-2">
                <button @click="$emit('rascunho')" class="btn-draft" :disabled="saving">
                    Salvar rascunho
                </button>
                <button @click="$emit('entregar')" class="btn-submit" :disabled="saving || !podeEntregar">
                    <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {{ saving ? "Enviando..." : "Entregar" }}
                </button>
            </div>
        </template>

        <!-- Já entregue -->
        <div v-else-if="item.atividade_status === 'entregue'" class="entregue-card">
            <Icon name="ph:check-circle-bold" class="w-7 h-7 text-emerald-500" />
            <span class="text-sm font-black text-text">Atividade entregue!</span>
            <span class="text-[11px] font-semibold text-secondary/60">{{ temNota ? 'Corrigida pelo professor' : 'Aguardando correção do professor' }}</span>
        </div>

        <!-- Feedback do professor -->
        <div v-if="item.atividade_status === 'entregue' && item.atividade_comentario" class="feedback-card">
            <span class="feedback-titulo">Feedback do professor</span>
            <p class="feedback-texto">{{ item.atividade_comentario }}</p>
            <span v-if="item.atividade_corrigido_por_nome || item.atividade_corrigido_em" class="feedback-meta">
                Corrigido{{ item.atividade_corrigido_por_nome ? ' por ' + item.atividade_corrigido_por_nome : '' }}{{ item.atividade_corrigido_em ? ' · ' + formatarDataHora(item.atividade_corrigido_em) : '' }}
            </span>
        </div>

        <!-- Bloqueado -->
        <div v-else class="bloqueado-card">
            <Icon name="ph:lock-bold" class="w-7 h-7 text-secondary/40" />
            <span class="text-sm font-black text-secondary">Atividade indisponível</span>
            <span v-if="item.status_visibilidade === 'agendado'" class="text-[11px] font-semibold text-secondary/60">
                Disponível a partir de {{ formatData(item.data_disponivel) }}
            </span>
            <span v-else class="text-[11px] font-semibold text-secondary/60">Prazo encerrado</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "~~/stores/app";
import UploadMini from "~/components/programacao_atividades/UploadMini.vue";

const props = defineProps<{
    item: any;
    texto: string;
    arquivo: string | null;
    saving: boolean;
    podeEntregar: boolean;
    abrirArquivo: (id: string) => void;
    getEntidadeId?: () => string | null;
}>();

const emit = defineEmits<{
    "update:texto": [value: string];
    "update:arquivo": [value: string | null];
    rascunho: [];
    entregar: [];
}>();

const texto = computed({
    get: () => props.texto,
    set: (v) => emit("update:texto", v),
});

const arquivo = computed({
    get: () => props.arquivo,
    set: (v) => emit("update:arquivo", v),
});

const temNota = computed(() => props.item.atividade_nota !== null && props.item.atividade_nota !== undefined);

function formatarDataHora(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatData(d: string | null): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
</script>

<style scoped>
.status-pill { font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 8px; }
.status--agendado { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.status--prazo { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
.status--prazo-lite { background: var(--color-secondary-surface-hover); color: var(--color-secondary); border: 1px solid var(--color-divider); }
.status--rascunho { background: var(--color-secondary-surface-hover); color: var(--color-secondary); border: 1px solid var(--color-divider); }
.status--ok { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
.status--nota { background: rgba(139,92,246,0.12); color: var(--color-primary); border: 1px solid rgba(139,92,246,0.25); }

.file-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 12px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); }
.file-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.open-btn { padding: 8px 18px; border-radius: 9px; border: none; background: var(--color-primary); color: white; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
.open-btn:hover { transform: translateY(-1px); }

.field-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-secondary); }
.field-input { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid var(--field-border); background: var(--field-bg); color: var(--field-text); font-size: 12px; font-weight: 600; outline: none; transition: all 0.15s; }
.field-input:focus { border-color: rgba(139,92,246,0.5); box-shadow: 0 0 0 2px rgba(139,92,246,0.1); }
.field-textarea { resize: vertical; min-height: 90px; font-family: inherit; }

.btn-draft { padding: 9px 18px; border-radius: 9px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.btn-draft:hover:not(:disabled) { color: var(--color-text); background: var(--color-secondary-surface-hover); }
.btn-draft:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-submit { padding: 9px 22px; border-radius: 9px; border: none; background: var(--color-primary); color: white; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.35); }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.45); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.entregue-card, .bloqueado-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 48px 24px; border-radius: 14px; border: 1px solid rgba(16,185,129,0.2); background: rgba(16,185,129,0.04); }
.bloqueado-card { border-color: var(--color-divider); background: var(--color-secondary-surface); }

.feedback-card { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: 12px; border: 1px solid rgba(139,92,246,0.2); background: rgba(139,92,246,0.05); }
.feedback-titulo { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-primary); }
.feedback-texto { font-size: 12px; font-weight: 600; color: var(--color-text); line-height: 1.6; white-space: pre-wrap; }
.feedback-meta { font-size: 9.5px; font-weight: 700; color: var(--color-secondary); }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-divider); border-radius: 4px; }
</style>
