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
                <!-- Componente Curricular (Enriquecido com Busca & Carga Horária) -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                        Componente Curricular (Módulo do Ciclo)
                    </label>
                    <BaseSelect
                        v-model="form.id_componente"
                        :options="componentesSelectOptions"
                        labelKey="label"
                        valueKey="value"
                        :searchable="true"
                        searchPlaceholder="Buscar componente..."
                        placeholder="— Selecione o componente —"
                        @update:modelValue="onComponenteChange"
                    />
                </div>

                <!-- Professor / Docente (Filtrado por Docentes Atribuídos ao Componente) -->
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

                    <BaseSelect
                        v-model="form.id_docente_override"
                        :options="docentesSelectOptions"
                        labelKey="label"
                        valueKey="value"
                        :searchable="true"
                        searchPlaceholder="Buscar professor..."
                        placeholder="— Selecione o professor —"
                    />
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
                                <BaseSelect
                                    v-model="divisaoForm.id_componente_b"
                                    :options="componentesSelectOptions"
                                    labelKey="label"
                                    valueKey="value"
                                    :searchable="true"
                                    searchPlaceholder="Buscar componente..."
                                    placeholder="Mesmo da Turma A"
                                />
                            </div>
                            <div>
                                <label class="text-[9px] font-black text-secondary/60 uppercase">Professor Turma B</label>
                                <BaseSelect
                                    v-model="divisaoForm.id_docente_b"
                                    :options="docentesSelectOptions"
                                    labelKey="label"
                                    valueKey="value"
                                    :searchable="true"
                                    searchPlaceholder="Buscar professor..."
                                    placeholder="Mesmo da Turma A"
                                />
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

                <!-- Observação / Plano da Aula -->
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
            <div class="ds-modal-footer flex items-center justify-between w-full">
                <div>
                    <button
                        v-if="aulaData?.status !== 'cancelada' && onCancelarAula"
                        type="button"
                        @click="handleCancelar"
                        class="px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all flex items-center gap-1.5"
                    >
                        <Icon name="ph:prohibit-bold" class="w-4 h-4" />
                        <span>Cancelar Aula</span>
                    </button>
                </div>
                <div class="flex items-center gap-2">
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
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useToast } from "~/composables/useToast";
import { useAppStore } from "~~/stores/app";
import BaseSelect from "~/components/global/BaseSelect.vue";

const props = defineProps<{
    modelValue: boolean;
    aulaData: any;
    idEntidade: string | null;
    onSaveDetails?: (payload: any) => Promise<boolean>;
    onDividirAula?: (payload: any) => Promise<boolean>;
    onCancelarAula?: (aula: any) => void;
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

const componentesSelectOptions = computed(() => {
    return [
        { value: null, label: "— Nenhum componente atribuído —" },
        ...componentes.value.map((c: any) => ({
            value: c.id,
            label: c.label_enriquecido || c.nome_componente,
        })),
    ];
});

const docenteAutoNome = computed(() => {
    if (props.aulaData?.nome_docente && !props.aulaData?.is_docente_override) {
        return props.aulaData.nome_docente;
    }
    if (!form.id_componente) return "";
    const atr = atribuicoes.value.find(
        (a: any) => (a.id_componente === form.id_componente || a.id_modulo_componente === form.id_componente) && a.tipo === "titular",
    );
    if (!atr) return "";
    const doc = docentes.value.find((d: any) => d.id === atr.id_docente);
    return doc ? doc.nome : "";
});

const docentesSelectOptions = computed(() => {
    const titularNome = docenteAutoNome.value;

    const defaultLabel = titularNome
        ? `Prof. Titular: ${titularNome} (Automático)`
        : "— Selecione um Professor —";

    const baseList: any[] = [{ value: null, label: defaultLabel }];

    const substitutos: any[] = [];

    docentes.value.forEach((d: any) => {
        if (titularNome && d.nome === titularNome) return;

        substitutos.push({
            value: d.id,
            label: `Substituto: ${d.nome}${d.email ? ' (' + d.email + ')' : ''}`,
        });
    });

    return [...baseList, ...substitutos];
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
    const store = useAppStore();
    const idEntidade =
        props.idEntidade ||
        (store as any).entidades?.[0]?.id ||
        (store as any).company?.id;
    if (!idEntidade) return;
    try {
        const res = (await $fetch("/api/programas/opcoes_aula", {
            params: {
                id_entidade: idEntidade,
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
    if (!form.id_docente_override && form.id_componente) {
        const atr = atribuicoes.value.find(
            (a: any) => (a.id_componente === form.id_componente || a.id_modulo_componente === form.id_componente) && a.tipo === "titular",
        );
        if (atr) {
            form.id_docente_override = null;
        }
    }
}

function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    return dateStr.split("-").reverse().join("/");
}

function handleCancelar() {
    if (props.aulaData && props.onCancelarAula) {
        emit("update:modelValue", false);
        props.onCancelarAula(props.aulaData);
    }
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
