<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="$emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel ds-modal-panel--lg">
            <div class="ds-modal-accent-bar"></div>
            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <Icon name="ph:books-bold" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ isEdit ? "Editar" : "Nova" }} Oferta Acadêmica
                        (Programa)
                    </h3>
                    <p class="ds-modal-subtitle">
                        Agrupamento de Ciclos para Oferta
                    </p>
                </div>
                <button
                    @click="$emit('update:modelValue', false)"
                    class="ds-modal-close-btn"
                >
                    &times;
                </button>
            </div>
            <!-- Step indicator -->
            <div class="step-indicator">
                <template v-for="(step, idx) in steps" :key="step.key">
                    <div
                        class="step-item"
                        :class="{
                            'step-item--active': activeStep === idx,
                            'step-item--done': activeStep > idx,
                            'step-item--future': activeStep < idx,
                        }"
                    >
                        <div class="step-bubble">
                            <svg
                                v-if="activeStep > idx"
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                            >
                                <path
                                    d="M2 5l2.5 2.5L8 3"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                            <span v-else>{{ idx + 1 }}</span>
                        </div>
                        <span class="step-label">{{ step.label }}</span>
                    </div>
                    <div v-if="idx < steps.length - 1" class="step-connector">
                        <div
                            class="step-connector-line"
                            :class="
                                activeStep > idx
                                    ? 'step-connector-line--done'
                                    : ''
                            "
                        ></div>
                    </div>
                </template>
            </div>
            <!-- Step content -->
            <div
                class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-background"
            >
                <ProgramaStepOrigem
                    v-if="!isEdit && activeStep === 0"
                    :origem="form.origem"
                    @select-origem="setOrigem"
                />
                <ProgramaStepCiclos
                    v-if="activeStep === 1"
                    :origem="form.origem"
                    :id-curso="form.id_curso"
                    :ciclos-selecionados="form.ciclos_selecionados"
                    :list-cursos="listCursos"
                    :ciclos-encontrados="ciclosEncontrados"
                    :loading-ciclos="loadingCiclos"
                    :modulos-pendentes-curso="modulosPendentesCurso"
                    :format-date-short="formatDateShort"
                    @update:id-curso="form.id_curso = $event"
                    @update:ciclos-selecionados="
                        form.ciclos_selecionados = $event
                    "
                    @fetch-curso-ciclos="fetchCursoCiclos"
                />
                <ProgramaStepProcessos
                    v-if="activeStep === 2"
                    :processos="form.processos"
                    :can-add-processo="canAddProcesso"
                    :validation-message="processosValidationMessage"
                    @add-processo="addProcessoCard"
                    @remove-processo="removeProcessoCard"
                />
                <ProgramaStepConclusao
                    v-if="activeStep === 3"
                    :is-edit="isEdit"
                    :origem="form.origem"
                    :id-curso="form.id_curso"
                    :id-area="form.id_area"
                    :estrategia="form.estrategia"
                    :descricao="form.descricao"
                    :descricoes-multiplas="form.descricoes_multiplas"
                    :ciclos-selecionados="form.ciclos_selecionados"
                    :ciclos-encontrados="ciclosEncontrados"
                    :list-cursos="listCursos"
                    :list-areas="listAreas"
                    :tem-overlapping="temOverlapping"
                    :gratuito="form.gratuito"
                    :exige-processo-seletivo="form.exige_processo_seletivo"
                    @update:estrategia="
                        form.estrategia = $event as 'unica' | 'separada'
                    "
                    @update:id-area="form.id_area = $event"
                    @update:descricao="form.descricao = $event"
                    @update:descricao-multipla="
                        (cId, v) => (form.descricoes_multiplas[cId] = v)
                    "
                    @update:gratuito="form.gratuito = $event"
                    @update:exige-processo-seletivo="
                        form.exige_processo_seletivo = $event
                    "
                />
            </div>
            <!-- Footer -->
            <div class="ds-modal-footer" style="justify-content: space-between">
                <button
                    v-if="activeStep > (isEdit ? 1 : 0)"
                    @click="activeStep--"
                    class="ds-btn-cancel"
                >
                    Voltar
                </button>
                <button
                    v-else
                    @click="$emit('update:modelValue', false)"
                    class="ds-btn-cancel"
                >
                    Cancelar
                </button>
                <button
                    v-if="activeStep < steps.length - 1"
                    @click="nextStep"
                    :disabled="!canProceed"
                    class="ds-btn-save"
                >
                    Avançar Etapa
                </button>
                <button
                    v-else
                    @click="handleSave"
                    :disabled="loading || !canSave"
                    class="ds-btn-save"
                >
                    <Icon
                        v-if="loading"
                        name="ph:circle-notched-bold"
                        class="animate-spin mr-1"
                    />{{ loading ? "Salvando..." : "Salvar Programa" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useToast } from "~/composables/useToast";
import ProgramaStepOrigem from "./programa/ProgramaStepOrigem.vue";
import ProgramaStepCiclos from "./programa/ProgramaStepCiclos.vue";
import ProgramaStepProcessos from "./programa/ProgramaStepProcessos.vue";
import ProgramaStepConclusao from "./programa/ProgramaStepConclusao.vue";

type ProcessoForm = {
    id: string | null;
    nome_processo: string;
    data_inicio: string | null;
    data_fim: string | null;
    matricula_inicio: string | null;
    matricula_fim: string | null;
};
function createEmptyProcesso(ordem: number): ProcessoForm {
    return {
        id: null,
        nome_processo: `Processo ${ordem}`,
        data_inicio: null,
        data_fim: null,
        matricula_inicio: null,
        matricula_fim: null,
    };
}

interface ProgramaCtx {
    loading: import("vue").Ref<boolean>;
    listCursos: import("vue").Ref<any[]>;
    listModulos: import("vue").Ref<any[]>;
    listAreas: import("vue").Ref<any[]>;
    loadingCiclos: import("vue").Ref<boolean>;
    ciclosEncontrados: import("vue").Ref<any[]>;
    modulosPendentesCurso: import("vue").Ref<string[]>;
    temOverlapping: import("vue").Ref<boolean>;
    fetchBaseLists: (cursosProp?: any[]) => Promise<void>;
    fetchCursoCiclos: (id_curso: string) => Promise<void>;
    fetchAllCiclos: () => Promise<void>;
    checkOverlapping: (selected: string[]) => void;
    toDateMs: (dateStr: string | null) => number | null;
    handleSave: (params: any) => Promise<boolean>;
    initEdit: (
        programaId: string,
    ) => Promise<{ resCiclos: any; resProcessos: any }>;
}

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    programaId?: string | null;
    initialData?: any | null;
    cursos?: any[];
    programaCtx: ProgramaCtx;
}>();
const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

