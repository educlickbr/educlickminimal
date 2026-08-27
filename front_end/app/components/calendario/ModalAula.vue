<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="$emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel max-w-lg">
            <div class="ds-modal-accent-bar" />

            <!-- Header -->
            <div class="ds-modal-header">
                <div class="ds-modal-header-icon text-primary">
                    <Icon name="ph:chalkboard-teacher-bold" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        Detalhes da Aula
                        <span v-if="aulaData?.sub_turma" class="ml-2 text-xs font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            Turma {{ aulaData.sub_turma }}
                        </span>
                    </h3>
                    <p class="ds-modal-subtitle">
                        {{ formatDate(aulaData?.data) }} • {{ aulaData?.hora_ini }} – {{ aulaData?.hora_fim }}
                        <span v-if="aulaData?.ciclo_desc"> • {{ aulaData.ciclo_desc }}</span>
                    </p>
                </div>
                <button
                    @click="$emit('update:modelValue', false)"
                    class="ds-modal-close-btn"
                >
                    &times;
                </button>
            </div>

            <!-- Content -->
            <div class="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <!-- Componente Curricular -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                        Componente Curricular
                    </label>
                    <select
                        v-model="form.id_componente"
                        @change="onComponenteChange"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-field-border bg-field-bg text-xs font-bold text-field-text outline-none focus:border-primary/50"
                    >
                        <option :value="null">— Nenhum componente atribuído —</option>
                        <option v-for="c in componentes" :key="c.id" :value="c.id">
                            {{ c.nome_componente }} ({{ c.carga_horaria || 0 }}h)
                        </option>
                    </select>
                </div>

                <!-- Professor / Docente -->
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                            Professor Responsável
                        </label>
                        <span v-if="docenteAutoNome && !form.id_docente_override" class="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                            Atribuído Automático
                        </span>
                        <span v-else-if="form.id_docente_override" class="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                            Substituição Manual
                        </span>
                    </div>

                    <select
                        v-model="form.id_docente_override"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-field-border bg-field-bg text-xs font-bold text-field-text outline-none focus:border-primary/50"
                    >
                        <option :value="null">
                            {{ docenteAutoNome ? `Padrao (${docenteAutoNome})` : '— Selecione um Professor —' }}
                        </option>
                        <option v-for="d in docentes" :key="d.id" :value="d.id">
                            {{ d.nome }} ({{ d.email }})
                        </option>
                    </select>
                </div>

                <!-- Sub-turma / Dividir Aula (Turma A / B) -->
                <div class="p-4 bg-div-15 rounded-xl border border-divider flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col gap-0.5">
                            <span class="text-xs font-bold text-text">Aula Dividida (Turma A e B)</span>
                            <span class="text-[9px] text-secondary/60">
                                Divide os alunos matriculados em ordem alfabética entre duas salas/turmas.
                            </span>
                        </div>
                        <button
                            v-if="!aulaData?.sub_turma"
                            type="button"
                            @click="showDivisao = !showDivisao"
                            class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                        >
                            {{ showDivisao ? 'Cancelar Divisão' : 'Dividir Aula' }}
                        </button>
                        <span v-else class="text-xs font-mono font-bold text-primary">
                            Turma {{ aulaData.sub_turma }}
                        </span>
                    </div>

                    <div v-if="showDivisao" class="mt-2 pt-3 border-t border-divider flex flex-col gap-3">
                        <p class="text-xs font-semibold text-secondary">
                            Configure o Componente e Docente para a <strong class="text-primary">Turma B</strong>:
                        </p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label class="text-[9px] font-black text-secondary/60 uppercase">Componente Turma B</label>
                                <select
                                    v-model="divisaoForm.id_componente_b"
                                    class="w-full mt-1 px-3 py-2 rounded-lg border border-field-border bg-field-bg text-xs font-bold text-field-text"
                                >
                                    <option :value="null">Mesmo da Turma A</option>
                                    <option v-for="c in componentes" :key="'b_'+c.id" :value="c.id">
                                        {{ c.nome_componente }}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="text-[9px] font-black text-secondary/60 uppercase">Professor Turma B</label>
                                <select
                                    v-model="divisaoForm.id_docente_b"
                                    class="w-full mt-1 px-3 py-2 rounded-lg border border-field-border bg-field-bg text-xs font-bold text-field-text"
                                >
                                    <option :value="null">Mesmo da Turma A</option>
                                    <option v-for="d in docentes" :key="'b_'+d.id" :value="d.id">
                                        {{ d.nome }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            @click="handleDividir"
                            :disabled="loadingDividir"
                            class="mt-1 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            <Icon name="ph:split-vertical-bold" class="w-4 h-4" />
                            <span>{{ loadingDividir ? 'Dividindo Turma...' : 'Confirmar Divisão A/B' }}</span>
                        </button>
                    </div>
                </div>

                <!-- Observação / Pauta -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                        Observações / Plano da Aula
                    </label>
                    <textarea
                        v-model="form.observacao"
                        rows="3"
                        placeholder="Ex: Aula de laboratório, entrega de trabalhos..."
                        class="w-full px-3.5 py-2 rounded-xl border border-field-border bg-field-bg text-xs text-field-text outline-none focus:border-primary/50 resize-none"
                    ></textarea>
                </div>
            </div>

            <!-- Footer -->
            <div class="ds-modal-footer">
                <button
                    @click="$emit('update:modelValue', false)"
                    class="ds-btn-cancel"
                >
                    Fechar
                </button>
                <button
                    @click="handleSave"
                    :disabled="loading"
                    class="ds-btn-save"
                >
                    <div
                        v-if="loading"
                        class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    ></div>
                    <span>{{ loading ? "Salvar..." : "Salvar Alterações" }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useToast } from "~/composables/useToast";

const props = defineProps<{
    modelValue: boolean;
    aulaData: any;
    idEntidade: string | null;
    onSaveDetails?: (payload: any) => Promise<boolean>;
    onDividirAula?: (payload: any) => Promise<boolean>;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const toast = useToast();
const loading = ref(false);
const loadingDividir = ref(false);

const componentes = ref<any[]>([]);
const docentes = ref<any[]>([]);
const atribuicoes = ref<any[]>([]);

const showDivisao = ref(false);
const divisaoForm = reactive({
    id_componente_b: null as string | null,
    id_docente_b: null as string | null,
});

const form = reactive({
    id_componente: null as string | null,
    id_docente_override: null as string | null,
    observacao: "",
    sub_turma: null as string | null,
});

const docenteAutoNome = computed(() => {
    if (props.aulaData?.nome_docente && !props.aulaData?.is_docente_override) {
        return props.aulaData.nome_docente;
    }
    if (!form.id_componente) return "";
    const atr = atribuicoes.value.find(
        (a: any) => a.id_modulo_componente === form.id_componente && a.tipo === "titular",
    );
    if (!atr) return "";
    const doc = docentes.value.find((d: any) => d.id === atr.id_docente);
    return doc ? doc.nome : "";
});

watch(
    () => props.modelValue,
    async (val) => {
        if (val && props.aulaData) {
            form.id_componente = props.aulaData.id_componente || null;
            form.id_docente_override = props.aulaData.is_docente_override
                ? props.aulaData.id_docente
                : null;
            form.observacao = props.aulaData.observacao || "";
            form.sub_turma = props.aulaData.sub_turma || null;
            showDivisao.value = false;

            await fetchOpcoes();
        }
    },
    { immediate: true },
);

async function fetchOpcoes() {
    if (!props.idEntidade) return;
    try {
        const res = (await $fetch("/api/programas/opcoes_aula", {
            params: {
                id_entidade: props.idEntidade,
                id_ciclo: props.aulaData?.id_ciclo,
            },
        })) as any;
        if (res?.success) {
            componentes.value = res.componentes || [];
            docentes.value = res.docentes || [];
            atribuicoes.value = res.atribuicoes || [];
        }
    } catch (e: any) {
        console.error("Erro ao buscar opções da aula:", e);
    }
}

function onComponenteChange() {
    // Ao mudar o componente, se não houver override manual, tenta puxar o professor titular atribuído
    if (!form.id_docente_override && form.id_componente) {
        const atr = atribuicoes.value.find(
            (a: any) => a.id_modulo_componente === form.id_componente && a.tipo === "titular",
        );
        if (atr) {
            form.id_docente_override = null; // Mantém fallback no automático
        }
    }
}

function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    return dateStr.split("-").reverse().join("/");
}

async function handleSave() {
    if (!props.aulaData?.id) return;
    loading.value = true;
    try {
        const payload = {
            id: props.aulaData.id,
            id_entidade: props.idEntidade,
            id_componente: form.id_componente,
            id_docente_override: form.id_docente_override,
            observacao: form.observacao,
            sub_turma: form.sub_turma,
            action: "atualizar_detalhes",
        };

        if (props.onSaveDetails) {
            const ok = await props.onSaveDetails(payload);
            if (ok) {
                emit("saved");
                emit("update:modelValue", false);
            }
        } else {
            const res = (await $fetch("/api/programas/aula", {
                method: "PATCH",
                body: payload,
            })) as any;
            if (res?.success) {
                toast.showToast("Detalhes da aula salvos com sucesso!", { type: "success" });
                emit("saved");
                emit("update:modelValue", false);
            }
        }
    } catch (e: any) {
        toast.showToast(e.message || "Erro ao salvar aula", { type: "error" });
    } finally {
        loading.value = false;
    }
}

async function handleDividir() {
    if (!props.aulaData?.id) return;
    loadingDividir.value = true;
    try {
        const payload = {
            id: props.aulaData.id,
            id_entidade: props.idEntidade,
            id_componente_b: divisaoForm.id_componente_b,
            id_docente_b: divisaoForm.id_docente_b,
            action: "dividir",
        };

        if (props.onDividirAula) {
            const ok = await props.onDividirAula(payload);
            if (ok) {
                emit("saved");
                emit("update:modelValue", false);
            }
        } else {
            const res = (await $fetch("/api/programas/aula", {
                method: "PATCH",
                body: payload,
            })) as any;
            if (res?.success) {
                toast.showToast("Aula dividida em Turma A e B com sucesso!", { type: "success" });
                emit("saved");
                emit("update:modelValue", false);
            }
        }
    } catch (e: any) {
        toast.showToast(e.message || "Erro ao dividir aula", { type: "error" });
    } finally {
        loadingDividir.value = false;
    }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 4px; }
</style>
