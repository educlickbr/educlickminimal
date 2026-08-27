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
                    <Icon name="ph:calendar-bold" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ isEdit ? "Editar" : "Novo" }} Evento Acadêmico
                    </h3>
                    <p class="ds-modal-subtitle">Cronograma e Marcos Escolares</p>
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
                <!-- Event Name -->
                <BaseField
                    v-model="formEvento.nome_evento"
                    label="Nome do Evento"
                    required
                    placeholder="Ex: Reunião de Pais, Workshop de Tecnologia..."
                />

                <!-- Dates and Scale -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BaseField
                        v-model="formEvento.data_inicio"
                        label="Data de Início"
                        type="date"
                        required
                    />
                    <BaseField
                        v-model="formEvento.duracao"
                        label="Duração (Dias)"
                        type="number"
                        required
                        :min="1"
                    />
                </div>

                <!-- Previsto / Outcome -->
                <div
                    class="p-3 bg-div-15 rounded-xl border border-divider flex justify-between items-center"
                >
                    <span
                        class="text-[9px] font-black text-secondary/60 uppercase tracking-widest"
                        >Término Previsto</span
                    >
                    <span class="text-xs font-mono font-bold text-primary">{{
                        formatDataFim
                    }}</span>
                </div>

                <!-- Flags -->
                <div
                    class="flex flex-col gap-3 p-4 bg-div-15 rounded-xl border border-divider"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col gap-0.5">
                            <span class="text-xs font-bold text-text"
                                >Sobrepor Calendário?</span
                            >
                            <span
                                class="text-[9px] text-secondary/60 font-medium tracking-tight"
                                >Cancela as aulas normais nestes dias</span
                            >
                        </div>
                        <label
                            class="relative inline-flex items-center cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                v-model="formEvento.sobrescrever_calendario"
                                class="accent-primary"
                            />
                        </label>
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
                        loading ||
                        !formEvento.nome_evento.trim() ||
                        !formEvento.data_inicio
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
                              ? "Atualizar Evento"
                              : "Criar Evento"
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
    eventoId?: string | null;
    initialData?: any | null;
    idEntidade?: string | null;
    onSave?: (payload: any) => Promise<boolean>;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const store = useAppStore();
const toast = useToast();
const loading = ref(false);

const formEvento = reactive({
    id: null as string | null,
    nome_evento: "",
    data_inicio: "",
    duracao: 1,
    sobrescrever_calendario: false,
    descricao: "",
});

const calculatedDataFim = computed(() => {
    if (!formEvento.data_inicio) return "";
    const date = new Date(formEvento.data_inicio + "T12:00:00");
    date.setDate(
        date.getDate() + (parseInt(formEvento.duracao as any) || 1) - 1,
    );
    return date.toISOString().slice(0, 10);
});

const formatDataFim = computed(() => {
    if (!calculatedDataFim.value) return "-";
    return calculatedDataFim.value.split("-").reverse().join("/");
});

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            if (props.initialData) {
                formEvento.id = props.eventoId || props.initialData.id;
                formEvento.nome_evento = props.initialData.nome_evento || "";
                formEvento.data_inicio =
                    props.initialData.data_inicio?.slice(0, 10) || "";
                formEvento.sobrescrever_calendario =
                    !!props.initialData.sobrescrever_calendario;
                formEvento.descricao = props.initialData.descricao || "";

                if (
                    props.initialData.data_inicio &&
                    props.initialData.data_fim
                ) {
                    const start = new Date(
                        props.initialData.data_inicio + "T12:00:00",
                    );
                    const end = new Date(
                        props.initialData.data_fim + "T12:00:00",
                    );
                    const diff =
                        Math.round(
                            (end.getTime() - start.getTime()) /
                                (1000 * 60 * 60 * 24),
                        ) + 1;
                    formEvento.duracao = diff > 0 ? diff : 1;
                } else {
                    formEvento.duracao = 1;
                }
            } else {
                formEvento.id = null;
                formEvento.nome_evento = "";
                formEvento.data_inicio = new Date().toISOString().slice(0, 10);
                formEvento.duracao = 1;
                formEvento.sobrescrever_calendario = false;
                formEvento.descricao = "";
            }
        }
    },
    { immediate: true },
);

async function handleSave() {
    if (!formEvento.nome_evento.trim() || !formEvento.data_inicio) return;

    loading.value = true;
    try {
        const id_entidade =
            props.idEntidade ||
            (store as any).entidades?.[0]?.id ||
            (store as any).company?.id;

        const payload = {
            ...formEvento,
            data_fim: calculatedDataFim.value,
            id_entidade,
            usuario_id: store.user_expandido_id,
        };

        if (props.onSave) {
            const success = await props.onSave(payload);
            if (success) {
                emit("saved");
                emit("update:modelValue", false);
            }
        } else {
            const res = (await $fetch("/api/calendario/eventos", {
                method: "POST",
                body: payload,
            })) as any;

            if (res?.success) {
                toast.showToast(
                    formEvento.id
                        ? "Evento atualizado!"
                        : "Evento criado com sucesso!",
                    { type: "success" },
                );
                emit("saved");
                emit("update:modelValue", false);
            }
        }
    } catch (e: any) {
        toast.showToast(e.message || "Erro ao salvar evento", {
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

