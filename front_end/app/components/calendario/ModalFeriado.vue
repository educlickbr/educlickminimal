<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="$emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel max-w-md">
            <!-- Accent top bar -->
            <div class="ds-modal-accent-bar" />

            <!-- Header -->
            <div class="ds-modal-header">
                <div class="ds-modal-header-icon text-primary">
                    <Icon name="ph:calendar-blank-bold" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ isEdit ? "Editar" : "Novo" }} Feriado / Recesso
                    </h3>
                    <p class="ds-modal-subtitle">Gestão de Datas Não Letivas</p>
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
                    v-model="formFeriado.nome"
                    label="Nome do Feriado"
                    required
                    placeholder="Ex: Tiradentes, Padroeira local..."
                />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <BaseField
                        v-model="formFeriado.data"
                        label="Data"
                        type="date"
                        required
                    />

                    <div class="flex flex-col gap-1.5 pb-2">
                        <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                            Recorrência
                        </label>
                        <div class="flex items-center gap-3">
                            <input
                                type="checkbox"
                                v-model="formFeriado.recorrente_anual"
                                class="accent-primary"
                            />
                            <span class="text-xs font-bold text-text">
                                Recorrente Anual?
                            </span>
                        </div>
                    </div>
                </div>
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
                    :disabled="
                        loading || !formFeriado.nome.trim() || !formFeriado.data
                    "
                    class="ds-btn-save"
                >
                    <div
                        v-if="loading"
                        class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    ></div>
                    <span>{{
                        loading
                            ? "Salvando..."
                            : isEdit
                              ? "Atualizar Feriado"
                              : "Salvar Feriado"
                    }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore } from "~~/stores/app";
import { useToast } from "~/composables/useToast";

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    feriadoId?: string | null;
    initialData?: any | null;
    idEntidade?: string | null;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const store = useAppStore();
const toast = useToast();
const loading = ref(false);

const formFeriado = reactive({
    id: null as string | null,
    nome: "",
    data: "",
    recorrente_anual: false,
});

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            if (props.initialData) {
                formFeriado.id = props.feriadoId || props.initialData.id;
                formFeriado.nome = props.initialData.nome || "";

                if (props.initialData.data) {
                    formFeriado.data = props.initialData.data.slice(0, 10);
                } else {
                    formFeriado.data = "";
                }

                formFeriado.recorrente_anual =
                    !!props.initialData.recorrente_anual;
            } else {
                formFeriado.id = null;
                formFeriado.nome = "";
                formFeriado.data = new Date().toISOString().slice(0, 10);
                formFeriado.recorrente_anual = false;
            }
        }
    },
    { immediate: true },
);

async function handleSave() {
    if (!formFeriado.nome.trim() || !formFeriado.data) return;

    loading.value = true;
    try {
        const id_entidade =
            props.idEntidade ||
            (store as any).entidades?.[0]?.id ||
            (store as any).company?.id;

        const res = (await $fetch("/api/calendario/feriados", {
            method: "POST",
            body: {
                ...formFeriado,
                id_entidade,
                usuario_id: store.user_expandido_id,
            },
        })) as any;

        if (res?.success) {
            toast.showToast(
                formFeriado.id
                    ? "Feriado atualizado!"
                    : "Feriado criado com sucesso!",
                { type: "success" },
            );
            emit("saved");
            emit("update:modelValue", false);
        }
    } catch (e: any) {
        toast.showToast(e.message || "Erro ao salvar feriado", {
            type: "error",
        });
    } finally {
        loading.value = false;
    }

}
</script>

<style scoped>
.ds-modal-panel {
    display: flex;
}
</style>

