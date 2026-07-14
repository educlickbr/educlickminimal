<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

const props = defineProps<{
    isOpen: boolean;
    candidato: any;
    area: string;
    tipoCandidatura: string;
}>();

const emit = defineEmits(["close", "update-candidate"]);

const appStore = useAppStore();
const { showToast } = useToast();

const isLoading = ref(false);
const formData = ref<any[]>([]);
const answers = ref<Record<string, any>>({});
const isSaving = ref<Record<string, boolean>>({});

const ID_DEFERIMENTO_REGULARES = "518e1943-1a84-4017-b283-67b3914e46e2";
const RESPOSTA_DEFERIDA = "Inscrição Deferida";

const avaliacaoQuestions = computed(() => {
    const q = formData.value || [];
    return {
        opcoes: q
            .filter((x: any) => x.tipo === "opcao")
            .sort((a: any, b: any) => a.ordem - b.ordem),
        numeros: q
            .filter((x: any) => x.tipo === "numero")
            .sort((a: any, b: any) => a.ordem - b.ordem),
    };
});

const totalScore = computed(() => {
    let sum = 0;
    avaliacaoQuestions.value.numeros.forEach((q) => {
        const val = parseFloat(answers.value[q.id_pergunta]);
        if (!isNaN(val)) sum += val;
    });
    return sum;
});

const getStatusColor = (status: string | null) => {
    if (!status) return "text-gray-400";
    const s = status.toLowerCase();
    if (s === "aprovado") return "text-emerald-500";
    if (s === "recusado") return "text-red-500";
    if (s === "ausente") return "text-amber-500";
    if (s === "suplente") return "text-purple-500";
    return "text-white";
};

const getStatusLabel = (status: string | null) => {
    return status || "Pendente";
};

const fetchData = async () => {
    if (!props.candidato?.id_user_expandido && !props.candidato?.id_processo)
        return;

    isLoading.value = true;
    try {
        const res: any = await ofetch("/api/common/respostas-avaliacao", {
            params: {
                area: props.area,
                tipo_candidatura: props.tipoCandidatura,
                id_turma: props.candidato.id_turma,
                id_user_expandido: props.candidato.id_user_expandido,
                id_processo: props.candidato.id_processo,
            },
        });
        formData.value = res.data || [];

        const initialAnswers: Record<string, any> = {};
        formData.value.forEach((q: any) => {
            if (q.resposta !== undefined && q.resposta !== null) {
                initialAnswers[q.id_pergunta] = q.resposta;
            }
        });
        answers.value = initialAnswers;
    } catch (e: any) {
        showToast("Erro ao carregar dados de avaliação", { type: "error" });
    } finally {
        isLoading.value = false;
    }
};

