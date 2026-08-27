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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path
                            d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Z"
                        />
                    </svg>
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ isEdit ? "Editar" : "Programar" }} Ciclo
                    </h3>
                    <p class="ds-modal-subtitle">Alocação Temporal do Módulo</p>
                </div>
                <button
                    @click="$emit('update:modelValue', false)"
                    class="ds-modal-close-btn"
                >
                    &times;
                </button>
            </div>
            <div class="modal-tabs">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    @click="activeTab = tab.key"
                    :class="[
                        'modal-tab-btn',
                        activeTab === tab.key ? 'modal-tab-btn--active' : '',
                    ]"
                >
                    {{ tab.label
                    }}<span
                        v-if="
                            tab.key === 'programacao' &&
                            (diasSemana.length > 0 || diasExtras.length > 0)
                        "
                        class="modal-tab-badge"
                        >{{ diasSemana.length + diasExtras.length }}</span
                    >
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <!-- TAB GERAL -->
                <div v-if="activeTab === 'geral'" class="flex flex-col gap-6">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="flex flex-col gap-2">
                            <label
                                class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1"
                                >Módulo Acadêmico (Obrigatório)</label
                            ><select
                                v-model="formGeral.id_modulo"
                                class="w-full px-4 py-3 rounded-lg border border-secondary/10 text-sm font-bold text-primary outline-none"
                                :disabled="isEdit"
                            >
                                <option :value="null" disabled>
                                    Selecione um Módulo
                                </option>
                                <option
                                    v-for="m in modulos"
                                    :key="m.id"
                                    :value="m.id"
                                >
                                    {{ m.nome_modulo
                                    }}{{
                                        m.carga_horaria > 0
                                            ? " · " +
                                              formatCarga(m.carga_horaria)
                                            : ""
                                    }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label
                                class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1"
                                >Data de Início</label
                            ><input
                                type="date"
                                v-model="formGeral.data_ini"
                                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
                            />
                            <p class="text-[9px] text-secondary/40 px-1 italic">
                                Fim automático pela carga horária.
                            </p>
                        </div>
                        <div class="flex flex-col gap-2">
                            <BaseField
                                v-model="formGeral.ano_semestre"
                                label="Ano/Semestre Letivo"
                                type="select"
                                empty-label="Selecione o ano/semestre"
                                :options="semestreOptions"
                                option-value-key="id"
                                option-label-key="nome"
                            />
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <BaseField
                            v-model="formGeral.turno"
                            label="Turno"
                            type="select"
                            empty-label="Selecione o turno"
                            :options="TURNO_OPTIONS"
                            option-value-key="val"
                            option-label-key="label"
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <BaseField
                            v-model="formGeral.descricao"
                            label="Título do Ciclo"
                            placeholder="Ex: Turma A - Manhã"
                        />
                    </div>
                </div>
                <!-- TAB PROGRAMAÇÃO -->
                <CicloTabProgramacao
                    v-if="activeTab === 'programacao'"
                    :dias-semana="diasSemana"
                    :form-semana="formSemana"
                    :DOW_OPTIONS="DOW_OPTIONS"
                    :dias-extras="diasExtras"
                    :form-extra="formExtra"
                    :simulacao-data="simulacaoData"
                    :loading-simulacao="loadingSimulacao"
                    :data-ini="formGeral.data_ini"
                    :format-carga="formatCarga"
                    :format-date-short="formatDateShort"
                    :get-dow-label="getDowLabel"
                    :get-aula-number="getAulaNumber"
                    @add-dia-semana="addDiaSemana"
                    @remove-dia-semana="removeDiaSemana"
                    @simular-calendario="simularCalendario"
                    @add-dia-extra="addDiaExtra"
                    @remove-dia-extra="removeDiaExtra"
                />
            </div>
            <div class="ds-modal-footer" style="justify-content: space-between">
                <p
                    v-if="!isValidForSave"
                    class="text-[10px] font-bold text-red-400 uppercase tracking-widest"
                >
                    Rode a simulação e zere o saldo para salvar.
                </p>
                <div v-else></div>
                <div style="display: flex; gap: 10px">
                    <button
                        @click="$emit('update:modelValue', false)"
                        class="ds-btn-cancel"
                    >
                        Cancelar / Fechar
                    </button>
                    <button
                        @click="handleSaveFinal"
                        :disabled="loading || !isValidForSave"
                        class="ds-btn-save"
                    >
                        {{
                            loading
                                ? "Processando..."
                                : "Gravar Ciclo e Calendário"
                        }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useToast } from "~/composables/useToast";
import { getAnoSemestre, getAnoSemestreList } from "~/utils/anoSemestre";
import CicloTabProgramacao from "./ciclo/CicloTabProgramacao.vue";

interface CicloCtx {
    simularCalendario: (params: {
        id_modulo: string;
        data_inicio: string;
        dias_semana: any[];
        dias_extras: any[];
    }) => Promise<any>;
    handleSaveCiclo: (params: any) => Promise<boolean>;
    fetchDiasConfig: (
        id_ciclo: string,
    ) => Promise<{ diasSemana: any[]; diasExtras: any[] }>;
}

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    cicloId?: string | null;
    idModulo?: string | null;
    nomeModulo?: string;
    initialData?: any | null;
    modulos?: any[];
    cicloCtx: CicloCtx;
}>();
const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const toast = useToast();
const loading = ref(false);
const tabs = [
    { key: "geral", label: "Dados Iniciais" },
    { key: "programacao", label: "Programação do Ciclo" },
];
const activeTab = ref("geral");
const DOW_OPTIONS = [
    { val: 0, label: "Domingo" },
    { val: 1, label: "Segunda-feira" },
    { val: 2, label: "Terça-feira" },
    { val: 3, label: "Quarta-feira" },
    { val: 4, label: "Quinta-feira" },
    { val: 5, label: "Sexta-feira" },
    { val: 6, label: "Sábado" },
];

