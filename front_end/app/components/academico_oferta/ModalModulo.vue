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
                            d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"
                        />
                    </svg>
                </div>
                <div class="modal-header-text">
                    <h3 class="modal-title">
                        {{ isEdit ? "Editar" : "Novo" }} Módulo
                    </h3>
                    <p class="modal-subtitle">
                        Configuração pedagógica
                        <span
                            v-if="totalCargaModulo > 0"
                            class="ml-2 text-primary font-black"
                            >· Total: {{ toHHMM(totalCargaModulo) }}</span
                        >
                    </p>
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
                            tab.key === 'componentes' &&
                            componentesDoModulo.length > 0
                        "
                        class="modal-tab-badge"
                        >{{ componentesDoModulo.length }}</span
                    >
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <!-- TAB GERAL -->
                <div v-if="activeTab === 'geral'" class="flex flex-col gap-5">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label
                                class="text-[10px] font-black text-secondary/60 uppercase tracking-widest"
                                >Nome do Módulo</label
                            ><input
                                v-model="formModulo.nome_modulo"
                                placeholder="Ex: Fundamentos de IA"
                                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label
                                class="text-[10px] font-black text-secondary/60 uppercase tracking-widest"
                                >Carga Horária Total
                                <span
                                    class="text-secondary/30 font-bold normal-case tracking-normal"
                                    >(Calculado)</span
                                ></label
                            >
                            <div
                                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-div-10 text-sm font-black text-primary tabular-nums opacity-80 cursor-not-allowed"
                            >
                                {{ toHHMM(totalCargaModulo) || "00:00" }}
                            </div>
                            <p
                                class="text-[9px] text-secondary/40 font-bold px-1 italic"
                            >
                                Obs: A carga horária é a soma dos componentes na
                                aba seguinte.
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label
                            class="text-[10px] font-black text-secondary/60 uppercase tracking-widest"
                            >Descrição / Objetivo</label
                        ><RichTextEditor
                            v-model="formModulo.descricao"
                            placeholder="Descreva o que será abordado neste módulo..."
                        />
                    </div>
                </div>
                <!-- TAB COMPONENTES -->
                <ModuloTabComponentes
                    v-if="activeTab === 'componentes'"
                    :saved-modulo-id="savedModuloId"
                    :formMC="formMC"
                    :componentes-disponiveis="componentesDisponiveis"
                    :componentes-do-modulo="componentesDoModulo"
                    :loading-componentes-modulo="loadingComponentesModulo"
                    :loading-add-componente="loadingAddComponente"
                    @add-componente="handleAddComponente"
                    @remove-componente="handleRemoveComponente"
                />
                <!-- TAB PLANOS -->
                <ModuloTabPlanos
                    v-if="activeTab === 'planos'"
                    :saved-modulo-id="savedModuloId"
                    :editing-plano-id="editingPlanoId"
                    :form-plano="formPlano"
                    :componentes-para-plano="componentesParaPlano"
                    :planos="planos"
                    :loading-planos="loadingPlanos"
                    :loading-plano="loadingPlano"
                    @save-plano="handleSavePlano"
                    @reset-plano="resetPlanoForm"
                    @edit-plano="editPlano"
                    @delete-plano="confirmDeletePlano"
                />
            </div>
            <div v-if="activeTab === 'geral'" class="modal-footer">
                <button
                    @click="$emit('update:modelValue', false)"
                    class="modal-btn-cancel"
                >
                    Cancelar
                </button>
                <button
                    @click="handleSaveModulo"
                    :disabled="loadingModulo"
                    class="modal-btn-save"
                >
                    {{ loadingModulo ? "Processando..." : "Salvar Módulo" }}
                </button>
            </div>
        </div>
        <ModalConfirmacao
            v-model="showConfirmDeletePlano"
            title="Excluir Plano de Aula"
            message="Tem certeza?"
            type="danger"
            confirmText="Excluir Plano"
            :loading="isDeletingPlano"
            @confirm="handleDeletePlano"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useCargaHoraria } from "~/composables/useCargaHoraria";
import ModuloTabComponentes from "./modulo/ModuloTabComponentes.vue";
import ModuloTabPlanos from "./modulo/ModuloTabPlanos.vue";

interface Componente {
    id: string;
    nome_componente: string;
}
interface PlanoAula {
    id?: string;
    id_componente: string | null;
    titulo_plano: string;
    ementa: string | null;
}

interface ModuloCtx {
    saveModulo: (data: {
        id: string | null;
        nome_modulo: string;
        descricao: string;
        carga_horaria: number | null;
    }) => Promise<string | null>;
    componentesDoModulo: any[];
    loadingComponentesModulo: boolean;
    loadingAddComponente: boolean;
    fetchComponentesDoModulo: (id: string) => Promise<void>;
    addComponente: (id: string, d: any) => Promise<void>;
    removeComponente: (id: string, idc: string) => Promise<void>;
    planos: any[];
    loadingPlanos: boolean;
    loadingPlano: boolean;
    fetchPlanos: (id: string) => Promise<void>;
    savePlano: (id: string, d: any) => Promise<boolean>;
    deletePlano: (id: string) => Promise<void>;
}

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    moduloId?: string | null;
    initialData?: any | null;
    componentes: Componente[];
    moduloCtx: ModuloCtx;
}>();
const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const tabs = [
    { key: "geral", label: "Informações Gerais" },
    { key: "componentes", label: "Componentes" },
    { key: "planos", label: "Planos de Aula" },
];
const activeTab = ref("geral");
const savedModuloId = ref<string | null>(null);
const currentModuloId = computed(() => props.moduloId || savedModuloId.value);

