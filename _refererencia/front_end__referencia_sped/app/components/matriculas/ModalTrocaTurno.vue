<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useMatriculasModalTrocaTurno } from "~/composables/matriculas/useMatriculasModalTrocaTurno";
import { useToast } from "../../../composables/useToast";

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false,
    },
    aluno: {
        type: Object as any,
        required: true,
    },
});

const emit = defineEmits(["close", "changed"]);
const toast = useToast();
const { fetchDisponiveis, efetivarTroca } = useMatriculasModalTrocaTurno();

const isLoading = ref(false);
const isSubmitting = ref(false);
const turmasDisponiveis = ref<any[]>([]);
const selectedTurmaId = ref("");
const errorMsg = ref<string | null>(null);

const fetchTurmasDisponiveis = async () => {
    if (!props.aluno || !props.aluno.id_turma) return;

    isLoading.value = true;
    errorMsg.value = null;
    turmasDisponiveis.value = [];
    selectedTurmaId.value = "";

    try {
        const response: any = await fetchDisponiveis({
            id_turma: props.aluno.id_turma,
        });

        if (response.sucesso && response.dados) {
            turmasDisponiveis.value = response.dados;
        } else {
            turmasDisponiveis.value = [];
            if (!response.sucesso) errorMsg.value = response.mensagem;
        }
    } catch (e: any) {
        console.error("Erro ao buscar turmas:", e);
        errorMsg.value = "Erro ao buscar turmas disponíveis.";
    } finally {
        isLoading.value = false;
    }
};

watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            fetchTurmasDisponiveis();
        }
    },
);

const submitTroca = async () => {
    if (!selectedTurmaId.value) {
        toast.showToast("Selecione uma turma de destino.", { type: "error" });
        return;
    }

    isSubmitting.value = true;
    try {
        const response: any = await efetivarTroca({
            id_matricula: props.aluno.id, // ID da matrícula
            id_aluno: props.aluno.aluno_id, // ID do aluno
            id_turma_nova: selectedTurmaId.value,
        });

        if (response.sucesso) {
            toast.showToast(response.mensagem, { type: "success" });
            emit("changed");
            emit("close");
        } else {
            toast.showToast(response.mensagem, { type: "error" });
        }
    } catch (e: any) {
        console.error("Erro na troca:", e);
        toast.showToast("Erro ao efetuar a troca de turno.", { type: "error" });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
        <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="emit('close')"
        ></div>
        <div
            class="relative bg-[#1a1b26] w-full max-w-md rounded-xl border border-white/10 p-6 shadow-2xl animate-in zoom-in duration-200"
        >
            <div class="flex items-center justify-between mb-6">
                <h3
                    class="text-lg font-bold text-white flex items-center gap-2"
                >
                    <svg
                        class="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        ></path>
                    </svg>
                    Troca de Turno
                </h3>
                <button
                    @click="emit('close')"
                    class="text-secondary hover:text-white transition-colors"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>
                </button>
            </div>

            <div
                v-if="isLoading"
                class="flex flex-col items-center justify-center py-8"
            >
                <div
                    class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-2"
                ></div>
                <p class="text-sm text-secondary">
                    Buscando turmas disponíveis...
                </p>
            </div>

            <div v-else>
                <!-- Current Info -->
                <div
                    class="bg-white/5 p-4 rounded-lg mb-6 border border-white/5"
                >
                    <p
                        class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1"
                    >
                        Aluno
                    </p>
                    <p class="text-sm text-white font-bold mb-3">
                        {{ aluno.nome }} {{ aluno.sobrenome }}
                    </p>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p
                                class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1"
                            >
                                Turma Atual
                            </p>
                            <p class="text-xs text-white opacity-80">
                                {{ aluno.nome_curso }}
                            </p>
                        </div>
                        <div>
                            <p
                                class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1"
                            >
                                Turno Atual
                            </p>
                            <span
                                class="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white"
                                >{{ aluno.turno }}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Destination Selection -->
                <div v-if="turmasDisponiveis.length > 0">
                    <label
                        class="block text-xs text-secondary font-bold uppercase tracking-wider mb-2"
                        >Selecione a Nova Turma (Turno)</label
                    >
                    <div class="space-y-2">
                        <label
                            v-for="turma in turmasDisponiveis"
                            :key="turma.id"
                            class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5"
                            :class="
                                selectedTurmaId === turma.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-white/10 bg-[#16161E]'
                            "
                        >
                            <input
                                type="radio"
                                v-model="selectedTurmaId"
                                :value="turma.id"
                                class="hidden"
                            />
                            <div
                                class="w-4 h-4 rounded-full border border-secondary flex items-center justify-center shrink-0"
                                :class="
                                    selectedTurmaId === turma.id
                                        ? 'border-primary bg-primary'
                                        : ''
                                "
                            >
                                <div
                                    v-if="selectedTurmaId === turma.id"
                                    class="w-1.5 h-1.5 bg-white rounded-full"
                                ></div>
                            </div>
                            <div>
                                <p class="text-sm text-white font-bold">
                                    {{ turma.nome }}
                                </p>
                                <p
                                    class="text-xs text-primary font-bold uppercase mt-0.5"
                                >
                                    {{ turma.turno }}
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                <div
                    v-else-if="errorMsg"
                    class="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-center"
                >
                    <p class="text-sm text-red-400 font-bold">{{ errorMsg }}</p>
                </div>
                <div
                    v-else
                    class="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-center"
                >
                    <p class="text-sm text-yellow-400 font-bold">
                        Nenhuma outra turma disponível.
                    </p>
                    <p class="text-xs text-secondary mt-1">
                        Verifique se existem turmas em outros turnos para este
                        mesmo curso e semestre.
                    </p>
                </div>
            </div>

            <!-- Footer Keys -->
            <div
                class="flex justify-end gap-2 mt-6 pt-4 border-t border-white/5"
            >
                <button
                    @click="emit('close')"
                    class="px-4 py-2 text-xs font-bold text-secondary hover:text-white transition-colors"
                >
                    Cancelar
                </button>
                <button
                    @click="submitTroca"
                    :disabled="isSubmitting || !selectedTurmaId"
                    class="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                    <span
                        v-if="isSubmitting"
                        class="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"
                    ></span>
                    Confirmar Troca
                </button>
            </div>
        </div>
    </div>
</template>
