<template>
    <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="$emit('update:modelValue', false)"
    >
        <div class="modal-panel modal-panel--wide">
            <div class="modal-accent-bar"></div>

            <!-- Step Indicator (Perguntas só aparece se for avaliação) -->
            <div class="modal-steps">
                <button
                    @click="$emit('update:modelValue', false)"
                    class="modal-xclose"
                    title="Fechar"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
                <div
                    v-for="(step, i) in visibleSteps"
                    :key="step.key"
                    @click="irParaStep(step.key)"
                    class="step-item"
                    :class="{
                        'step--active': abaAtiva === step.key,
                        'step--done': stepIdx(step.key) < stepIdx(abaAtiva),
                        'step--future': stepIdx(step.key) > stepIdx(abaAtiva),
                    }"
                >
                    <div class="step-bubble">
                        <svg v-if="stepIdx(step.key) < stepIdx(abaAtiva)" width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <span v-else>{{ step.num }}</span>
                    </div>
                    <span class="step-label">{{ step.label }}</span>
                </div>
            </div>

            <!-- Passo 1: Dados Gerais -->
            <div v-if="abaAtiva === 'geral'" class="modal-body p-6 flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                    <label class="field-label">Tipo de Conteúdo</label>
                    <div class="flex gap-2">
                        <button
                            v-for="t in tipos"
                            :key="t.value"
                            @click="form.tipo = t.value"
                            :class="['tipo-btn', form.tipo === t.value ? 'tipo-btn--active tipo--' + t.value : '']"
                        >{{ t.label }}</button>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="field-label">Título</label>
                    <input
                        v-model="form.titulo"
                        placeholder="Ex: Introdução ao Roteiro"
                        class="field-input"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="field-label">Descrição (Opcional)</label>
                    <textarea
                        v-model="form.descricao"
                        placeholder="Descreva o conteúdo..."
                        rows="2"
                        class="field-input field-textarea"
                    ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <UploadArquivo
                        v-model="form.id_arquivo"
                        label="Arquivo (Opcional)"
                        placeholder="Clique para selecionar um arquivo"
                        :getUserExpandidoId="() => (useAppStore() as any).user_expandido_id"
                        :getIdEntidade="getEntidadeId"
                    />
                    <div class="flex flex-col gap-2">
                        <label class="field-label">URL (Opcional)</label>
                        <input
                            v-model="form.url"
                            placeholder="https://..."
                            class="field-input"
                        />
                    </div>
                </div>
            </div>

            <!-- Passo 2: Perguntas (só para avaliação) -->
            <div v-if="abaAtiva === 'perguntas'" class="modal-body modal-body--col">
                <!-- Config fixa (não rola) -->
                <div class="perguntas-config">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">{{ perguntas.length }} pergunta(s)</span>
                            <!-- Ordem das perguntas -->
                            <div class="flex items-center gap-1">
                                <span class="text-[9px] font-bold text-white/25 uppercase tracking-widest">Ordem:</span>
                                <button @click="ordemPerguntas = 'fixa'"
                                    class="tipo-btn small" :class="{ 'tipo-btn--active': ordemPerguntas === 'fixa' }">Fixa</button>
                                <button @click="ordemPerguntas = 'aleatoria'"
                                    class="tipo-btn small" :class="{ 'tipo-btn--active': ordemPerguntas === 'aleatoria' }">Aleatória</button>
                            </div>
                        </div>
                        <button @click="addPergunta" class="add-btn small">+ Pergunta</button>
                    </div>

                    <!-- Modo da avaliação -->
                    <div class="flex items-center gap-4 flex-wrap">
                        <label class="flex items-center gap-2 text-[10px] font-bold text-white/40 cursor-pointer select-none">
                            <input type="checkbox" v-model="ambienteSeguro" class="toggle-check" />
                            🔒 Ambiente seguro
                            <span class="text-white/20 font-semibold">(trava a tela do aluno)</span>
                        </label>
                        <label class="flex items-center gap-2 text-[10px] font-bold text-white/40 cursor-pointer select-none">
                            <input type="checkbox" v-model="autoavaliacao" class="toggle-check" />
                            🧮 Autoavaliação
                            <span class="text-white/20 font-semibold">(nota na hora — sem dissertativas)</span>
                        </label>
                    </div>
                    <div v-if="autoavaliacao" class="text-[10px] font-bold text-amber-400/70 bg-amber-400/5 border border-amber-400/15 rounded-lg px-3 py-2">
                        ⚠️ Em autoavaliação as perguntas dissertativas são bloqueadas — só múltipla escolha.
                    </div>
                </div>

                <!-- Lista de perguntas (rola) -->
                <div class="perguntas-lista">

                <div v-for="(p, idx) in perguntas" :key="idx" class="pergunta-card">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Pergunta {{ idx + 1 }}</span>
                            <!-- Anexo da pergunta -->
                            <UploadMini
                                v-model="p.id_arquivo"
                                label="Anexar imagem/arquivo à pergunta"
                                :getUserExpandidoId="() => (useAppStore() as any).user_expandido_id"
                                :getIdEntidade="getEntidadeId"
                            />
                        </div>
                        <button @click="perguntas.splice(idx, 1)" class="action-btn action-delete" title="Remover">✕</button>
                    </div>

                    <div class="flex gap-2 mb-2">
                        <button
                            v-for="t in ['dissertativa', 'multipla_escolha']"
                            :key="t"
                            @click="p.tipo = t"
                            :disabled="autoavaliacao && t === 'dissertativa'"
                            :class="['tipo-btn small', p.tipo === t ? 'tipo-btn--active' : '', autoavaliacao && t === 'dissertativa' ? 'tipo-btn--disabled' : '']"
                        >{{ t === 'dissertativa' ? 'Dissertativa' : 'Múltipla Escolha' }}</button>
                    </div>

                    <textarea
                        v-model="p.enunciado"
                        placeholder="Digite o enunciado da pergunta..."
                        rows="2"
                        class="field-input field-textarea mb-2"
                    ></textarea>

                    <div class="flex items-center gap-3 mb-3">
                        <div class="flex items-center gap-1">
                            <label class="text-[10px] font-bold text-white/30">Pontos:</label>
                            <input v-model.number="p.pontuacao" type="number" min="0" step="0.5" class="field-input w-16 text-xs" />
                        </div>
                        <label class="flex items-center gap-1 text-[10px] font-bold text-white/30">
                            <input v-model="p.obrigatoria" type="checkbox" /> Obrigatória
                        </label>
                    </div>

                    <!-- Alternativas (múltipla escolha) -->
                    <div v-if="p.tipo === 'multipla_escolha'" class="ml-4 pl-3 border-l-2 border-white/5 flex flex-col gap-2 mt-2">
                        <div v-for="(alt, ai) in p.alternativas" :key="ai" class="flex items-center gap-2">
                            <input
                                v-model="alt.texto"
                                :placeholder="'Alternativa ' + (ai + 1)"
                                class="field-input flex-1"
                            />
                            <label class="flex items-center gap-1 text-[10px] font-bold text-white/30 whitespace-nowrap">
                                <input type="radio" :name="'correta_' + idx" :checked="alt.correta" @change="marcarCorreta(idx, ai)" /> Correta
                            </label>
                            <!-- Anexo da alternativa -->
                            <UploadMini
                                v-model="alt.id_arquivo"
                                label="Anexar imagem/arquivo à alternativa"
                                :getUserExpandidoId="() => (useAppStore() as any).user_expandido_id"
                                :getIdEntidade="getEntidadeId"
                            />
                            <button @click="p.alternativas.splice(ai, 1)" class="action-btn action-delete" title="Remover">✕</button>
                        </div>
                        <button @click="p.alternativas.push({ texto: '', correta: false, id_arquivo: null })" class="text-[10px] font-bold text-secondary/40 hover:text-secondary/60 transition-colors self-start">
                            + Alternativa
                        </button>
                    </div>
                </div>
                </div>
            </div>

            <!-- Passo 3: Blocos -->
            <div v-if="abaAtiva === 'blocos'" class="modal-body p-6 flex flex-col gap-4">
                <p class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Associar a blocos (opcional)</p>

                <div v-if="blocosDisponiveis.length === 0" class="flex flex-col items-center py-12 gap-2">
                    <p class="text-sm font-bold text-white/30">Nenhum bloco disponível</p>
                    <p class="text-[10px] font-bold text-white/15 uppercase tracking-widest">Crie blocos na visão \"Blocos\" do repositório</p>
                </div>

                <div v-else class="grid grid-cols-1 gap-2">
                    <div
                        v-for="b in blocosDisponiveis"
                        :key="b.id"
                        @click="toggleBloco(b.id)"
                        class="bloco-select-row"
                        :class="{ 'bloco-select-row--selected': blocosSelecionados.includes(b.id) }"
                    >
                        <div class="bloco-select-check">
                            <svg v-if="blocosSelecionados.includes(b.id)" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <rect width="10" height="10" rx="2" fill="#7c3aed"/>
                                <path d="M2.5 5l2 2 3-4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            <div v-else class="w-[10px] h-[10px] rounded border border-white/20" />
                        </div>
                        <div class="bloco-select-avatar" :style="b.cor_ident ? { background: b.cor_ident + '22', borderColor: b.cor_ident + '44', color: b.cor_ident } : {}">
                            {{ (b.titulo || "?").charAt(0).toUpperCase() }}
                        </div>
                        <span class="bloco-select-titulo">{{ b.titulo }}</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
                <button @click="prevStep" class="modal-btn-cancel" :class="stepIndex === 0 ? 'btn-cancelar' : ''">
                    {{ stepIndex === 0 ? 'Cancelar' : 'Anterior' }}
                </button>
                <div class="flex gap-2">
                    <button v-if="stepIndex < visibleSteps.length - 1" @click="nextStep" class="modal-btn-save">
                        Próximo
                    </button>
                    <button
                        v-if="stepIndex === visibleSteps.length - 1"
                        @click="handleSave"
                        :disabled="saving || !form.titulo.trim() || !form.tipo"
                        class="modal-btn-save"
                    >
                        <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {{ saving ? "Salvando..." : isEdit ? "Atualizar" : "Criar Conteúdo" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { useAppStore } from "~~/stores/app";
import UploadArquivo from "~/components/programacao_atividades/UploadArquivo.vue";
import UploadMini from "~/components/programacao_atividades/UploadMini.vue";

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    initialData?: any | null;
    onSave: (data: any) => Promise<boolean>;
    blocosDisponiveis: any[];
    blocosSelecionados: string[];
    abaAtiva: string;
    getEntidadeId?: () => string | null;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    "update:blocosSelecionados": [value: string[]];
    "update:abaAtiva": [value: string];
    saved: [];
}>();

const saving = ref(false);

const steps = [
    { key: "geral", label: "Dados Gerais", num: 1 },
    { key: "perguntas", label: "Perguntas", num: 2 },
    { key: "blocos", label: "Blocos", num: 3 },
];

const tipos = [
    { value: "material", label: "Material" },
    { value: "atividade", label: "Atividade" },
    { value: "avaliacao", label: "Questionário" },
];

const abaAtiva = computed({
    get: () => props.abaAtiva,
    set: (v) => emit("update:abaAtiva", v),
});

// Steps visíveis: oculta "Perguntas" se não for avaliação
const visibleSteps = computed(() => {
    return steps
        .filter((s) => s.key !== "perguntas" || form.tipo === "avaliacao")
        .map((s, i) => ({ ...s, num: i + 1 }));
});

// Helper para pegar índice de um step nos steps visíveis
function stepIdx(key: string): number {
    return visibleSteps.value.findIndex((s) => s.key === key);
}

const stepIndex = computed(() => stepIdx(abaAtiva.value));


const blocosSelecionados = computed({
    get: () => props.blocosSelecionados,
    set: (v) => emit("update:blocosSelecionados", v),
});

interface Alternativa { id?: string; texto: string; correta: boolean; id_arquivo?: string | null }
interface Pergunta {
    id?: string;
    tipo: string;
    enunciado: string;
    pontuacao: number;
    obrigatoria: boolean;
    alternativas: Alternativa[];
    id_arquivo?: string | null;
}

const perguntas = ref<Pergunta[]>([]);
const ordemPerguntas = ref<"fixa" | "aleatoria">("fixa");
const ambienteSeguro = ref(false);
const autoavaliacao = ref(false);

async function carregarPerguntas(idConteudo: string) {
    try {
        const res = (await $fetch("/api/programacao_atividades/avaliacao", {
            params: { id_conteudo: idConteudo, id_entidade: props.getEntidadeId?.() },
        })) as any;
        if (res?.avaliacao?.ordem_perguntas) {
            ordemPerguntas.value = res.avaliacao.ordem_perguntas === "aleatoria" ? "aleatoria" : "fixa";
        }
        ambienteSeguro.value = !!res?.avaliacao?.ambiente_seguro;
        autoavaliacao.value = !!res?.avaliacao?.autoavaliacao;
        if (Array.isArray(res?.perguntas)) {
            perguntas.value = res.perguntas.map((p: any) => ({
                id: p.id,
                tipo: p.tipo || "dissertativa",
                enunciado: p.enunciado || "",
                pontuacao: Number(p.pontuacao || 0),
                obrigatoria: p.obrigatoria !== false,
                id_arquivo: p.id_arquivo || null,
                alternativas: Array.isArray(p.alternativas)
                    ? p.alternativas.map((a: any) => ({ id: a.id, texto: a.texto || "", correta: !!a.correta, id_arquivo: a.id_arquivo || null }))
                    : [],
            }));
        } else {
            perguntas.value = [];
        }
    } catch {
        perguntas.value = [];
    }
}

const form = reactive({
    id: null as string | null,
    tipo: "" as string,
    titulo: "",
    descricao: "",
    id_arquivo: null as string | null,
    url: "",
});

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            if (props.initialData) {
                form.id = props.initialData.id;
                form.tipo = props.initialData.tipo || "";
                form.titulo = props.initialData.titulo || "";
                form.descricao = props.initialData.descricao || "";
                form.id_arquivo = props.initialData.id_arquivo || null;
                form.url = props.initialData.url || "";
                perguntas.value = [];
                // Carrega perguntas existentes se for avaliação
                if (form.tipo === "avaliacao" && form.id) {
                    carregarPerguntas(form.id);
                }
            } else {
                form.id = null;
                form.tipo = "";
                form.titulo = "";
                form.descricao = "";
                form.id_arquivo = null;
                form.url = "";
                perguntas.value = [];
            }
            // Reseta para "geral" ao abrir o modal
            abaAtiva.value = "geral";
        }
    },
    { immediate: true },
);

