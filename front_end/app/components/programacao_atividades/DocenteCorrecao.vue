<template>
    <div class="flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar flex-1" v-if="detalhe">
        <!-- Header -->
        <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                    {{ detalhe.tipo === 'avaliacao' ? 'Avaliação' : 'Atividade' }} · tentativa {{ detalhe.tentativa }}
                </span>
                <span v-if="!corrigivel" class="status-pill status--leitura">🔒 Somente leitura</span>
                <span v-if="jaCorrigido" class="status-pill status--corrigido"
                    :title="corrigidoEm ? 'Corrigido por ' + (detalhe.corrigido_por_nome || '—') + ' em ' + formatarDataHora(corrigidoEm) : 'Corrigido'">
                    Corrigido
                    <template v-if="detalhe.corrigido_por_nome">por {{ detalhe.corrigido_por_nome }}</template>
                    <template v-if="corrigidoEm"> · {{ formatarDataHora(corrigidoEm) }}</template>
                </span>
                <span v-if="jaCorrigido" class="status-pill status--nota">Nota: {{ detalhe.nota }}</span>
            </div>
            <h2 class="text-lg font-black text-text">{{ detalhe.titulo }}</h2>
            <p v-if="detalhe.nome" class="text-xs font-semibold text-secondary/60">{{ detalhe.nome }}</p>
        </div>

        <!-- Atividade -->
        <template v-if="detalhe.tipo === 'atividade'">
            <div class="card-bloco">
                <span class="card-titulo">Resposta do aluno</span>
                <p v-if="detalhe.texto_resposta" class="resposta-texto">{{ detalhe.texto_resposta }}</p>
                <p v-else class="text-[11px] font-semibold text-secondary/50 italic">Sem texto — apenas arquivo (se houver)</p>
                <button v-if="detalhe.id_arquivo_envio" @click="abrirArquivo(detalhe.id_arquivo_envio)" class="ds-btn-primary self-start !py-2 !px-4 text-xs">
                    <Icon name="ph:file-arrow-down-bold" class="w-4 h-4" />
                    <span>Abrir arquivo enviado</span>
                </button>
                <p v-else-if="!detalhe.texto_resposta" class="text-[11px] font-semibold text-secondary/50">Sem anexo</p>
            </div>
        </template>

        <!-- Avaliação com gabarito -->
        <template v-else>
            <div class="flex flex-col gap-3">
                <div v-for="(p, idx) in (detalhe.perguntas as any[])" :key="p.id_pergunta" class="card-bloco">
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Pergunta {{ idx + 1 }}</span>
                        <span v-if="p.pontuacao" class="text-[10px] font-bold text-secondary/60">{{ p.pontuacao }} pt(s)</span>
                    </div>
                    <p class="text-[13px] font-bold text-text leading-relaxed">{{ p.enunciado }}</p>

                    <!-- Alternativas -->
                    <div v-if="p.alternativas && p.alternativas.length > 0" class="flex flex-col gap-1.5 mt-3">
                        <div v-for="alt in p.alternativas" :key="alt.id_resposta_possivel"
                            class="alt-row"
                            :class="{ 'alt-row--correta': alt.correta, 'alt-row--escolhida': alt.escolhida }">
                            <span v-if="alt.correta" class="alt-marca" title="Correta">✓</span>
                            <span v-else-if="alt.escolhida" class="alt-marca alt-marca--errada" title="Escolhida pelo aluno">✕</span>
                            <span v-else class="alt-marca" />
                            <span class="alt-texto" :class="{ 'alt-texto--correta': alt.correta }">{{ alt.texto }}</span>
                            <span v-if="alt.escolhida" class="alt-badge">resposta do aluno</span>
                        </div>
                    </div>

                    <!-- Dissertativa -->
                    <div v-else class="mt-3">
                        <span class="text-[9px] font-bold text-secondary/50 uppercase tracking-widest">Resposta do aluno</span>
                        <p v-if="p.resposta_texto" class="resposta-texto mt-1">{{ p.resposta_texto }}</p>
                        <p v-else class="text-[11px] font-semibold text-secondary/50 italic mt-1">Sem resposta</p>
                    </div>
                </div>
            </div>
        </template>

        <!-- Form de correção -->
        <div class="card-bloco correcao-form" :class="{ 'correcao-form--leitura': !corrigivel }">
            <span class="card-titulo">Correção</span>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                    <label class="field-label">Nota</label>
                    <input v-model="nota" type="number" min="0" step="0.5" placeholder="0.0" class="field-input"
                        :disabled="!corrigivel || saving" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="field-label">Comentário (opcional)</label>
                    <textarea v-model="comentario" rows="2" placeholder="Feedback para o aluno..." class="field-input field-textarea"
                        :disabled="!corrigivel || saving"></textarea>
                </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
                <button v-if="corrigivel" @click="$emit('salvar')" class="ds-btn-save" :disabled="saving || !nota">
                    <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{{ saving ? 'Salvando...' : (jaCorrigido ? 'Editar correção' : 'Salvar correção') }}</span>
                </button>
                <span v-else class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Apenas o criador do conteúdo pode corrigir</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    detalhe: any;
    nota: string;
    comentario: string;
    saving: boolean;
    corrigivel: boolean;
    abrirArquivo: (id: string) => void;
}>();

