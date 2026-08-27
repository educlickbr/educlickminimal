<script setup lang="ts">
import { ref, watch } from "vue";
import { useToast } from "~/composables/useToast";

const props = defineProps<{
    modelValue: boolean;
    isEdit: boolean;
    initialData?: any;
    idEntidade: string | null;
    onSave: (data: any) => Promise<boolean>;
}>();

const emit = defineEmits(["update:modelValue", "saved"]);
const toast = useToast();

const loading = ref(false);

const form = ref({
    id: null as string | null,
    nome_interno: "",
    label: "",
    placeholder: "",
    tipo_pergunta: "text",
    opcoes: [] as string[],
});

const tiposPergunta = [
    { value: "text", label: "Texto Curto" },
    { value: "textarea", label: "Texto Longo" },
    { value: "select", label: "Caixa de Seleção" },
    { value: "radio", label: "Múltipla Escolha (Opção Única)" },
    { value: "checkbox", label: "Múltipla Escolha (Múltiplas Opções)" },
    { value: "data", label: "Data" },
    { value: "file", label: "Arquivo / Upload" },
];

watch(
    () => props.modelValue,
    (isOpen) => {
        if (isOpen) {
            if (props.isEdit && props.initialData) {
                form.value = {
                    id: props.initialData.id,
                    nome_interno: props.initialData.nome_interno,
                    label: props.initialData.label,
                    placeholder: props.initialData.placeholder || "",
                    tipo_pergunta:
                        props.initialData.tipo_pergunta === "date"
                            ? "data"
                            : props.initialData.tipo_pergunta || "text",
                    opcoes: Array.isArray(props.initialData.opcoes)
                        ? [...props.initialData.opcoes]
                        : [],
                };
            } else {
                form.value = {
                    id: null,
                    nome_interno: "",
                    label: "",
                    placeholder: "",
                    tipo_pergunta: "text",
                    opcoes: [],
                };
            }
        }
    },
    { immediate: true },
);

function fechar() {
    emit("update:modelValue", false);
}

function autoFillNomeInterno() {
    if (!props.isEdit && !form.value.nome_interno && form.value.label) {
        form.value.nome_interno = form.value.label
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/(^_|_$)/g, "");
    }
}

function addOption() {
    form.value.opcoes.push("");
}

function removeOption(idx: number) {
    form.value.opcoes.splice(idx, 1);
}

async function salvar() {
    if (
        !form.value.label ||
        !form.value.nome_interno ||
        !form.value.tipo_pergunta
    ) {
        toast.showToast("Preencha os campos obrigatórios", { type: "error" });
        return;
    }

    if (!props.idEntidade) {
        toast.showToast("Entidade não identificada", { type: "error" });
        return;
    }

    loading.value = true;
    try {
        const success = await props.onSave({
            id: form.value.id,
            id_entidade: props.idEntidade,
            nome_interno: form.value.nome_interno,
            label: form.value.label,
            placeholder: form.value.placeholder,
            tipo_pergunta: form.value.tipo_pergunta,
            opcoes: ["select", "radio", "checkbox"].includes(
                form.value.tipo_pergunta,
            )
                ? form.value.opcoes
                : null,
        });

        if (success) {
            emit("saved");
        }
    } catch (e: any) {
        toast.showToast(e.message || "Erro de comunicação", { type: "error" });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div v-if="modelValue" class="ds-modal-overlay" @click.self="fechar">
        <div class="ds-modal-panel">
            <div class="ds-modal-accent-bar"></div>

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path
                            d="M140,170a12,12,0,1,1-12-12A12,12,0,0,1,140,170ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"
                        />
                    </svg>
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ isEdit ? "Editar Pergunta" : "Nova Pergunta" }}
                    </h3>
                    <p class="ds-modal-subtitle">
                        Configure este campo para seu formulário
                    </p>
                </div>
                <button @click="fechar" class="ds-modal-close-btn">&times;</button>
            </div>

            <div class="p-6 flex flex-col gap-4">
                <BaseField
                    v-model="form.label"
                    label="Título/Label da Pergunta"
                    required
                    placeholder="Ex: Qual o seu nome completo?"
                    @blur="autoFillNomeInterno"
                />

                <div class="grid grid-cols-2 gap-4">
                    <BaseField
                        v-model="form.nome_interno"
                        label="Nome Interno (Único)"
                        required
                        placeholder="Ex: nome_completo"
                    />
                    <BaseField
                        v-model="form.tipo_pergunta"
                        label="Tipo de Resposta"
                        required
                        type="select"
                        empty-label="Selecione o tipo"
                        :options="tiposPergunta"
                    />
                </div>

                <BaseField
                    v-model="form.placeholder"
                    label="Placeholder (Texto de Ajuda)"
                    placeholder="Ex: Digite igual consta no RG..."
                />

                <!-- Options Configuration -->
                <div
                    v-if="
                        ['select', 'radio', 'checkbox'].includes(
                            form.tipo_pergunta,
                        )
                    "
                    class="bg-primary/5 border border-primary/20 p-4 rounded-xl"
                >
                    <div class="flex items-center justify-between mb-3">
                        <label class="block text-xs font-bold text-primary"
                            >Opções da Lista</label
                        >
                        <button
                            @click="addOption"
                            type="button"
                            class="text-[10px] uppercase font-black bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors"
                        >
                            + Adicionar Opção
                        </button>
                    </div>
                    <div
                        v-if="form.opcoes.length === 0"
                        class="text-xs text-secondary italic text-center py-2"
                    >
                        Nenhuma opção adicionada.
                    </div>
                    <div
                        v-else
                        class="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1"
                    >
                        <div
                            v-for="(opt, idx) in form.opcoes"
                            :key="idx"
                            class="flex items-center gap-2"
                        >
                            <div class="flex-1">
                                <BaseField
                                    v-model="form.opcoes[idx]"
                                    placeholder="Opção (ex: Sim)"
                                />
                            </div>
                            <button
                                @click="removeOption(idx)"
                                type="button"
                                class="text-red-400 hover:text-red-300 w-8 h-8 flex-shrink-0 flex items-center justify-center bg-red-400/10 rounded"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ds-modal-footer">
                <button @click="fechar" class="ds-btn-cancel">
                    Cancelar
                </button>
                <button
                    @click="salvar"
                    class="ds-btn-save"
                    :disabled="loading"
                >
                    {{ loading ? "Salvando..." : "Salvar Pergunta" }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Modals via .ds-modal-* global — único ajuste: largura maior que o padrão */
.ds-modal-panel {
    max-width: 640px;
}
</style>