function formatCarga(minutos: any) {
    const min = parseInt(minutos) || 0;
    if (min === 0) return "00:00";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
function getDowLabel(val: number) {
    return DOW_OPTIONS.find((d) => d.val === val)?.label || "";
}
function formatDateShort(dateStr: string) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}
function getAulaNumber(dia: any, index: number | string) {
    const n = Number(index);
    if (!simulacaoData.value?.dias_gerados) return n + 1;
    return simulacaoData.value.dias_gerados.filter(
        (d: any, idx: number) =>
            idx <= n && ["regular", "extra"].includes(d.tipo),
    ).length;
}

const TURNO_OPTIONS = [
    { val: null, label: "Não definido" },
    { val: "Matutino", label: "Matutino" },
    { val: "Vespertino", label: "Vespertino" },
    { val: "Noturno", label: "Noturno" },
    { val: "Matutino/Vespertino", label: "Matutino/Vespertino" },
    { val: "Vespertino/Noturno", label: "Vespertino/Noturno" },
    { val: "Integral", label: "Integral" },
];

const formGeral = reactive({
    id_modulo: null as string | null,
    data_ini: "",
    descricao: "",
    ano_semestre: null as string | null,
    turno: null as string | null,
});
const semestreOptions = computed(() => getAnoSemestreList(10));
watch(
    () => formGeral.data_ini,
    (newDate) => {
        if (newDate && !formGeral.ano_semestre)
            formGeral.ano_semestre = getAnoSemestre(newDate + "T12:00:00");
    },
);
watch([() => formGeral.id_modulo, () => formGeral.ano_semestre], ([nm, ns]) => {
    if (nm && ns && !formGeral.descricao) {
        const mod = props.modulos?.find((m) => m.id === nm);
        if (mod) formGeral.descricao = `${mod.nome_modulo} - ${ns}`;
    }
});

const diasSemana = ref<any[]>([]);
const formSemana = reactive({
    dia_sem: null as number | null,
    hora_ini: "",
    hora_fim: "",
});
const diasExtras = ref<any[]>([]);
const formExtra = reactive({
    data: "",
    hora_ini: "",
    hora_fim: "",
    observacoes: "",
});
const simulacaoData = ref<any>(null);
const loadingSimulacao = ref(false);

function addDiaSemana() {
    if (
        formSemana.dia_sem === null ||
        !formSemana.hora_ini ||
        !formSemana.hora_fim
    )
        return toast.showToast("Preencha os campos de horário e dia", {
            type: "error",
        });
    if (diasSemana.value.some((d) => d.dia_sem === formSemana.dia_sem))
        return toast.showToast(
            "Esse dia da semana já tem uma regra cadastrada",
            { type: "error" },
        );
    diasSemana.value.push({
        dia_sem: formSemana.dia_sem,
        hora_ini: formSemana.hora_ini,
        hora_fim: formSemana.hora_fim,
        dia_sem_txt: getDowLabel(formSemana.dia_sem),
    });
    formSemana.dia_sem = null;
    formSemana.hora_ini = "";
    formSemana.hora_fim = "";
    invalidateSimulacao();
}
function removeDiaSemana(idx: number) {
    diasSemana.value.splice(idx, 1);
    invalidateSimulacao();
}
function addDiaExtra() {
    if (!formExtra.data || !formExtra.hora_ini || !formExtra.hora_fim)
        return toast.showToast("Data e horários obrigatórios", {
            type: "error",
        });
    diasExtras.value.push({ ...formExtra });
    formExtra.data = "";
    formExtra.hora_ini = "";
    formExtra.hora_fim = "";
    formExtra.observacoes = "";
    invalidateSimulacao();
}
function removeDiaExtra(idx: number) {
    diasExtras.value.splice(idx, 1);
    invalidateSimulacao();
}
function invalidateSimulacao() {
    simulacaoData.value = null;
}

