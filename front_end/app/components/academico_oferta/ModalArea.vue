<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="$emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel">
            <!-- Accent top bar -->
            <div class="ds-modal-accent-bar"></div>

            <!-- Header -->
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
                            d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,128H40V56H92.69L120,83.31A15.86,15.86,0,0,0,131.31,88H216Z"
                        />
                    </svg>
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ isEdit ? "Editar" : "Nova" }} Área Educacional
                    </h3>
                    <p class="ds-modal-subtitle">
                        Organização e Categorização da Oferta
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
            <div class="p-6 flex flex-col gap-5">
                <BaseField
                    v-model="formArea.nome_area"
                    label="Nome da Área"
                    required
                    placeholder="Ex: Pós-Graduação, Saúde, Exatas..."
                />

                <BaseField
                    v-model="formArea.descricao"
                    label="Descrição"
                    type="textarea"
                    optional
                    placeholder="Breve descrição dos cursos que compõem esta área..."
                />
            </div>

            <!-- Footer -->
            <div class="ds-modal-footer">
                <button
                    @click="$emit('update:modelValue', false)"
                    class="ds-btn-cancel"
                >
                    Cancelar
                </button>
                <button
                    @click="handleSave"
                    :disabled="loading || !formArea.nome_area.trim()"
                    class="ds-btn-save"
                >
                    <div
                        v-if="loading"
                        class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    ></div>
                    {{
                        loading
                            ? "Salvando..."
                            : isEdit
                              ? "Atualizar Área"
                              : "Criar Área"
                    }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    areaId?: string | null;
    initialData?: any | null;
    /** Função de save injetada pelo composable da tab */
    onSave: (data: {
        id: string | null;
        nome_area: string;
        descricao: string;
    }) => Promise<boolean>;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const loading = ref(false);

const formArea = reactive({
    id: null as string | null,
    nome_area: "",
    descricao: "",
});

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            if (props.initialData) {
                formArea.id = props.areaId || props.initialData.id;
                formArea.nome_area = props.initialData.nome_area || "";
                formArea.descricao = props.initialData.descricao || "";
            } else {
                formArea.id = null;
                formArea.nome_area = "";
                formArea.descricao = "";
            }
        }
    },
    { immediate: true },
);

async function handleSave() {
    if (!formArea.nome_area.trim()) return;

    loading.value = true;
    const ok = await props.onSave({ ...formArea });
    loading.value = false;

    if (ok) {
        emit("saved");
        emit("update:modelValue", false);
    }
}
</script>

<style scoped>
/* SFC Style */
</style>