const componentesDoModulo = computed(() => props.moduloCtx.componentesDoModulo);
const loadingComponentesModulo = computed(
    () => props.moduloCtx.loadingComponentesModulo,
);
const loadingAddComponente = computed(
    () => props.moduloCtx.loadingAddComponente,
);
const planos = computed(() => props.moduloCtx.planos);
const loadingPlanos = computed(() => props.moduloCtx.loadingPlanos);
const loadingPlano = computed(() => props.moduloCtx.loadingPlano);

const loadingModulo = ref(false);
const { toHHMM } = useCargaHoraria();
const formModulo = reactive({
    nome_modulo: "",
    descricao: "",
    carga_horaria: null as number | null,
});
const totalCargaModulo = computed(() =>
    props.moduloCtx.componentesDoModulo.reduce(
        (sum: number, mc: any) => sum + (mc.carga_horaria || 0),
        0,
    ),
);

const formMC = reactive({
    id_componente: null as string | null,
    horas: null as number | null,
    minutos: null as number | null,
    obrigatorio: true,
});
const componentesDisponiveis = computed(() => {
    const ids = new Set(
        props.moduloCtx.componentesDoModulo.map((mc: any) => mc.id_componente),
    );
    return props.componentes.filter((c) => !ids.has(c.id));
});
const componentesParaPlano = computed(() => {
    if (props.moduloCtx.componentesDoModulo.length > 0)
        return props.moduloCtx.componentesDoModulo.map((mc: any) => ({
            id: mc.id_componente,
            nome_componente: mc.nome_componente,
        }));
    return props.componentes;
});

async function handleAddComponente() {
    if (!formMC.id_componente) return;
    if (!currentModuloId.value) return alert("Salve o módulo primeiro");
    const h = parseInt(formMC.horas as any) || 0;
    const m = parseInt(formMC.minutos as any) || 0;
    const tm = h * 60 + m;
    if (tm <= 0) return alert("Informe a carga horária");
    await props.moduloCtx.addComponente(currentModuloId.value, {
        id_componente: formMC.id_componente,
        carga_horaria: tm,
        obrigatorio: formMC.obrigatorio,
    });
    formMC.id_componente = null;
    formMC.horas = null;
    formMC.minutos = null;
}
async function handleRemoveComponente(idc: string) {
    if (!currentModuloId.value) return;
    await props.moduloCtx.removeComponente(currentModuloId.value, idc);
}

const editingPlanoId = ref<string | null>(null);
const formPlano = reactive<PlanoAula>({
    id_componente: null,
    titulo_plano: "",
    ementa: "",
});
const showConfirmDeletePlano = ref(false);
const planoToDelete = ref<string | null>(null);
const isDeletingPlano = ref(false);

async function handleSavePlano() {
    if (!formPlano.id_componente || !formPlano.titulo_plano.trim())
        return alert("Componente e título são obrigatórios");
    if (!currentModuloId.value) return;
    const ok = await props.moduloCtx.savePlano(currentModuloId.value, {
        id: editingPlanoId.value,
        id_componente: formPlano.id_componente,
        titulo_plano: formPlano.titulo_plano,
        ementa: formPlano.ementa,
    });
    if (ok) resetPlanoForm();
}
function editPlano(p: any) {
    editingPlanoId.value = p.id;
    formPlano.id_componente = p.id_componente;
    formPlano.titulo_plano = p.titulo_plano;
    formPlano.ementa = p.ementa;
}
function resetPlanoForm() {
    editingPlanoId.value = null;
    formPlano.id_componente = null;
    formPlano.titulo_plano = "";
    formPlano.ementa = "";
}
function confirmDeletePlano(id: string) {
    planoToDelete.value = id;
    showConfirmDeletePlano.value = true;
}
async function handleDeletePlano() {
    if (!planoToDelete.value) return;
    isDeletingPlano.value = true;
    await props.moduloCtx.deletePlano(planoToDelete.value);
    await props.moduloCtx.fetchPlanos(currentModuloId.value!);
    isDeletingPlano.value = false;
    showConfirmDeletePlano.value = false;
    planoToDelete.value = null;
}

async function handleSaveModulo() {
    if (!formModulo.nome_modulo.trim())
        return alert("O nome do módulo é obrigatório");
    loadingModulo.value = true;
    const id = await props.moduloCtx.saveModulo({
        id: props.moduloId || null,
        nome_modulo: formModulo.nome_modulo,
        descricao: formModulo.descricao,
        carga_horaria: totalCargaModulo.value,
    });
    loadingModulo.value = false;
    if (id) {
        savedModuloId.value = id;
        emit("saved");
        if (!props.isEdit) activeTab.value = "componentes";
    }
}

watch(
    () => props.modelValue,
    async (val) => {
        if (val) {
            activeTab.value = "geral";
            savedModuloId.value = null;
            if (props.initialData) {
                formModulo.nome_modulo = props.initialData.nome_modulo || "";
                formModulo.descricao = props.initialData.descricao || "";
                formModulo.carga_horaria =
                    (props.initialData as any).carga_horaria ?? null;
                if (props.moduloId) {
                    props.moduloCtx.fetchPlanos(props.moduloId);
                    props.moduloCtx.fetchComponentesDoModulo(props.moduloId);
                }
            } else {
                formModulo.nome_modulo = "";
                formModulo.descricao = "";
                formModulo.carga_horaria = null;
            }
            resetPlanoForm();
            formMC.id_componente = null;
            formMC.horas = null;
            formMC.minutos = null;
            formMC.obrigatorio = true;
        }
    },
    { immediate: true },
);

watch(activeTab, async (tab) => {
    if (tab === "componentes" && currentModuloId.value)
        await props.moduloCtx.fetchComponentesDoModulo(currentModuloId.value);
    if (tab === "planos" && currentModuloId.value)
        await props.moduloCtx.fetchPlanos(currentModuloId.value);
});
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
