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
                            d="M231.65,194.55,198.46,36.75a16,16,0,0,0-19-12.39L132.65,34.61A16.08,16.08,0,0,0,121,53.4l.33,1.49L112,56.56V48a16,16,0,0,0-16-16H40A16,16,0,0,0,24,48V200a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V166.23l47.06,10.51a16.09,16.09,0,0,0,19-12.39Z"
                        />
                    </svg>
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ isEdit ? "Editar" : "Novo" }} Curso
                    </h3>
                    <p class="ds-modal-subtitle">
                        Configuração da Grade Curricular
                    </p>
                </div>
                <button
                    @click="$emit('update:modelValue', false)"
                    class="ds-modal-close-btn"
                >
                    &times;
                </button>
            </div>
            <div class="modal-tabs">
                <div class="modal-tabs-inner">
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
                            v-if="tab.key === 'grade' && modulosDoCurso.length > 0"
                            class="modal-tab-badge"
                            >{{ modulosDoCurso.length }}</span
                        ><span
                            v-if="tab.key === 'areas' && areasDisponiveis.length > 0"
                            class="modal-tab-badge"
                            >{{ areasDisponiveis.length }}</span
                        >
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <!-- TAB GERAL -->
                <div v-if="activeTab === 'geral'" class="flex flex-col gap-5">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex flex-col gap-2 md:col-span-2">
                            <BaseField
                                v-model="formCurso.nome_curso"
                                label="Nome do Curso"
                                placeholder="Ex: Engenharia de Software"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <BaseField
                                v-model="formCurso.id_area"
                                label="Área Educacional"
                                type="select"
                                empty-label="Selecione a área"
                                :options="areasDisponiveis"
                                option-value-key="id"
                                option-label-key="nome_area"
                            />
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label
                            class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1"
                            >Descrição do Curso</label
                        ><RichTextEditor
                            v-model="formCurso.descricao"
                            placeholder="Descreva os objetivos e o público-alvo deste curso..."
                        />
                    </div>
                </div>
                <!-- TAB ÁREAS -->
                <CursoTabAreas
                    v-if="activeTab === 'areas'"
                    :form-area="formArea"
                    :areas-disponiveis="areasDisponiveis"
                    :loading-list-areas="loadingListAreas"
                    :loading-area="loadingArea"
                    @save-area="handleSaveArea"
                    @reset-form-area="resetFormArea"
                    @edit-area="editArea"
                    @delete-area="handleDeleteArea"
                />
                <!-- TAB GRADE -->
                <CursoTabGrade
                    v-if="activeTab === 'grade'"
                    :saved-curso-id="currentCursoId"
                    :formCM="formCM"
                    :modulos-disponiveis="modulosDisponiveis"
                    :modulos-do-curso="modulosDoCurso"
                    :loading-modulos-curso="loadingModulosCurso"
                    :loadingCM="loadingCM"
                    @add-modulo="handleAddModulo"
                    @remove-modulo="handleRemoveModulo"
                />
            </div>
            <div v-if="activeTab === 'geral'" class="ds-modal-footer">
                <button
                    @click="$emit('update:modelValue', false)"
                    class="ds-btn-cancel"
                >
                    Cancelar
                </button>
                <button
                    @click="handleSaveCurso"
                    :disabled="loadingCurso"
                    class="ds-btn-save"
                >
                    {{ loadingCurso ? "Processando..." : "Salvar Curso" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import CursoTabAreas from "./curso/CursoTabAreas.vue";
import CursoTabGrade from "./curso/CursoTabGrade.vue";

interface Modulo {
    id: string;
    nome_modulo: string;
}
interface CursoCtx {
    areasDisponiveis: any[];
    loadingListAreas: boolean;
    loadingArea: boolean;
    fetchAreas: () => Promise<void>;
    saveArea: (d: any) => Promise<boolean>;
    deleteArea: (id: string) => Promise<void>;
    saveCurso: (d: any) => Promise<string | null>;
    modulosDoCurso: any[];
    loadingModulosCurso: boolean;
    loadingCM: boolean;
    fetchModulosDoCurso: (id: string) => Promise<void>;
    addModulo: (id: string, d: any) => Promise<void>;
    removeModulo: (id: string, idm: string) => Promise<void>;
}

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    cursoId?: string | null;
    initialData?: any | null;
    modulos: Modulo[];
    cursoCtx: CursoCtx;
}>();
const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const tabs = [
    { key: "areas", label: "1. Áreas" },
    { key: "geral", label: "2. Informações Gerais" },
    { key: "grade", label: "3. Grade Curricular" },
];
const activeTab = ref("geral");
const savedCursoId = ref<string | null>(null);
const currentCursoId = computed(() => props.cursoId || savedCursoId.value);
const loadingCurso = ref(false);
const formCurso = reactive({
    nome_curso: "",
    descricao: "",
    id_area: null as string | null,
});

const areasDisponiveis = computed(() => props.cursoCtx.areasDisponiveis);
const loadingListAreas = computed(() => props.cursoCtx.loadingListAreas);
const loadingArea = computed(() => props.cursoCtx.loadingArea);
const modulosDoCurso = computed(() => props.cursoCtx.modulosDoCurso);
const loadingModulosCurso = computed(() => props.cursoCtx.loadingModulosCurso);
const loadingCM = computed(() => props.cursoCtx.loadingCM);

const formArea = reactive({
    id: null as string | null,
    nome_area: "",
    descricao: "",
});
function resetFormArea() {
    formArea.id = null;
    formArea.nome_area = "";
    formArea.descricao = "";
}
function editArea(a: any) {
    formArea.id = a.id;
    formArea.nome_area = a.nome_area;
    formArea.descricao = a.descricao || "";
}
async function handleSaveArea() {
    const ok = await props.cursoCtx.saveArea({ ...formArea });
    if (ok) resetFormArea();
}
async function handleDeleteArea(id: string) {
    if (!confirm("Tem certeza?")) return;
    await props.cursoCtx.deleteArea(id);
}

const formCM = reactive({ id_modulo: null as string | null, ordem: 0 });
const modulosDisponiveis = computed(() => {
    const ids = new Set(
        props.cursoCtx.modulosDoCurso.map((m: any) => m.id_modulo),
    );
    return props.modulos.filter((m) => !ids.has(m.id));
});
async function handleAddModulo() {
    if (!formCM.id_modulo) return;
    if (!currentCursoId.value) return alert("Salve o curso primeiro");
    await props.cursoCtx.addModulo(currentCursoId.value, {
        id_modulo: formCM.id_modulo,
        ordem: formCM.ordem,
    });
    formCM.id_modulo = null;
    formCM.ordem = modulosDoCurso.value.length + 1;
}
async function handleRemoveModulo(idm: string) {
    if (!currentCursoId.value) return;
    await props.cursoCtx.removeModulo(currentCursoId.value, idm);
}

async function handleSaveCurso() {
    if (!formCurso.nome_curso.trim())
        return alert("O nome do curso é obrigatório");
    loadingCurso.value = true;
    const id = await props.cursoCtx.saveCurso({
        ...formCurso,
        id: props.cursoId || null,
    });
    loadingCurso.value = false;
    if (id) {
        savedCursoId.value = id;
        emit("saved");
        if (!props.isEdit) activeTab.value = "grade";
    }
}

watch(
    () => props.modelValue,
    async (val) => {
        if (val) {
            activeTab.value = props.isEdit ? "geral" : "areas";
            savedCursoId.value = null;
            await props.cursoCtx.fetchAreas();
            if (props.initialData) {
                formCurso.nome_curso = props.initialData.nome_curso || "";
                formCurso.descricao = props.initialData.descricao || "";
                formCurso.id_area = props.initialData.id_area || null;
                if (props.cursoId)
                    await props.cursoCtx.fetchModulosDoCurso(props.cursoId);
            } else {
                formCurso.nome_curso = "";
                formCurso.descricao = "";
                formCurso.id_area = null;
            }
            formCM.id_modulo = null;
            resetFormArea();
        }
    },
    { immediate: true },
);
watch(activeTab, async (tab) => {
    if (tab === "grade" && currentCursoId.value)
        await props.cursoCtx.fetchModulosDoCurso(currentCursoId.value);
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
.ds-modal-panel--lg {
    max-width: 900px;
    max-height: 92vh;
}
.modal-tabs {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--field-border);
    background: var(--color-secondary-surface);
    padding: 10px 20px;
    flex-shrink: 0;
}
.modal-tabs-inner {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--color-secondary-surface);
    border: 1px solid var(--field-border);
    border-radius: 10px;
    padding: 4px;
}
.modal-tab-btn {
    padding: 7px 14px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-secondary);
    background: transparent;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}
.modal-tab-btn:hover {
    color: var(--color-text);
    background: var(--color-secondary-surface-hover);
}
.modal-tab-btn--active {
    color: var(--color-primary);
    background: rgba(139, 92, 246, 0.14);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.modal-tab-badge {
    font-size: 9px;
    font-weight: 900;
    background: rgba(139, 92, 246, 0.2);
    color: var(--color-primary);
    padding: 1px 6px;
    border-radius: 999px;
    line-height: 1.6;
}
</style>