// Aliases do programaCtx
const listCursos = computed(() => props.programaCtx.listCursos.value);
const listAreas = computed(() => props.programaCtx.listAreas.value);
const ciclosEncontrados = computed(
    () => props.programaCtx.ciclosEncontrados.value,
);
const loadingCiclos = computed(() => props.programaCtx.loadingCiclos.value);
const modulosPendentesCurso = computed(
    () => props.programaCtx.modulosPendentesCurso.value,
);
const temOverlapping = computed(() => props.programaCtx.temOverlapping.value);
const loading = computed(() => props.programaCtx.loading.value);

const steps = [
    { key: "origem", label: "Origem" },
    { key: "selecao", label: "Ciclos" },
    { key: "processos", label: "Processos" },
    { key: "resumo", label: "Conclusão" },
];
const activeStep = ref(0);

const form = reactive({
    origem: null as "curso" | "ciclo" | null,
    id_curso: null as string | null,
    id_modulo: null as string | null,
    id_area: null as string | null,
    ciclos_selecionados: [] as string[],
    estrategia: "unica" as "unica" | "separada",
    descricao: "",
    descricoes_multiplas: {} as Record<string, string>,
    processos: [createEmptyProcesso(1)] as ProcessoForm[],
    gratuito: true,
    exige_processo_seletivo: false,
});

function setOrigem(val: "curso" | "ciclo") {
    form.origem = val;
    form.id_curso = null;
    form.id_modulo = null;
    form.id_area = null;
    form.ciclos_selecionados = [];
    if (val === "ciclo") props.programaCtx.fetchAllCiclos();
}
async function fetchCursoCiclos() {
    if (form.id_curso) await props.programaCtx.fetchCursoCiclos(form.id_curso);
}

const canAddProcesso = computed(() =>
    form.processos.every((p) => Boolean(p.data_inicio && p.data_fim)),
);
function addProcessoCard() {
    if (!canAddProcesso.value) return;
    form.processos.push(createEmptyProcesso(form.processos.length + 1));
}
function removeProcessoCard(index: number) {
    if (form.processos.length <= 1) return;
    form.processos.splice(index, 1);
}

