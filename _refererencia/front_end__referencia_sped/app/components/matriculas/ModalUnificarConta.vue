<script setup lang="ts">
import { ref, watch } from "vue";
import { useMatriculasModalUnificarConta } from "~/composables/matriculas/useMatriculasModalUnificarConta";
import { useToast } from "../../../composables/useToast";

const props = defineProps<{
    isOpen: boolean;
    student: any;
}>();

const emit = defineEmits(["close", "unified"]);

const { showToast } = useToast();
const { fetchRegistrosCount, checkEmail, unificarConta } =
    useMatriculasModalUnificarConta();

const isLoading = ref(false);
const isVerifying = ref(false);
const counts = ref<any>(null);
const newAccountCounts = ref<any>(null);

// Form
const newEmail = ref("");
const emailCheckResult = ref<"idle" | "exists" | "not-found" | "has-records">(
    "idle",
);

const fetchCounts = async () => {
    if (!props.student?.aluno_id) return;

    isLoading.value = true;
    try {
        const data = await fetchRegistrosCount({
            id_aluno: props.student.aluno_id,
        });
        counts.value = data;
    } catch (e) {
        console.error("Erro ao buscar contagens:", e);
        showToast("Erro ao carregar dados do aluno.", { type: "error" });
    } finally {
        isLoading.value = false;
    }
};

const verifyEmail = async () => {
    if (!newEmail.value || !newEmail.value.includes("@")) {
        showToast("Por favor, informe um email válido.", { type: "error" });
        return;
    }

    if (newEmail.value === props.student?.email) {
        showToast("O novo email não pode ser igual ao atual.", {
            type: "error",
        });
        emailCheckResult.value = "idle";
        return;
    }

    isVerifying.value = true;
    newAccountCounts.value = null;
    try {
        const data: any = await checkEmail(newEmail.value);

        // Se encontrou dados e tem uuid (significa que tem user expandido)
        if (data && data.user_expandido_id) {
            // Agora, vamos verificar se essa nova conta já possui algum dado
            try {
                const targetData: any = await fetchRegistrosCount({
                    id_aluno: data.user_expandido_id,
                });

                if (targetData && targetData.total > 0) {
                    newAccountCounts.value = targetData;
                    emailCheckResult.value = "has-records";
                } else {
                    emailCheckResult.value = "exists";
                }
            } catch (errCount) {
                console.error(
                    "Erro ao verificar contador da nova conta:",
                    errCount,
                );
                showToast(
                    "Não foi possível verificar os dados da nova conta.",
                    { type: "error" },
                );
                emailCheckResult.value = "idle";
            }
        } else {
            emailCheckResult.value = "not-found";
        }
    } catch (e) {
        console.error("Erro ao verificar email:", e);
        emailCheckResult.value = "not-found"; // Fallback for 404 from BFF
    } finally {
        isVerifying.value = false;
    }
};

const close = () => {
    newEmail.value = "";
    emailCheckResult.value = "idle";
    counts.value = null;
    newAccountCounts.value = null;
    emit("close");
};

const handleUnification = async () => {
    if (emailCheckResult.value !== "exists") return;

    if (
        !confirm(
            `Tem certeza que deseja migrar todos os dados de ${props.student.nome} para a nova conta (${newEmail.value})? A conta antiga será desativada. Esta ação não pode ser desfeita.`,
        )
    ) {
        return;
    }

    isLoading.value = true;
    try {
        await unificarConta({
            id_antigo: props.student.aluno_id,
            email_novo: newEmail.value,
        });

        showToast("Conta unificada com sucesso! Os dados foram migrados.", {
            type: "success",
        });
        emit("unified");
        close();
    } catch (e: any) {
        console.error("Erro na unificação:", e);
        const errorMsg =
            e.response?._data?.statusMessage ||
            e.message ||
            "Erro ao unificar contas.";
        showToast(errorMsg, { type: "error" });
    } finally {
        isLoading.value = false;
    }
};

watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            newEmail.value = "";
            emailCheckResult.value = "idle";
            fetchCounts();
        }
    },
);
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
        <div
            class="bg-[#16161E] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
        >
            <!-- Header -->
            <div
                class="p-6 border-b border-white/5 flex items-center justify-between shrink-0"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
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
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white">
                            Unificar Conta
                        </h3>
                        <p class="text-sm text-secondary">
                            Migrar histórico do aluno para outro email
                        </p>
                    </div>
                </div>
                <button
                    @click="close"
                    class="text-secondary hover:text-white transition-colors"
                    :disabled="isLoading"
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

            <!-- Content -->
            <div
                class="p-6 overflow-y-auto custom-scrollbar flex-1 relative min-h-[300px]"
            >
                <!-- Loading State -->
                <div
                    v-if="isLoading && !counts"
                    class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#16161E]/80 backdrop-blur-sm"
                >
                    <svg
                        class="animate-spin h-8 w-8 text-primary mb-4"
                        xmlns="http://www.w3.org/2000/svg"
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
                    <p class="text-sm text-secondary font-medium">
                        Carregando dados a migrar...
                    </p>
                </div>

                <div v-if="student" class="space-y-6">
                    <!-- Current User Display -->
                    <div
                        class="bg-white/5 border border-white/5 rounded-lg p-4"
                    >
                        <p
                            class="text-xs text-secondary-500 uppercase font-bold tracking-wider mb-2"
                        >
                            Conta Origem (Será Desativada)
                        </p>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center font-bold text-white"
                            >
                                {{ student.nome?.charAt(0)
                                }}{{ student.sobrenome?.charAt(0) }}
                            </div>
                            <div>
                                <h4 class="font-medium text-white">
                                    {{ student.nome }} {{ student.sobrenome }}
                                </h4>
                                <p class="text-sm text-secondary">
                                    {{ student.email }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Migration Stats Grid -->
                    <div
                        v-if="counts"
                        class="bg-primary/5 border border-primary/20 rounded-lg p-4"
                    >
                        <h4
                            class="text-xs text-primary uppercase font-bold tracking-wider mb-3"
                        >
                            Registros a serem migrados:
                            <span class="text-white">{{
                                counts.total || 0
                            }}</span>
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div
                                class="bg-black/30 rounded p-2 text-center"
                                title="Matrículas e Trocas de Turno"
                            >
                                <span
                                    class="block text-lg font-bold text-white"
                                    >{{ counts.matriculas || 0 }}</span
                                >
                                <span
                                    class="text-[10px] text-secondary uppercase"
                                    >Matrículas</span
                                >
                            </div>
                            <div class="bg-black/30 rounded p-2 text-center">
                                <span
                                    class="block text-lg font-bold text-white"
                                    >{{ counts.ra_alunos || 0 }}</span
                                >
                                <span
                                    class="text-[10px] text-secondary uppercase"
                                    >RA</span
                                >
                            </div>
                            <div
                                class="bg-black/30 rounded p-2 text-center"
                                title="Aulas do Diário"
                            >
                                <span
                                    class="block text-lg font-bold text-white"
                                    >{{ counts.diario || 0 }}</span
                                >
                                <span
                                    class="text-[10px] text-secondary uppercase"
                                    >Aulas (Diário)</span
                                >
                            </div>
                            <div
                                class="bg-black/30 rounded p-2 text-center"
                                title="Processos Seletivos/Matrículas Iniciais"
                            >
                                <span
                                    class="block text-lg font-bold text-white"
                                    >{{ counts.processos || 0 }}</span
                                >
                                <span
                                    class="text-[10px] text-secondary uppercase"
                                    >Processos</span
                                >
                            </div>
                            <div
                                class="bg-black/30 rounded p-2 text-center"
                                title="Notas e Conceitos"
                            >
                                <span
                                    class="block text-lg font-bold text-white"
                                    >{{
                                        (counts.avl_conceitos || 0) +
                                        (counts.avl_resultado_global || 0)
                                    }}</span
                                >
                                <span
                                    class="text-[10px] text-secondary uppercase"
                                    >Avaliações</span
                                >
                            </div>
                            <div
                                class="bg-black/30 rounded p-2 text-center"
                                title="Pedidos Extensão"
                            >
                                <span
                                    class="block text-lg font-bold text-white"
                                    >{{
                                        (counts.bolsa_submissoes || 0) +
                                        (counts.produto_reservas || 0)
                                    }}</span
                                >
                                <span
                                    class="text-[10px] text-secondary uppercase"
                                    >Pedidos/Bolsas</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Input Target -->
                    <div>
                        <label class="block text-sm font-medium text-white mb-2"
                            >Email da Nova Conta (Destino)</label
                        >
                        <div class="flex gap-2 relative">
                            <input
                                v-model="newEmail"
                                type="email"
                                placeholder="exemplo@email.com"
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                                :disabled="emailCheckResult === 'exists'"
                                @keyup.enter="verifyEmail"
                            />
                            <button
                                v-if="emailCheckResult !== 'exists'"
                                @click="verifyEmail"
                                class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium border border-white/10 transition-colors"
                                :disabled="isVerifying || !newEmail"
                            >
                                <span v-if="isVerifying">Verificando...</span>
                                <span v-else>Verificar</span>
                            </button>

                            <button
                                v-if="emailCheckResult === 'exists'"
                                @click="
                                    () => {
                                        emailCheckResult = 'idle';
                                        newEmail = '';
                                    }
                                "
                                class="px-4 py-2 bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 rounded-lg font-medium border border-zinc-500/20 transition-colors"
                            >
                                Alterar
                            </button>
                        </div>

                        <!-- Status Messages -->
                        <div
                            v-if="emailCheckResult === 'not-found'"
                            class="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3 items-start"
                        >
                            <svg
                                class="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"
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
                            <div>
                                <p
                                    class="text-sm text-yellow-500 font-bold mb-1"
                                >
                                    Email não encontrado no sistema
                                </p>
                                <p
                                    class="text-xs text-yellow-500/80 leading-relaxed"
                                >
                                    Não encontramos nenhum usuário com este
                                    e-mail. Por favor,
                                    <b
                                        >instrua o aluno a criar uma nova
                                        conta</b
                                    >
                                    normalmente como candidato. Após a criação,
                                    retorne aqui e digite o e-mail novamente.
                                </p>
                            </div>
                        </div>

                        <div
                            v-else-if="emailCheckResult === 'has-records'"
                            class="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 items-start"
                        >
                            <svg
                                class="w-5 h-5 text-red-500 shrink-0 mt-0.5"
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
                            <div>
                                <p class="text-sm text-red-500 font-bold mb-1">
                                    Ação Nega: Conta de destino já possui dados
                                </p>
                                <p
                                    class="text-xs text-red-500/80 leading-relaxed"
                                >
                                    O email de destino informado ({{
                                        newEmail
                                    }}) já possui registros vinculados a ele ({{
                                        newAccountCounts?.total
                                    }}
                                    registros detectados). Para evitar
                                    sobrescrita ou mesclagem indevida de dados
                                    como matrículas e notas, a conta de destino
                                    deve ser uma conta limpa.
                                </p>
                            </div>
                        </div>

                        <div
                            v-else-if="emailCheckResult === 'exists'"
                            class="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
                        >
                            <svg
                                class="w-5 h-5 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                ></path>
                            </svg>
                            <span class="text-sm text-green-500 font-medium"
                                >Conta detectada e validada (sem registros
                                concorrentes). Pronta para unificação.</span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="p-6 border-t border-white/5 flex gap-3 shrink-0">
                <button
                    @click="close"
                    class="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
                >
                    Cancelar
                </button>
                <button
                    @click="handleUnification"
                    :disabled="emailCheckResult !== 'exists' || isLoading"
                    class="flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                    :class="
                        emailCheckResult === 'exists' && !isLoading
                            ? 'bg-primary hover:bg-primary/90'
                            : 'bg-primary/30 cursor-not-allowed'
                    "
                >
                    <svg
                        v-if="isLoading"
                        class="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                    <span>Unificar Conta e Migrar Dados</span>
                </button>
            </div>
        </div>
    </div>
</template>
