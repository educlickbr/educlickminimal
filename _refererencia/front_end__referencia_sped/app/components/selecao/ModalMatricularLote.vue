<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useToast } from "../../../composables/useToast";

interface Candidato {
    id_processo: string;
    id_user_expandido: string;
    nome_completo: string;
    status_processo: string;
    is_matriculado?: boolean;
}

const props = defineProps<{
    isOpen: boolean;
    candidatos: Candidato[]; // Lista total da página atual
    turmaNome: string;
}>();

const emit = defineEmits(["close", "confirm"]);

const { showToast } = useToast();
const isLoading = ref(false);

const aprovados = computed(() =>
    props.candidatos.filter(
        (c) => c.status_processo === "Aprovado" && !c.is_matriculado,
    ),
);
const jaMatriculados = computed(() =>
    props.candidatos.filter(
        (c) => c.status_processo === "Aprovado" && c.is_matriculado,
    ),
);
const naoAprovados = computed(() =>
    props.candidatos.filter((c) => c.status_processo !== "Aprovado"),
);

// Reseta estado ao abrir
watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            isLoading.value = false;
        }
    },
);

const handleConfirm = async () => {
    if (aprovados.value.length === 0) return;
    isLoading.value = true;

    // Passa apenas os IDs dos processos dos aprovados para o componente pai lidar com a chamada
    const idsAprovados = aprovados.value.map((c) => c.id_processo);

    try {
        emit("confirm", idsAprovados);
    } catch (e) {
        // Erros são tratados pelo pai, mas se der pau forte previne travar no loading
        isLoading.value = false;
    }
};
</script>

<template>
    <div
        v-if="isOpen"
        class="relative z-50"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            @click="emit('close')"
        ></div>

        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div
                class="flex min-h-full items-center justify-center p-4 text-center sm:p-0"
            >
                <!-- Modal Panel -->
                <div
                    class="relative transform overflow-hidden rounded-2xl bg-[#16161E] border border-white/10 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl px-6 py-6"
                    @click.stop
                >
                    <!-- Header -->
                    <div
                        class="flex items-center gap-4 border-b border-white/10 pb-4 mb-4"
                    >
                        <div
                            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10"
                        >
                            <svg
                                class="w-6 h-6 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                ></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-white leading-6">
                                Matrícula em Lote
                            </h3>
                            <p class="text-sm text-secondary-500 mt-1">
                                Turma:
                                <span class="font-medium text-white">{{
                                    turmaNome
                                }}</span>
                            </p>
                        </div>
                    </div>

                    <!-- Body -->
                    <div class="space-y-4">
                        <!-- Resumo Geral: 3 colunas -->
                        <div class="grid grid-cols-3 gap-3">
                            <div
                                class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center"
                            >
                                <p class="text-2xl font-bold text-emerald-400">
                                    {{ aprovados.length }}
                                </p>
                                <p
                                    class="text-[10px] text-emerald-500 font-medium uppercase mt-1"
                                >
                                    A Matricular
                                </p>
                            </div>
                            <div
                                class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center"
                            >
                                <p class="text-2xl font-bold text-blue-400">
                                    {{ jaMatriculados.length }}
                                </p>
                                <p
                                    class="text-[10px] text-blue-500 font-medium uppercase mt-1"
                                >
                                    Já Matriculados
                                </p>
                            </div>
                            <div
                                class="bg-white/5 border border-white/10 rounded-lg p-3 text-center"
                            >
                                <p class="text-2xl font-bold text-gray-400">
                                    {{ naoAprovados.length }}
                                </p>
                                <p
                                    class="text-[10px] text-gray-500 font-medium uppercase mt-1"
                                >
                                    Outros Status
                                </p>
                            </div>
                        </div>

                        <!-- Alerta: todos aprovados já estão matriculados -->
                        <div
                            v-if="
                                aprovados.length === 0 &&
                                jaMatriculados.length > 0
                            "
                            class="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-lg flex gap-3 items-start"
                        >
                            <svg
                                class="w-5 h-5 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                            <p class="text-sm">
                                Todos os estudantes
                                <strong>"Aprovados"</strong> desta página já
                                possuem matrícula nesta turma.
                            </p>
                        </div>

                        <!-- Alerta: sem aprovados em absoluto -->
                        <div
                            v-else-if="
                                aprovados.length === 0 &&
                                jaMatriculados.length === 0
                            "
                            class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex gap-3 items-start"
                        >
                            <svg
                                class="w-5 h-5 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                ></path>
                            </svg>
                            <p class="text-sm">
                                Não há estudantes com o status
                                <strong>"Aprovado"</strong> nesta página.
                                Operação não permitida.
                            </p>
                        </div>

                        <!-- Lista de Aprovados pendentes (só quando há algum) -->
                        <div v-if="aprovados.length > 0">
                            <h4 class="text-sm font-bold text-white mb-2">
                                A serem matriculados agora ({{
                                    aprovados.length
                                }}):
                            </h4>
                            <div
                                class="bg-black/20 rounded-lg border border-white/5 max-h-[260px] overflow-y-auto"
                            >
                                <ul class="divide-y divide-white/5">
                                    <li
                                        v-for="cand in aprovados"
                                        :key="cand.id_processo"
                                        class="p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    >
                                        <span class="text-sm text-gray-300">{{
                                            cand.nome_completo
                                        }}</span>
                                        <span
                                            class="text-[10px] uppercase font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            >Aprovado</span
                                        >
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div
                        class="mt-6 flex gap-3 justify-end pt-4 border-t border-white/10"
                    >
                        <button
                            type="button"
                            class="inline-flex justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                            @click="emit('close')"
                            :disabled="isLoading"
                        >
                            Cancelar
                        </button>
                        <button
                            v-if="aprovados.length > 0"
                            type="button"
                            class="inline-flex justify-center items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(253,0,84,0.3)]"
                            @click="handleConfirm"
                            :disabled="isLoading"
                        >
                            <svg
                                v-if="isLoading"
                                class="animate-spin h-4 w-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            {{
                                isLoading
                                    ? "Matriculando..."
                                    : "Confirmar Matrículas"
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Optional scrollbar styling for the list */
div::-webkit-scrollbar {
    width: 6px;
}
div::-webkit-scrollbar-track {
    background: transparent;
}
div::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}
div::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}
</style>
