<template>
    <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="$emit('update:modelValue', false)"
    >
        <div class="modal-panel modal-panel--lg">
            <div class="modal-accent-bar"></div>
            <div class="modal-header">
                <div class="modal-header-icon">
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
                <div class="modal-header-text">
                    <h3 class="modal-title">
                        {{ isEdit ? "Editar" : "Programar" }} Ciclo
                    </h3>
                    <p class="modal-subtitle">Alocação Temporal do Módulo</p>
                </div>
                <button
                    @click="$emit('update:modelValue', false)"
                    class="modal-close-btn"
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
                            <label
                                class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1"
                                >Ano/Semestre Letivo</label
                            ><select
                                v-model="formGeral.ano_semestre"
                                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
                            >
                                <option :value="null">Selecione...</option>
                                <option
                                    v-for="s in semestreOptions"
                                    :key="s.id"
                                    :value="s.id"
                                >
                                    {{ s.nome }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label
                            class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1"
                            >Título do Ciclo</label
                        ><input
                            v-model="formGeral.descricao"
                            placeholder="Ex: Turma A - Manhã"
                            class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
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
            <div class="modal-footer" style="justify-content: space-between">
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
                        class="modal-btn-cancel"
                    >
                        Cancelar / Fechar
                    </button>
                    <button
                        @click="handleSaveFinal"
                        :disabled="loading || !isValidForSave"
                        class="modal-btn-save"
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
import { getAnoSemestre, getAnoSemestreList } from "~~/utils/ano_semestre";
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

const formGeral = reactive({
    id_modulo: null as string | null,
    data_ini: "",
    descricao: "",
    ano_semestre: null as string | null,
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
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    padding: 16px;
    animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
.modal-panel {
    position: relative;
    background: #0f0f17;
    border: 1px solid rgba(139, 92, 246, 0.18);
    border-radius: 16px;
    width: 100%;
    max-width: 680px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow:
        0 24px 80px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(139, 92, 246, 0.1);
    animation: slideUp 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.modal-panel--lg {
    max-width: 900px;
    max-height: 92vh;
}
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
.modal-accent-bar {
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
    flex-shrink: 0;
}
.modal-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
}
.modal-header-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.modal-header-text {
    flex: 1;
}
.modal-title {
    font-size: 13px;
    font-weight: 800;
    color: #e8e6f0;
    letter-spacing: 0.01em;
}
.modal-subtitle {
    font-size: 10px;
    font-weight: 600;
    color: rgba(139, 92, 246, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2px;
}
.modal-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
}
.modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
.modal-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.2);
    padding: 0 20px;
    flex-shrink: 0;
}
.modal-tab-btn {
    padding: 12px 16px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.3);
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
    color: rgba(255, 255, 255, 0.6);
}
.modal-tab-btn--active {
    color: #a78bfa;
    border-bottom-color: #8b5cf6;
}
.modal-tab-badge {
    font-size: 9px;
    font-weight: 900;
    background: rgba(139, 92, 246, 0.18);
    color: #a78bfa;
    padding: 1px 6px;
    border-radius: 999px;
}
.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
}
.modal-btn-cancel {
    padding: 10px 22px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.45);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
}
.modal-btn-cancel:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
}
.modal-btn-save {
    padding: 10px 28px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
    display: flex;
    align-items: center;
    gap: 6px;
}
.modal-btn-save:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
}
.modal-btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