function addPergunta() {
    perguntas.value.push({
        tipo: autoavaliacao.value ? "multipla_escolha" : "dissertativa",
        enunciado: "",
        pontuacao: 0,
        obrigatoria: true,
        alternativas: autoavaliacao.value ? [{ texto: "", correta: false, id_arquivo: null }] : [],
        id_arquivo: null,
    });
}

// Marca uma alternativa como correta (apenas uma por pergunta)
function marcarCorreta(perguntaIdx: number, altIdx: number) {
    const p = perguntas.value[perguntaIdx];
    if (!p) return;
    p.alternativas.forEach((a, i) => { a.correta = i === altIdx; });
}

function toggleBloco(id: string) {
    const arr = [...blocosSelecionados.value];
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(id);
    blocosSelecionados.value = arr;
}

function irParaStep(key: string) {
    // Só permite navegar para steps já visitados ou o atual
    const stepsKeys = visibleSteps.value.map((s) => s.key);
    const currentIdx = stepsKeys.indexOf(abaAtiva.value);
    const targetIdx = stepsKeys.indexOf(key);
    if (targetIdx <= currentIdx) {
        abaAtiva.value = key;
    }
}

function nextStep() {
    const vSteps = visibleSteps.value;
    if (vSteps.length === 0) return;
    const idx = stepIdx(abaAtiva.value);
    if (idx < 0) {
        abaAtiva.value = vSteps[0]?.key ?? "geral";
        return;
    }
    if (idx < vSteps.length - 1) {
        abaAtiva.value = vSteps[idx + 1]?.key ?? "geral";
    }
}