const handleSave = async (question: any) => {
    isSaving.value[question.id_pergunta] = true;
    try {
        const currentAnswer = answers.value[question.id_pergunta];
        const previousAnswer = question.resposta ?? null;

        const response: any = await ofetch("/api/selecao/avaliacao/resposta", {
            method: "POST",
            body: {
                p_id_user: props.candidato.id_user_expandido,
                p_id_pergunta: question.id_pergunta,
                p_id_processo: props.candidato.id_processo,
                p_resposta_texto: String(currentAnswer),
            },
        });

        question.resposta = currentAnswer;
        showToast("Salvo com sucesso!", { type: "info" });

        const data = response.data;
        if (
            data &&
            data.nota_total_processo !== undefined &&
            data.nota_total_processo !== null
        ) {
            emit("update-candidate", {
                id_processo: props.candidato.id_processo,
                nota_total_processo: data.nota_total_processo,
            });
        }

        // Deferimento update
        const DEFERIMENTO_IDS = [
            "518e1943-1a84-4017-b283-67b3914e46e2",
            "cdf7ad73-69bd-4823-978b-ea5367cd1d0b",
        ];
        if (DEFERIMENTO_IDS.includes(question.id_pergunta)) {
            emit("update-candidate", {
                id_processo: props.candidato.id_processo,
                deferimento: currentAnswer,
            });
        }

        // Email automático de deferimento
        if (
            question.id_pergunta === ID_DEFERIMENTO_REGULARES &&
            currentAnswer === RESPOSTA_DEFERIDA &&
            previousAnswer !== currentAnswer
        ) {
            try {
                const emailResponse: any = await ofetch(
                    "/api/selecao/avaliacao/email-deferimento",
                    {
                        method: "POST",
                        body: {
                            id_user_expandido:
                                props.candidato.id_user_expandido,
                            id_processo: props.candidato.id_processo,
                            deferimento: currentAnswer,
                            email_aluno: props.candidato?.email || null,
                            nome_aluno: props.candidato?.nome_completo || null,
                            nome_curso:
                                props.candidato?.nome_curso_turno ||
                                props.candidato?.curso ||
                                "Regulares",
                        },
                    },
                );
                if (
                    emailResponse?.success &&
                    emailResponse?.email_enviado_para
                ) {
                    showToast(
                        `Email automático enviado para ${emailResponse.email_enviado_para}.`,
                        { type: "success" },
                    );
                }
            } catch (emailError: any) {
                console.error("Erro ao disparar email automático:", emailError);
                showToast(
                    emailError?.data?.statusMessage ||
                        emailError?.message ||
                        "Não foi possível enviar o email automático.",
                    { type: "error" },
                );
            }
        }
    } catch (e: any) {
        console.error(e);
        showToast(e.data?.message || e.message || "Erro ao salvar.", {
            type: "error",
        });
    } finally {
        isSaving.value[question.id_pergunta] = false;
    }
};

const updateStatus = async (status: string | null) => {
    isLoading.value = true;
    try {
        const response: any = await ofetch("/api/selecao/status-processo", {
            method: "POST",
            body: { id_processo: props.candidato.id_processo, status },
        });

        showToast(response.message, { type: "info" });
        emit("update-candidate", {
            id_processo: props.candidato.id_processo,
            status,
        });
        emit("close");
    } catch (e: any) {
        console.error(e);
        showToast(e.statusMessage || "Erro ao atualizar status", {
            type: "error",
        });
    } finally {
        isLoading.value = false;
    }
};

watch(
    () => props.isOpen,
    async (val) => {
        if (val) {
            await appStore.refreshHash();
            fetchData();
        } else {
            formData.value = [];
            answers.value = {};
        }
    },
    { immediate: true },
);
</script>

