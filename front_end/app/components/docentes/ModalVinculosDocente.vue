<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
    modelValue: boolean;
    docente: any;
    componentesDisponiveis: any[];
    vinculosAtuais: any[];
    onSave: (idDocente: string, vinculos: any[]) => Promise<boolean>;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
}>();

const vinculos = ref<any[]>([]);
const saving = ref(false);
const error = ref("");

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            // Monta lista de vínculos: mescla componentes disponíveis com vínculos atuais
            vinculos.value = props.componentesDisponiveis.map((comp) => {
                const existente = props.vinculosAtuais.find(
                    (v: any) => v.id_componente === comp.id,
                );
                return {
                    id_componente: comp.id,
                    componente_nome: comp.nome,
                    elegivel: existente ? existente.elegivel : false,
                };
            });
            error.value = "";
        }
    },
);

function toggleElegivel(index: number) {
    vinculos.value[index].elegivel = !vinculos.value[index].elegivel;
}

async function handleSave() {
    saving.value = true;
    error.value = "";

    const vinculosParaSalvar = vinculos.value
        .filter((v) => v.elegivel)
        .map((v) => ({
            id_componente: v.id_componente,
            elegivel: true,
        }));

    const ok = await props.onSave(props.docente.id, vinculosParaSalvar);
    saving.value = false;

    if (ok) {
        emit("update:modelValue", false);
    } else {
        error.value = "Erro ao salvar vínculos.";
    }
}
</script>

<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel max-w-lg">
            <div class="ds-modal-accent-bar" />

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <Icon name="ph:link-light" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">Vínculos do Docente</h3>
                    <p class="ds-modal-subtitle">
                        {{ docente?.nome_completo || "—" }}
                    </p>
                </div>
                <button @click="emit('update:modelValue', false)" class="ds-modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="p-6 flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div
                    v-if="componentesDisponiveis.length === 0"
                    class="text-center py-6 text-xs text-secondary/50"
                >
                    Nenhum componente disponível. Crie componentes em Oferta de Cursos primeiro.
                </div>

                <div
                    v-for="(v, idx) in vinculos"
                    :key="v.id_componente"
                    @click="toggleElegivel(idx)"
                    class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all"
                    :class="
                        v.elegivel
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-divider bg-div-15 hover:border-primary/20'
                    "
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                            :class="
                                v.elegivel
                                    ? 'bg-primary border-primary'
                                    : 'border-divider'
                            "
                        >
                            <Icon
                                v-if="v.elegivel"
                                name="ph:check-bold"
                                class="w-3 h-3 text-white"
                            />
                        </div>
                        <span
                            class="text-xs font-bold"
                            :class="v.elegivel ? 'text-text' : 'text-secondary/50'"
                        >
                            {{ v.componente_nome }}
                        </span>
                    </div>
                    <span
                        v-if="v.elegivel"
                        class="text-[9px] font-black uppercase tracking-widest text-emerald-400"
                    >
                        Elegível
                    </span>
                </div>
            </div>

            <!-- Erro -->
            <div
                v-if="error"
                class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mx-6 mb-4"
            >
                {{ error }}
            </div>

            <div class="ds-modal-footer">
                <button
                    @click="emit('update:modelValue', false)"
                    class="ds-btn-cancel"
                    :disabled="saving"
                >
                    Cancelar
                </button>
                <button
                    @click="handleSave"
                    :disabled="saving"
                    class="ds-btn-save"
                >
                    <div
                        v-if="saving"
                        class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    />
                    <span>Salvar Vínculos</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.12);
    border-radius: 4px;
}
</style>