function prevStep() {
    const vSteps = visibleSteps.value;
    if (vSteps.length === 0) return;
    const idx = stepIdx(abaAtiva.value);
    if (idx < 0) {
        emit("update:modelValue", false);
        return;
    }
    if (idx > 0) {
        abaAtiva.value = vSteps[idx - 1]?.key ?? "geral";
    } else {
        emit("update:modelValue", false);
    }
}

async function handleSave() {
    if (!form.titulo.trim() || !form.tipo) return;

    saving.value = true;

    const payload = {
        ...form,
        perguntas: form.tipo === "avaliacao" ? perguntas.value : undefined,
        ordem_perguntas: form.tipo === "avaliacao" ? ordemPerguntas.value : undefined,
        ambiente_seguro: form.tipo === "avaliacao" ? ambienteSeguro.value : undefined,
        autoavaliacao: form.tipo === "avaliacao" ? autoavaliacao.value : undefined,
        usuario_id: (useAppStore() as any).user_expandido_id,
    };

    const ok = await props.onSave(payload);
    saving.value = false;

    if (ok) {
        emit("saved");
        emit("update:modelValue", false);
    }
}
</script>

<style scoped>
/* ── Overlay ─────────────────────────────── */
.modal-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85); padding: 16px;
    animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-panel--wide { max-width: 720px; }