const emit = defineEmits<{
    "update:nota": [value: string];
    "update:comentario": [value: string];
    salvar: [];
}>();

const nota = computed({
    get: () => props.nota,
    set: (v) => emit("update:nota", String(v)),
});

const comentario = computed({
    get: () => props.comentario,
    set: (v) => emit("update:comentario", String(v)),
});

const jaCorrigido = computed(() => {
    const n = props.detalhe?.nota;
    return n !== null && n !== undefined;
});

const corrigidoEm = computed<string | null>(() => props.detalhe?.corrigido_em || props.detalhe?.modificado_em || null);

function formatarDataHora(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
</script>

<style scoped>
.status-pill { font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 8px; }
.status--leitura { background: rgba(245,158,11,0.08); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.status--nota { background: rgba(139,92,246,0.1); color: var(--color-primary); border: 1px solid rgba(139,92,246,0.2); }
.status--corrigido { background: rgba(16,185,129,0.08); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }

.card-bloco { display: flex; flex-direction: column; gap: 8px; padding: 16px 18px; border-radius: 12px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); }
.card-titulo { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-secondary); opacity: 0.8; }

.resposta-texto { font-size: 12px; font-weight: 600; color: var(--color-text); line-height: 1.6; white-space: pre-wrap; background: var(--field-bg); border: 1px solid var(--field-border); border-radius: 8px; padding: 10px 12px; }

.alt-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); }
.alt-row--correta { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }
.alt-row--escolhida:not(.alt-row--correta) { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); }
.alt-marca { width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; flex-shrink: 0; }
.alt-row--correta .alt-marca { background: rgba(16,185,129,0.15); color: #10b981; }
.alt-row--escolhida:not(.alt-row--correta) .alt-marca { background: rgba(239,68,68,0.15); color: #ef4444; }
.alt-texto { font-size: 12px; font-weight: 600; color: var(--color-text); flex: 1; }
.alt-texto--correta { color: #10b981; }
.alt-badge { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-secondary); opacity: 0.6; background: var(--color-secondary-surface-hover); padding: 2px 7px; border-radius: 5px; flex-shrink: 0; }

.correcao-form { border-color: rgba(139,92,246,0.25); background: rgba(139,92,246,0.03); }
.correcao-form--leitura { opacity: 0.6; }
.field-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-secondary); opacity: 0.7; }
.field-input { width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--field-border); background: var(--field-bg); color: var(--field-text); font-size: 12px; font-weight: 600; outline: none; transition: all 0.15s; }
.field-input:focus { border-color: rgba(139,92,246,0.35); }
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }
.field-textarea { resize: vertical; font-family: inherit; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 4px; }
</style>