<template>
    <div
        v-if="isOpen"
        class="relative z-50"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            @click="emit('close')"
        ></div>

        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div
                class="flex min-h-full items-center justify-center p-0 text-center sm:p-0"
            >
                <div
                    class="relative transform overflow-hidden rounded-none md:rounded-xl bg-[#16161E] border-x-0 border-y-0 md:border md:border-white/10 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl p-4 md:p-6"
                    @click.stop
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between mb-4 md:mb-6 border-b border-white/10 pb-4"
                    >
                        <h3 class="text-lg md:text-xl font-bold text-white">
                            Avaliar Candidato
                            <span
                                class="block text-xs md:text-sm text-secondary-500 font-normal mt-1"
                                >{{ candidato?.nome_completo }}</span
                            >
                        </h3>
                        <button
                            @click="emit('close')"
                            class="text-secondary-400 hover:text-white transition-colors"
                        >
                            <svg
                                class="w-6 h-6"
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

                    <!-- Loading -->
                    <div v-if="isLoading" class="flex justify-center py-20">
                        <div
                            class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                        ></div>
                    </div>

                    <div
                        v-else
                        class="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar"
                    >
                        <!-- Opções (select) -->
                        <div
                            v-for="question in avaliacaoQuestions.opcoes"
                            :key="question.id_pergunta"
                            class="bg-white/5 rounded-xl p-4 border border-white/5"
                        >
                            <label
                                class="text-xs font-bold text-secondary-400 mb-2 block"
                                >{{ question.pergunta }}</label
                            >
                            <div class="flex gap-2">
                                <select
                                    v-model="answers[question.id_pergunta]"
                                    class="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none"
                                >
                                    <option
                                        v-for="opt in question.opcoes"
                                        :key="opt"
                                        :value="opt"
                                        class="bg-[#16161E] text-white"
                                    >
                                        {{ opt }}
                                    </option>
                                </select>
                                <button
                                    @click="handleSave(question)"
                                    :disabled="isSaving[question.id_pergunta]"
                                    class="p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all flex-shrink-0 disabled:opacity-50"
                                >
                                    <svg
                                        v-if="isSaving[question.id_pergunta]"
                                        class="w-7 h-7 animate-spin"
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
                                    <svg
                                        v-else
                                        class="w-7 h-7"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.5"
                                    >
                                        <path
                                            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                                        ></path>
                                        <polyline
                                            points="17 21 17 13 7 13 7 21"
                                        ></polyline>
                                        <polyline
                                            points="7 3 7 8 15 8"
                                        ></polyline>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Números (input) -->
                        <div
                            v-if="avaliacaoQuestions.numeros.length > 0"
                            class="space-y-4 pt-4 border-t border-white/5"
                        >
                            <div
                                v-for="question in avaliacaoQuestions.numeros"
                                :key="question.id_pergunta"
                                class="flex items-center justify-between gap-4 bg-white/5 rounded-xl p-4 border border-white/5"
                            >
                                <label
                                    class="text-xs font-bold text-secondary-400 flex-grow"
                                    >{{ question.pergunta }}</label
                                >
                                <div class="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        v-model="answers[question.id_pergunta]"
                                        class="w-20 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                    />
                                    <button
                                        @click="handleSave(question)"
                                        :disabled="
                                            isSaving[question.id_pergunta]
                                        "
                                        class="p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all flex-shrink-0 disabled:opacity-50"
                                    >
                                        <svg
                                            v-if="
                                                isSaving[question.id_pergunta]
                                            "
                                            class="w-7 h-7 animate-spin"
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
                                        <svg
                                            v-else
                                            class="w-7 h-7"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="1.5"
                                        >
                                            <path
                                                d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                                            ></path>
                                            <polyline
                                                points="17 21 17 13 7 13 7 21"
                                            ></polyline>
                                            <polyline
                                                points="7 3 7 8 15 8"
                                            ></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Total Score -->
                            <div class="flex justify-end pt-2">
                                <div
                                    class="bg-white/10 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3"
                                >
                                    <span
                                        class="text-xs font-bold text-secondary-400 uppercase tracking-widest"
                                        >Total</span
                                    >
                                    <span
                                        class="text-xl font-black text-white"
                                        >{{ totalScore.toFixed(0) }}</span
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div
                            class="mt-8 bg-[#1E1E2D] rounded-xl p-6 border border-white/5 text-center"
                        >
                            <h4 class="text-lg font-bold text-white mb-2">
                                Aprovar o Candidato
                            </h4>
                            <p class="text-sm text-secondary-400 mb-6">
                                Status Atual:
                                <span
                                    class="font-bold"
                                    :class="
                                        getStatusColor(
                                            candidato?.status_processo,
                                        )
                                    "
                                >
                                    {{
                                        getStatusLabel(
                                            candidato?.status_processo,
                                        )
                                    }}
                                </span>
                            </p>
                            <div class="flex flex-wrap justify-center gap-2">
                                <button
                                    @click="updateStatus('Aprovado')"
                                    class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors text-sm"
                                >
                                    Aprovar
                                </button>
                                <button
                                    @click="updateStatus('Ausente')"
                                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors text-sm"
                                >
                                    Ausente
                                </button>
                                <button
                                    @click="updateStatus('Suplente')"
                                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors text-sm"
                                >
                                    Suplente
                                </button>
                                <button
                                    @click="updateStatus('Recusado')"
                                    class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm"
                                >
                                    Recusar
                                </button>
                                <button
                                    @click="updateStatus(null)"
                                    class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors text-sm"
                                >
                                    Resetar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}
</style>