.modal-panel {
    position: relative;
    background: #0f0f17;
    border: 1px solid rgba(139, 92, 246, 0.18);
    border-radius: 16px;
    width: 100%;
    max-height: calc(100vh - 32px);
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1);
    animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);
}

/* Área de conteúdo da aba: rola internamente, footer sempre visível */
.modal-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}
.modal-body::-webkit-scrollbar { width: 4px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

/* Aba perguntas: config fixa no topo + lista rolável */
.modal-body--col { overflow: hidden; display: flex; flex-direction: column; }
.perguntas-config {
    flex-shrink: 0;
    display: flex; flex-direction: column; gap: 10px;
    padding: 20px 24px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(0,0,0,0.15);
}
.perguntas-lista {
    flex: 1; min-height: 0;
    overflow-y: auto;
    display: flex; flex-direction: column; gap: 12px;
    padding: 16px 24px 24px;
}
.perguntas-lista::-webkit-scrollbar { width: 4px; }
.perguntas-lista::-webkit-scrollbar-track { background: transparent; }
.perguntas-lista::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
@keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-accent-bar {
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
    flex-shrink: 0;
}

/* ── Steps ──────────────────────────────── */
.modal-steps {
    display: flex; align-items: center; gap: 0;
    padding: 20px 24px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    position: relative;
}
.modal-xclose {
    position: absolute; right: 16px; top: 16px;
    width: 32px; height: 32px; border-radius: 8px;
    border: none; background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.4);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
    z-index: 2;
}
.modal-xclose:hover { background: rgba(255,255,255,0.1); color: #fff; }
.step-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px 12px;
    cursor: pointer; position: relative;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
}
.step-item.step--active { border-bottom-color: #7c3aed; }
.step-item.step--done .step-bubble { background: #22c55e; color: #fff; }
.step-item.step--active .step-bubble { background: #7c3aed; color: #fff; }
.step-item.step--future .step-bubble { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); }

.step-bubble {
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 900;
    transition: all 0.15s;
}
.step-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: rgba(255,255,255,0.5); white-space: nowrap;
}
.step--active .step-label { color: #c4b5fd; }
.step--done .step-label { color: #86efac; }

/* ── Fields ─────────────────────────────── */
.field-label {
    font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.45);
    text-transform: uppercase; letter-spacing: 0.08em; padding-left: 4px;
}
.field-input {
    width: 100%; padding: 10px 14px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: #e8e6f0; font-size: 13px; font-weight: 700;
    transition: all 0.15s; outline: none;
}
.field-input:focus { border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.04); }
.field-textarea { resize: none; }

/* ── Tipo buttons ────────────────────────── */
.tipo-btn {
    padding: 8px 16px; border-radius: 8px;
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4);
    cursor: pointer; transition: all 0.15s;
}
.tipo-btn:hover { color: rgba(255,255,255,0.7); }
.tipo-btn--active { border-color: rgba(139,92,246,0.3); }
.tipo-btn.small { padding: 5px 12px; font-size: 10px; }
.tipo-btn--disabled { opacity: 0.35; cursor: not-allowed; }
.tipo--material.tipo-btn--active { background: rgba(59,130,246,0.1); color: #93c5fd; border-color: rgba(59,130,246,0.3); }
.tipo--atividade.tipo-btn--active { background: rgba(245,158,11,0.1); color: #fcd34d; border-color: rgba(245,158,11,0.3); }
.tipo--avaliacao.tipo-btn--active { background: rgba(139,92,246,0.1); color: #c4b5fd; border-color: rgba(139,92,246,0.3); }
.toggle-check { width: 14px; height: 14px; accent-color: #8b5cf6; cursor: pointer; }

/* ── Pergunta card ───────────────────────── */
.pergunta-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 16px;
}

/* ── Bloco select ────────────────────────── */
.bloco-select-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.05);
    cursor: pointer; transition: all 0.15s;
}
.bloco-select-row:hover { background: rgba(255,255,255,0.03); border-color: rgba(139,92,246,0.2); }
.bloco-select-row--selected { background: rgba(139,92,246,0.06); border-color: rgba(139,92,246,0.25); }
.bloco-select-check { flex-shrink: 0; }
.bloco-select-avatar {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15);
    color: #a78bfa; font-size: 11px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.bloco-select-titulo { font-size: 12px; font-weight: 700; color: rgba(232,230,240,0.8); }

/* ── Footer ──────────────────────────────── */
.modal-footer {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.2);
    flex-shrink: 0;
}
.btn-cancelar { color: rgba(255,255,255,0.7); }
.btn-cancelar:hover { background: rgba(239,68,68,0.15); color: #fca5a5; border-color: rgba(239,68,68,0.2); }

.modal-btn-cancel {
    padding: 10px 22px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.45);
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s;
}
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-save {
    padding: 10px 28px; border-radius: 9px; border: none;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    color: #fff; font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s;
    box-shadow: 0 4px 14px rgba(139,92,246,0.35);
    display: flex; align-items: center; gap: 8px;
}
.modal-btn-save:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); box-shadow: 0 6px 20px rgba(139,92,246,0.5); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.action-btn {
    width: 24px; height: 24px; border-radius: 6px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    font-size: 10px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-delete:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }

.add-btn.small {
    padding: 6px 14px; font-size: 10px;
    border-radius: 8px;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border: 1px solid rgba(139,92,246,0.3); color: #fff;
    font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s;
}
.add-btn.small:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); }
</style>
