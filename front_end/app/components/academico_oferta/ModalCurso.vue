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
                            d="M231.65,194.55,198.46,36.75a16,16,0,0,0-19-12.39L132.65,34.61A16.08,16.08,0,0,0,121,53.4l.33,1.49L112,56.56V48a16,16,0,0,0-16-16H40A16,16,0,0,0,24,48V200a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V166.23l47.06,10.51a16.09,16.09,0,0,0,19-12.39Z"
                        />
                    </svg>
                </div>
                <div class="modal-header-text">
                    <h3 class="modal-title">
                        {{ isEdit ? "Editar" : "Novo" }} Curso
                    </h3>
                    <p class="modal-subtitle">
                        Configuração da Grade Curricular
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
                        v-if="tab.key === 'grade' && modulosDoCurso.length > 0"
                        class="modal-tab-badge"
                        >{{ modulosDoCurso.length }}</span
                    ><span
                        v-if="
                            tab.key === 'areas' && areasDisponiveis.length > 0
                        "
                        class="modal-tab-badge"
                        >{{ areasDisponiveis.length }}</span
                    >
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <!-- TAB GERAL -->
                <div v-if="activeTab === 'geral'" class="flex flex-col gap-5">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label
                                class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1"
                                >Nome do Curso</label
                            ><input
                                v-model="formCurso.nome_curso"
                                placeholder="Ex: Engenharia de Software"
                                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label
                                class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1"
                                >Área Educacional</label
                            ><select
                                v-model="formCurso.id_area"
                                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
                            >
                                <option :value="null">
                                    Selecione uma área...
                                </option>
                                <option
                                    v-for="a in areasDisponiveis"
                                    :key="a.id"
                                    :value="a.id"
                                >
                                    {{ a.nome_area }}
                                </option>
                            </select>
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
                    :saved-curso-id="savedCursoId"
                    :formCM="formCM"
                    :modulos-disponiveis="modulosDisponiveis"
                    :modulos-do-curso="modulosDoCurso"
                    :loading-modulos-curso="loadingModulosCurso"
                    :loadingCM="loadingCM"
                    @add-modulo="handleAddModulo"
                    @remove-modulo="handleRemoveModulo"
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
                    @click="handleSaveCurso"
                    :disabled="loadingCurso"
                    class="modal-btn-save"
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
    font-weight: 700;
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
