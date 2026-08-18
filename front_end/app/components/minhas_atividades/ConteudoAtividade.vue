<template>
    <div class="flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Cabeçalho -->
        <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Atividade</span>
            <h2 class="text-lg font-black text-white/90">{{ item.titulo }}</h2>
            <p v-if="item.descricao" class="text-xs font-semibold text-white/40 leading-relaxed whitespace-pre-wrap">{{ item.descricao }}</p>
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="text-sm font-black text-white/80">Atividade entregue!</span>
            <span class="text-[11px] font-semibold text-white/30">Aguardando correção do professor</span>
        </div>

        <!-- Bloqueado -->
        <div v-else class="bloqueado-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span class="text-sm font-black text-white/60">Atividade indisponível</span>
            <span v-if="item.status_visibilidade === 'agendado'" class="text-[11px] font-semibold text-white/25">
                Disponível a partir de {{ formatData(item.data_disponivel) }}
            </span>
            <span v-else class="text-[11px] font-semibold text-white/25">Prazo encerrado</span>
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
.status--rascunho { background: rgba(148,163,184,0.1); color: #cbd5e1; border: 1px solid rgba(148,163,184,0.2); }
.status--ok { background: rgba(52,211,153,0.08); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.15); }
.status--nota { background: rgba(139,92,246,0.1); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.2); }

.file-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
.file-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.16); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.open-btn { padding: 8px 18px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
.open-btn:hover { transform: translateY(-1px); }

.field-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); }
.field-input { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); color: rgba(232,230,240,0.8); font-size: 12px; font-weight: 600; outline: none; transition: all 0.15s; }
.field-input:focus { border-color: rgba(139,92,246,0.35); box-shadow: 0 0 0 2px rgba(139,92,246,0.08); }
.field-textarea { resize: vertical; min-height: 90px; font-family: inherit; }

.btn-draft { padding: 9px 18px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.btn-draft:hover:not(:disabled) { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.2); }
.btn-draft:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-submit { padding: 9px 22px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 4px 14px rgba(139,92,246,0.35); }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,92,246,0.45); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.entregue-card, .bloqueado-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 48px 24px; border-radius: 14px; border: 1px solid rgba(52,211,153,0.15); background: rgba(52,211,153,0.03); color: #6ee7b7; }
.bloqueado-card { border-color: rgba(148,163,184,0.12); background: rgba(148,163,184,0.02); color: #94a3b8; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
</style>