const processosValidationMessage = computed(() => {
    if (!form.processos.length)
        return "Adicione ao menos um processo seletivo.";
    for (let i = 0; i < form.processos.length; i++) {
        const p = form.processos[i]!;
        const nome = p.nome_processo?.trim();
        const iniMs = props.programaCtx.toDateMs(p.data_inicio);
        const fimMs = props.programaCtx.toDateMs(p.data_fim);
        const matIniMs = props.programaCtx.toDateMs(p.matricula_inicio);
        const matFimMs = props.programaCtx.toDateMs(p.matricula_fim);
        if (!nome) return `Informe o nome do processo ${i + 1}.`;
        if (iniMs === null || fimMs === null)
            return `Informe início e fim do processo ${i + 1}.`;
        if (fimMs < iniMs)
            return `No processo ${i + 1}, a data final deve ser maior ou igual à inicial.`;
        if (matIniMs !== null && matFimMs !== null && matFimMs < matIniMs)
            return `No processo ${i + 1}, o período de matrícula está inválido.`;
    }
    const ordenados = [...form.processos]
        .map((p, idx) => ({
            idx,
            inicioMs: props.programaCtx.toDateMs(p.data_inicio) as number,
            fimMs: props.programaCtx.toDateMs(p.data_fim) as number,
        }))
        .sort((a, b) => a.inicioMs - b.inicioMs);
    for (let i = 1; i < ordenados.length; i++) {
        if (ordenados[i]!.inicioMs < ordenados[i - 1]!.fimMs)
            return "Os processos não podem ter overlap.";
    }
    return null;
});

const canProceed = computed(() => {
    if (activeStep.value === 0) return form.origem !== null;
    if (activeStep.value === 1) return form.ciclos_selecionados.length > 0;
    if (activeStep.value === 2)
        return processosValidationMessage.value === null;
    return true;
});
const canSave = computed(() => {
    if (form.origem === "ciclo" && !form.id_area) return false;
    if (processosValidationMessage.value !== null) return false;
    if (props.isEdit) return form.descricao.trim().length > 0;
    if (form.estrategia === "separada" && form.ciclos_selecionados.length > 1)
        return form.ciclos_selecionados.every(
            (cId) => (form.descricoes_multiplas[cId] || "").trim().length > 0,
        );
    return (
        form.descricao.trim().length > 0 && form.ciclos_selecionados.length > 0
    );
});

function nextStep() {
    if (!canProceed.value) return;
    if (activeStep.value === 1) {
        props.programaCtx.checkOverlapping(form.ciclos_selecionados);
        if (form.estrategia === "separada" && !props.isEdit) {
            const cursoBase = listCursos.value.find(
                (c: any) => c.id === form.id_curso,
            );
            form.ciclos_selecionados.forEach((cId) => {
                if (!form.descricoes_multiplas[cId]) {
                    const c = ciclosEncontrados.value.find(
                        (x: any) => x.id === cId,
                    );
                    if (c)
                        form.descricoes_multiplas[cId] =
                            `${cursoBase ? cursoBase.nome_curso + " - " : ""}${c.ano_semestre ? c.ano_semestre + " - " : ""}${c.modulo_nome || "Módulo"}`;
                }
            });
        }
    }
    activeStep.value++;
}

async function handleSave() {
    if (!canSave.value) return;
    const ok = await props.programaCtx.handleSave({
        isEdit: props.isEdit,
        programaId: props.programaId || null,
        id_curso: form.id_curso,
        id_area: form.id_area,
        ciclos_selecionados: form.ciclos_selecionados,
        descricao: form.descricao,
        estrategia: form.estrategia,
        descricoes_multiplas: form.descricoes_multiplas,
        processos: form.processos,
        gratuito: form.gratuito,
        exige_processo_seletivo: form.exige_processo_seletivo,
    });
    if (ok) {
        emit("saved");
        emit("update:modelValue", false);
    }
}

