<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="modelValue"
                class="ds-modal-overlay"
                @click.self="$emit('update:modelValue', false)"
            >
                <div class="ds-modal-panel max-w-md">
                    <div class="ds-modal-accent-bar" />

                    <div class="ds-modal-header">
                        <div class="ds-modal-header-icon">
                            <Icon name="ph:squares-four-bold" class="w-5 h-5 text-primary" />
                        </div>
                        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                            <h3 class="ds-modal-title">{{ isEdit ? "Editar" : "Novo" }} Bloco</h3>
                            <p class="ds-modal-subtitle">Agrupamento de Conteúdo no Repositório</p>
                        </div>
                        <button @click="$emit('update:modelValue', false)" class="ds-modal-close-btn">&times;</button>
                    </div>

                    <div class="p-6 flex flex-col gap-5">
                        <BaseField
                            v-model="form.titulo"
                            label="Título"
                            placeholder="Ex: Introdução ao Roteiro"
                        />

                        <BaseField
                            v-model="form.descricao"
                            label="Descrição (Opcional)"
                            type="textarea"
                            :rows="3"
                            placeholder="Descreva o conteúdo deste bloco..."
                        />

                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Cor de Identificação (Opcional)</label>
                            <div class="flex items-center gap-3">
                                <input
                                    v-model="form.cor_ident"
                                    type="color"
                                    class="w-10 h-10 rounded-lg border border-field-border bg-field-bg cursor-pointer"
                                />
                                <input
                                    v-model="form.cor_ident"
                                    placeholder="#7c3aed"
                                    class="flex-1 px-4 py-2.5 rounded-lg border border-field-border bg-field-bg text-sm font-bold text-field-text focus:border-primary/50 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="ds-modal-footer">
                        <button @click="$emit('update:modelValue', false)" class="ds-btn-cancel">Cancelar</button>
                        <button
                            @click="handleSave"
                            :disabled="loading || !form.titulo.trim()"
                            class="ds-btn-save"
                        >
                            <div v-if="loading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>{{ loading ? "Salvando..." : isEdit ? "Atualizar Bloco" : "Criar Bloco" }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    initialData?: any | null;
    onSave: (data: { id: string | null; titulo: string; descricao: string; cor_ident: string }) => Promise<boolean>;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const loading = ref(false);

const form = reactive({
    id: null as string | null,
    titulo: "",
    descricao: "",
    cor_ident: "",
});

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            if (props.initialData) {
                form.id = props.initialData.id;
                form.titulo = props.initialData.titulo || "";
                form.descricao = props.initialData.descricao || "";
                form.cor_ident = props.initialData.cor_ident || "";
            } else {
                form.id = null;
                form.titulo = "";
                form.descricao = "";
                form.cor_ident = "";
            }
        }
    },
    { immediate: true },
);

async function handleSave() {
    if (!form.titulo.trim()) return;

    loading.value = true;
    const ok = await props.onSave({ ...form });
    loading.value = false;

    if (ok) {
        emit("saved");
        emit("update:modelValue", false);
    }
}
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