const isValidForSave = computed(
    () =>
        simulacaoData.value?.success &&
        simulacaoData.value?.saldo_minutos === 0,
);

async function simularCalendario() {
    const fid = formGeral.id_modulo || props.idModulo;
    if (!fid) {
        activeTab.value = "geral";
        return toast.showToast("Selecione primeiro o Módulo.", {
            type: "error",
        });
    }
    if (!formGeral.data_ini) {
        activeTab.value = "geral";
        return toast.showToast("Preencha a Data de Início.", { type: "error" });
    }
    if (diasSemana.value.length === 0)
        return toast.showToast("Adiciona ao menos um Dia Semanal Regular.", {
            type: "error",
        });
    loadingSimulacao.value = true;
    try {
        simulacaoData.value = await props.cicloCtx.simularCalendario({
            id_modulo: fid,
            data_inicio: formGeral.data_ini,
            dias_semana: diasSemana.value,
            dias_extras: diasExtras.value,
        });
    } catch (e: any) {
        toast.showToast(e.message, { type: "error" });
        simulacaoData.value = { success: false, message: e.message };
    } finally {
        loadingSimulacao.value = false;
    }
}

async function handleSaveFinal() {
    if (!isValidForSave.value) return;
    const fid = formGeral.id_modulo || props.idModulo;
    if (!fid) {
        activeTab.value = "geral";
        return toast.showToast("Selecione um módulo", { type: "error" });
    }
    loading.value = true;
    const ok = await props.cicloCtx.handleSaveCiclo({
        cicloId: props.cicloId || null,
        id_modulo: fid,
        descricao: formGeral.descricao,
        ano_semestre: formGeral.ano_semestre,
        turno: formGeral.turno,
        data_ini: formGeral.data_ini,
        data_fim: simulacaoData.value.data_fim,
        dias_semana: diasSemana.value,
        dias_extras: diasExtras.value,
    });
    loading.value = false;
    if (ok) {
        emit("saved");
        emit("update:modelValue", false);
    }
}

watch(
    () => props.modelValue,
    async (val) => {
        if (val) {
            activeTab.value = "geral";
            simulacaoData.value = null;
            if (props.initialData && props.cicloId) {
                formGeral.id_modulo =
                    props.initialData.id_modulo || props.idModulo || null;
                formGeral.data_ini = props.initialData.data_ini || "";
                formGeral.descricao = props.initialData.descricao || "";
                formGeral.ano_semestre = props.initialData.ano_semestre || null;
                formGeral.turno = props.initialData.turno || null;
                const config = await props.cicloCtx.fetchDiasConfig(
                    props.cicloId,
                );
                diasSemana.value = config.diasSemana;
                diasExtras.value = config.diasExtras;
                await simularCalendario();
            } else {
                formGeral.id_modulo = props.idModulo || null;
                formGeral.data_ini = "";
                formGeral.descricao = "";
                formGeral.ano_semestre = null;
                formGeral.turno = null;
                diasSemana.value = [];
                diasExtras.value = [];
            }
        }
    },
    { immediate: true },
);
</script>

<style scoped>
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
.ds-modal-panel--lg {
    max-width: 900px;
    max-height: 92vh;
}
.modal-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--field-border);
    background: var(--color-secondary-surface);
    padding: 0 20px;
    flex-shrink: 0;
}
.modal-tab-btn {
    padding: 12px 16px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-secondary);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}
.modal-tab-btn:hover {
    color: var(--color-text);
}
.modal-tab-btn--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
}
.modal-tab-badge {
    font-size: 9px;
    font-weight: 900;
    background: rgba(139, 92, 246, 0.18);
    color: var(--color-primary);
    padding: 1px 6px;
    border-radius: 999px;
}
</style>