function formatDateShort(dateStr: string) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    } catch {
        return dateStr;
    }
}
function formatToLocal(isoStr: string | null) {
    if (!isoStr) return null;
    const date = new Date(isoStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

watch(
    () => props.modelValue,
    async (val) => {
        if (val) {
            props.programaCtx.fetchBaseLists(props.cursos);
            if (props.isEdit && props.initialData) {
                activeStep.value = 1;
                form.descricao = props.initialData.descricao || "";
                form.id_area = props.initialData.id_area || null;
                form.gratuito = props.initialData.gratuito !== false;
                form.exige_processo_seletivo =
                    props.initialData.exige_processo_seletivo === true;
                form.processos = [createEmptyProcesso(1)];
                const { resCiclos, resProcessos } =
                    await props.programaCtx.initEdit(props.programaId!);
                if (resCiclos?.success) {
                    const loaded = resCiclos.ciclos || [];
                    if (props.initialData.id_curso) {
                        form.origem = "curso";
                        form.id_curso = props.initialData.id_curso;
                        await props.programaCtx.fetchCursoCiclos(
                            props.initialData.id_curso,
                        );
                        form.ciclos_selecionados = loaded;
                    } else {
                        form.origem = "ciclo";
                        form.id_modulo = resCiclos.id_modulo || null;
                        await props.programaCtx.fetchAllCiclos();
                        form.ciclos_selecionados = loaded;
                    }
                }
                if (
                    resProcessos?.success &&
                    Array.isArray(resProcessos.itens) &&
                    resProcessos.itens.length > 0
                )
                    form.processos = resProcessos.itens.map(
                        (p: any, idx: number) => ({
                            id: p.id || null,
                            nome_processo:
                                p.nome_processo || `Processo ${idx + 1}`,
                            data_inicio: formatToLocal(p.data_inicio),
                            data_fim: formatToLocal(p.data_fim),
                            matricula_inicio: formatToLocal(p.matricula_inicio),
                            matricula_fim: formatToLocal(p.matricula_fim),
                        }),
                    );
                else {
                    const fb = createEmptyProcesso(1);
                    fb.nome_processo = props.initialData.descricao
                        ? `${props.initialData.descricao} - Processo`
                        : "Processo Seletivo";
                    fb.data_inicio = formatToLocal(
                        props.initialData.processo_seletivo_inicio,
                    );
                    fb.data_fim = formatToLocal(
                        props.initialData.processo_seletivo_fim,
                    );
                    fb.matricula_inicio = formatToLocal(
                        props.initialData.matricula_inicio,
                    );
                    fb.matricula_fim = formatToLocal(
                        props.initialData.matricula_fim,
                    );
                    form.processos = [fb];
                }
            } else {
                activeStep.value = 0;
                form.origem = null;
                form.id_curso = null;
                form.id_modulo = null;
                form.id_area = null;
                form.ciclos_selecionados = [];
                form.estrategia = "unica";
                form.descricao = "";
                form.descricoes_multiplas = {};
                form.processos = [createEmptyProcesso(1)];
                form.gratuito = true;
                form.exige_processo_seletivo = false;
            }
        }
    },
);
</script>

<style scoped>
/* ── Step Indicator ──────────────────────────────── */
.step-indicator {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    background: var(--color-secondary-surface);
    border-bottom: 1px solid var(--field-border);
    gap: 0;
    flex-shrink: 0;
}
.step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
.step-bubble {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 900;
    flex-shrink: 0;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}
.step-item--active .step-bubble {
    background: rgba(139, 92, 246, 0.15);
    border-color: var(--color-primary);
    color: var(--color-primary);
}
.step-item--done .step-bubble {
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.5);
    color: #4ade80;
}
.step-item--future .step-bubble {
    background: var(--color-secondary-surface);
    border-color: var(--field-border);
    color: var(--color-secondary);
}
.step-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: color 0.2s ease;
}
.step-item--active .step-label {
    color: var(--color-primary);
}
.step-item--done .step-label {
    color: rgba(74, 222, 128, 0.8);
}
.step-item--future .step-label {
    color: var(--color-secondary);
}

.step-connector {
    flex: 1;
    min-width: 16px;
    max-width: 40px;
    padding: 0 6px;
}
.step-connector-line {
    height: 1px;
    background: var(--field-border);
    border-radius: 1px;
    transition: background 0.3s ease;
}
.step-connector-line--done {
    background: rgba(34, 197, 94, 0.3);
}

.ds-modal-panel--lg {
    max-width: 900px;
    max-height: 92vh;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.1);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
textarea {
    background: var(--field-bg) !important;
    border-color: var(--field-border) !important;
    color: var(--field-text) !important;
    transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease !important;
}
select {
    background-color: var(--field-bg-select) !important;
    border-color: var(--field-border) !important;
    color: var(--field-text) !important;
    transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
    background-position: right 1rem center !important;
    background-repeat: no-repeat !important;
    background-size: 1.2em 1.2em !important;
    padding-right: 2.5rem !important;
}
select option {
    background: var(--field-bg-option) !important;
    color: var(--field-text) !important;
}
</style>
