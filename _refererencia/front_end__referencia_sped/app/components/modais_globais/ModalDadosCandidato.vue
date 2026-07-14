<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import {
    generateUuidFileName,
    fileToBase64,
    validateFile,
} from "../../../utils/file";
import { $fetch as ofetch } from "ofetch";

const appStore = useAppStore();

const props = defineProps<{
    isOpen: boolean;
    candidato: any;
    area: string;
    tipoProcesso: string;
    tipoCandidatura: string;
    mode?: "dados" | "documentos" | "avaliar";
    hideTabs?: boolean;
}>();

const emit = defineEmits(["close", "update-candidate"]);

const { showToast } = useToast();

const isLoading = ref(false);
const formData = ref<any[]>([]);
const activeTab = ref("");
const answers = ref<Record<string, any>>({});
const isSaving = ref<Record<string, boolean>>({});

const ID_DEFERIMENTO_REGULARES = "518e1943-1a84-4017-b283-67b3914e46e2";
const RESPOSTA_DEFERIDA = "Inscrição Deferida";

// File State
const fileNames = ref<Record<string, string>>({});
const files = ref<Record<string, File | null>>({});
const confirmDeletes = ref<Record<string, boolean>>({});

// Computed for Avaliar
const isAvaliarMode = computed(() => props.mode === "avaliar");

const avaliacaoQuestions = computed(() => {
    if (!isAvaliarMode.value) return { opcoes: [], numeros: [] };
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
    if (!isAvaliarMode.value) return 0;
    let sum = 0;
    avaliacaoQuestions.value.numeros.forEach((q) => {
        const val = parseFloat(answers.value[q.id_pergunta]);
        if (!isNaN(val)) sum += val;
    });
    return sum;
});

// Helper to format block names
const BLOCO_LABELS: Record<string, string> = {
    dados_pessoais: "Dados Pessoais",
    responsavel_legal: "Responsável Legal",
    dados_socio_economicos: "Dados Socioeconômicos",
    pcd: "PCD",
    endereco: "Endereço",
    documentos: "Documentos",
    aceite: "Aceite",
    sobre_curso: "Sobre o Curso",
    prontidao: "Prontidão",
    contratacao: "Contratação",
    ficha_medica: "Ficha Médica",
};
const formatBlockName = (name: String) => {
    return BLOCO_LABELS[String(name)] ?? name;
};

const getStatusColor = (status: string | null) => {
    if (!status) return "text-gray-400"; // Pendente
    const s = status.toLowerCase();
    if (s === "aprovado") return "text-emerald-500";
    if (s === "recusado") return "text-red-500"; // Danger
    if (s === "suplente") return "text-purple-500"; // Primary-ish
    return "text-white";
};

const getStatusLabel = (status: string | null) => {
    return status || "Pendente";
};

// Compute blocks and questions
const processedBlocks = computed(() => {
    if (isAvaliarMode.value) return {}; // No blocks for avaliar
    if (!formData.value) return {};

    // Group by block
    const blocks: Record<string, any[]> = {};

    // Safety check
    if (!Array.isArray(formData.value)) return {};

    formData.value.forEach((q: any) => {
        if (!blocks[q.bloco]) {
            blocks[q.bloco] = [];
        }
        blocks[q.bloco]?.push(q);
    });

    // Sort questions within blocks
    Object.keys(blocks).forEach((key) => {
        blocks[key]?.sort((a: any, b: any) => a.ordem - b.ordem);
    });

    return blocks;
});

const activeBlocks = computed(() => {
    if (isAvaliarMode.value) return [];
    if (!formData.value) return [];

    // Filter out blocks that have no visible questions
    let blockKeys = Object.keys(processedBlocks.value).filter((blockKey) => {
        const questionsInBlock = processedBlocks.value[blockKey] || [];
        return questionsInBlock.some((q) => shouldShowQuestion(q));
    });

    // TODO: Remover quando responsável legal for reativado.
    // Esconde o bloco responsavel_legal se não houver nenhuma resposta preenchida.
    blockKeys = blockKeys.filter((blockKey) => {
        if (blockKey !== "responsavel_legal") return true;
        const questionsInBlock = processedBlocks.value[blockKey] || [];
        return questionsInBlock.some(
            (q) =>
                shouldShowQuestion(q) &&
                q.resposta !== null &&
                q.resposta !== undefined,
        );
    });

    // Sort blocks by ordem_bloco from database
    return blockKeys.sort((a, b) => {
        const blocksA = processedBlocks.value[a] || [];
        const blocksB = processedBlocks.value[b] || [];

        const ordemA = blocksA[0]?.ordem_bloco ?? 999;
        const ordemB = blocksB[0]?.ordem_bloco ?? 999;

        return ordemA - ordemB;
    });
});

// Fetch Data
const fetchData = async () => {
    if (!props.candidato?.id_user_expandido && !props.candidato?.id_processo)
        return;

    isLoading.value = true;
    try {
        // Sempre limpa estados de arquivo antes de recarregar dados
        // para evitar vazamento de nomes entre candidatos.
        fileNames.value = {};
        files.value = {};
        confirmDeletes.value = {};
        openingFile.value = {};

        let data: any = [];
        let error: any = null;

        if (props.mode === "documentos") {
            const response: any = await ofetch("/api/common/documentos", {
                params: {
                    area: props.area,
                    tipo_candidatura: props.tipoCandidatura,
                    tipo_processo: props.tipoProcesso,
                    user_id: props.candidato.id_user_expandido,
                    id_turma: props.candidato.id_turma,
                },
            });
            data = response.documentos;
        } else {
            if (props.mode === "avaliar") {
                const res: any = await ofetch(
                    "/api/common/respostas-avaliacao",
                    {
                        params: {
                            area: props.area,
                            tipo_candidatura: props.tipoCandidatura,
                            id_turma: props.candidato.id_turma,
                            id_user_expandido:
                                props.candidato.id_user_expandido,
                            id_processo: props.candidato.id_processo,
                        },
                    },
                );
                data = res.data;
            } else {
                // Use BFF for default 'dados' mode
                const res: any = await ofetch("/api/common/respostas", {
                    params: {
                        area: props.area,
                        tipo_candidatura: props.tipoCandidatura,
                        tipo_processo: props.tipoProcesso,
                        user_id: props.candidato.id_user_expandido,
                    },
                });
                data = res.data;
            }
        }

        if (error) throw error;

        formData.value = data || [];

        // Populate answers
        const initialAnswers: Record<string, any> = {};
        formData.value.forEach((q: any) => {
            if (q.resposta !== undefined && q.resposta !== null) {
                if (q.tipo === "boolean") {
                    initialAnswers[q.id_pergunta] =
                        q.resposta === true || String(q.resposta) === "true";
                } else {
                    initialAnswers[q.id_pergunta] = q.resposta;
                }
            }
        });
        answers.value = initialAnswers;

        // Populate fileNames if mode is documentos
        if (props.mode === "documentos" && formData.value) {
            formData.value.forEach((q: any) => {
                if (q.resposta || q.arquivo_original) {
                    // Use original name if available, otherwise fallback
                    fileNames.value[q.id_pergunta] =
                        q.arquivo_original || "Arquivo Anexado";
                }
            });
        }

        // Set initial tab
        if (activeBlocks.value.length > 0 && !activeTab.value) {
            const firstBlock = activeBlocks.value[0];
            if (firstBlock) activeTab.value = firstBlock;
        }
    } catch (e: any) {
        console.error("Error fetching data:", e);
        showToast("Erro ao carregar dados do candidato", { type: "error" });
    } finally {
        isLoading.value = false;
    }
};

watch(
    () => props.isOpen,
    async (val) => {
        if (val) {
            // Refresh hash when modal opens to ensure links work
            await appStore.refreshHash();
            fetchData();
        } else {
            // Reset state on close
            formData.value = [];
            activeTab.value = "";
            answers.value = {};
            fileNames.value = {};
            files.value = {};
            confirmDeletes.value = {};
            openingFile.value = {};
        }
    },
);

// Logic to check dependencies
const shouldShowQuestion = (question: any) => {
    if (!question.depende) return true;
    if (!question.depende_de || !question.valor_depende) return true;

    const parentAnswer = answers.value[question.depende_de];
    const parentValStr =
        parentAnswer === undefined || parentAnswer === null
            ? ""
            : String(parentAnswer);

    const allowedValues = Array.isArray(question.valor_depende)
        ? question.valor_depende.map((v: any) => String(v))
        : [String(question.valor_depende)];

    return allowedValues.includes(parentValStr);
};

const getNormalizedOptions = (question: any) => {
    const rawOptions = question.opcoes || ["Sim", "Não"];
    return rawOptions.map((opt: any) => {
        if (typeof opt === "string") {
            return { label: opt, value: opt };
        }
        return opt;
    });
};

// getOptions function removed as options are now fetched from DB

// Normalized save function
const handleSave = async (question: any) => {
    isSaving.value[question.id_pergunta] = true;
    try {
        let data: any = null;
        const previousAnswer = question.resposta ?? null;
        const currentAnswer = answers.value[question.id_pergunta];

        if (isAvaliarMode.value) {
            // Evaluation Mode: Use BFF endpoint
            const response: any = await ofetch(
                "/api/selecao/avaliacao/resposta",
                {
                    method: "POST",
                    body: {
                        p_id_user: props.candidato.id_user_expandido,
                        p_id_pergunta: question.id_pergunta,
                        p_id_processo: props.candidato.id_processo,
                        p_resposta_texto: String(currentAnswer),
                    },
                },
            );
            data = response.data;
        } else {
            // Data Mode: Use New BFF Endpoint
            const response: any = await ofetch("/api/common/respostas/save", {
                method: "POST",
                body: {
                    p_id_pergunta: question.id_pergunta,
                    p_resposta: currentAnswer,
                    p_user_expandido_id: props.candidato.id_user_expandido,
                    p_id_turma: null,
                },
            });
            data = response.data;
        }

        question.resposta = currentAnswer;

        showToast("Salvo com sucesso!", { type: "info" });

        // Emit update if we got a new total score back (Avaliação logic)
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

        // Check for Deferimento Question IDs and emit update
        const DEFERIMENTO_IDS = [
            "518e1943-1a84-4017-b283-67b3914e46e2", // Regulares
            "cdf7ad73-69bd-4823-978b-ea5367cd1d0b", // Cursos Livres
        ];

        if (DEFERIMENTO_IDS.includes(question.id_pergunta)) {
            emit("update-candidate", {
                id_processo: props.candidato.id_processo,
                deferimento: currentAnswer,
            });
            // Also update local prop for immediate reactivity inside modal if used
            if (props.candidato) {
                props.candidato.deferimento = currentAnswer;
            }
        }

        const shouldSendDeferimentoEmail =
            isAvaliarMode.value &&
            question.id_pergunta === ID_DEFERIMENTO_REGULARES &&
            currentAnswer === RESPOSTA_DEFERIDA &&
            previousAnswer !== currentAnswer;

        if (shouldSendDeferimentoEmail) {
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
                console.error(
                    "Erro ao disparar email automático de deferimento:",
                    emailError,
                );
                const emailErrorMsg =
                    emailError?.data?.statusMessage ||
                    emailError?.message ||
                    "Não foi possível enviar o email automático.";
                showToast(emailErrorMsg, { type: "error" });
            }
        }
    } catch (e: any) {
        console.error(e);
        const msg = e.data?.message || e.message || "Erro ao salvar.";
        showToast(msg, { type: "error" });
    } finally {
        isSaving.value[question.id_pergunta] = false;
    }
};

const updateStatus = async (status: string | null) => {
    // No confirmation needed as per user request
    isLoading.value = true;
    try {
        const response: any = await ofetch("/api/selecao/status-processo", {
            method: "POST",
            body: {
                id_processo: props.candidato.id_processo,
                status: status,
            },
        });

        showToast(response.message, { type: "info" });

        // Update local status
        if (props.candidato) {
            props.candidato.status_processo = status;
        }

        emit("update-candidate", {
            id_processo: props.candidato.id_processo,
            status: status,
        }); // Ensure parent knows
        emit("close"); // Close modal on success
    } catch (e: any) {
        console.error(e);
        showToast(e.statusMessage || "Erro ao atualizar status", {
            type: "error",
        });
    } finally {
        isLoading.value = false;
    }
};

// File Handlers
const getFileTypes = (question: any): string[] => {
    // If it's the photo field, allow images
    if (question.pergunta === "sua_foto") {
        return ["image/jpeg", "image/png", "image/jpg"];
    }
    // Otherwise, default to PDF only
    return ["application/pdf"];
};

const triggerFileUpload = (questionId: string) => {
    const el = document.getElementById(`file-${questionId}`);
    if (el) el.click();
};

const handleFileChange = async (event: Event, question: any) => {
    const target = event.target as HTMLInputElement;
    // Explicit check for files existence and length
    if (target.files && target.files.length > 0) {
        const file = target.files[0];

        // Ensure file is not undefined (TS check)
        if (!file) return;

        // 1. Validate with specific allowed types
        const allowedTypes = getFileTypes(question);
        const { valid, error } = validateFile(file, allowedTypes);

        if (!valid) {
            showToast(error || "Arquivo inválido", { type: "error" });
            target.value = "";
            return;
        }

        // 2. Prepare Upload
        question.uploading = true;
        fileNames.value[question.id_pergunta] = file.name; // Optimistic update

        try {
            const uuidName = generateUuidFileName(file.name);
            const base64 = await fileToBase64(file);

            // 3. Upload via BFF (Admin Endpoint)
            await ofetch("/api/common/upload", {
                method: "POST",
                body: {
                    id_turma: props.candidato.id_turma,
                    id_pergunta: question.id_pergunta,
                    fileName: uuidName,
                    originalName: file.name,
                    fileBase64: base64,
                    targetUserId: props.candidato.id_user_expandido,
                },
            });

            // 4. Update State on Success
            files.value[question.id_pergunta] = file;
            answers.value[question.id_pergunta] = uuidName;
            showToast("Arquivo enviado com sucesso!", { type: "info" });

            // Emit update to parent
            if (question.pergunta === "sua_foto") {
                emit("update-candidate", { imagem_user: uuidName });
                // Also update local prop if available
                if (props.candidato) props.candidato.imagem_user = uuidName;
            }
            emit("update-candidate", { [question.pergunta]: uuidName });
        } catch (err) {
            console.error("Upload Error:", err);
            showToast("Falha no upload. Tente novamente.", { type: "error" });
            // Revert state
            fileNames.value[question.id_pergunta] = "";
            files.value[question.id_pergunta] = null;
            answers.value[question.id_pergunta] = null;
            target.value = "";
        } finally {
            question.uploading = false;
        }
    }
};

// Flag de loading por arquivo (para o botão de abrir)
const openingFile = ref<Record<string, boolean>>({});

/**
 * Renova a hash do Bunny AGORA, no clique, e abre o arquivo numa nova aba.
 * Evita o erro 403 quando o usuário fica mais de 5 minutos com o modal aberto.
 */
const openFile = async (question: any) => {
    const fileName = answers.value[question.id_pergunta];
    if (!fileName) return;

    openingFile.value[question.id_pergunta] = true;
    try {
        // Busca uma hash fresh neste exato momento
        const freshHash = await appStore.refreshHash();
        const base = freshHash || appStore.hash_base;
        if (base) {
            window.open(`${base}/${fileName}`, "_blank");
        }
    } finally {
        openingFile.value[question.id_pergunta] = false;
    }
};

const showConfirmDelete = (question: any) => {
    confirmDeletes.value[question.id_pergunta] = true;
};

const performDeleteFile = async (question: any) => {
    console.log("performDeleteFile", question);
    question.deleting = true;
    try {
        // 1. Delete via BFF
        await ofetch("/api/selecao/delete-file", {
            method: "POST",
            body: {
                id_turma: props.candidato.id_turma,
                id_pergunta: question.id_pergunta,
                fileName: answers.value[question.id_pergunta], // UUID stored in answer
                targetUserId: props.candidato.id_user_expandido,
            },
        });

        // 2. Clear Local State
        files.value[question.id_pergunta] = null;
        fileNames.value[question.id_pergunta] = "";
        answers.value[question.id_pergunta] = null;

        // Reset input
        const el = document.getElementById(
            `file-${question.id_pergunta}`,
        ) as HTMLInputElement;
        if (el) el.value = "";

        // Hide the confirmation UI
        confirmDeletes.value[question.id_pergunta] = false;
        showToast("Arquivo removido!", { type: "info" });
    } catch (err) {
        console.error("Delete Error:", err);
        showToast("Erro ao excluir arquivo.", { type: "error" });
    } finally {
        question.deleting = false;
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
            @click="$emit('close')"
        ></div>

        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div
                class="flex min-h-full items-center justify-center p-0 text-center sm:p-0"
            >
                <!-- Modal Panel -->
                <div
                    class="relative transform overflow-hidden rounded-none md:rounded-xl bg-[#16161E] border-x-0 border-y-0 md:border md:border-white/10 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl p-4 md:p-6"
                    @click.stop
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between mb-4 md:mb-6 border-b border-white/10 pb-4"
                    >
                        <h3 class="text-lg md:text-xl font-bold text-white">
                            Dados do Candidato
                            <span
                                class="block text-xs md:text-sm text-secondary-500 font-normal mt-1"
                                >{{ candidato?.nome_completo }}</span
                            >
                        </h3>
                        <button
                            @click="$emit('close')"
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

                    <div v-else>
                        <!-- Tabs with Scrollable Blocks -->
                        <div v-if="!hideTabs" class="mb-4 md:mb-6">
                            <div
                                class="flex items-center gap-2 overflow-x-auto pb-4 border-b border-white/5 tabs-scroll-container"
                            >
                                <button
                                    v-for="blockKey in activeBlocks"
                                    :key="blockKey"
                                    @click="activeTab = blockKey"
                                    class="whitespace-nowrap px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 border"
                                    :class="
                                        activeTab === blockKey
                                            ? 'bg-primary/25 text-primary border-primary/60 shadow-lg shadow-primary/20'
                                            : 'bg-white/5 text-secondary-400 border-white/5 hover:bg-white/10 hover:border-primary/30'
                                    "
                                >
                                    {{ formatBlockName(blockKey) }}
                                </button>
                            </div>
                        </div>

                        <!-- Content -->
                        <!-- Content -->
                        <div
                            v-if="!isAvaliarMode && processedBlocks[activeTab]"
                            class="space-y-4 md:space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar"
                        >
                            <div
                                class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                            >
                                <template
                                    v-for="question in processedBlocks[
                                        activeTab
                                    ]"
                                    :key="question.id_pergunta"
                                >
                                    <div
                                        v-if="shouldShowQuestion(question)"
                                        :class="[
                                            'flex flex-col gap-2',
                                            question.largura === 2
                                                ? 'md:col-span-2'
                                                : 'md:col-span-1',
                                        ]"
                                    >
                                        <label
                                            class="text-xs font-bold text-secondary-400"
                                        >
                                            {{ question.label }}
                                            <span
                                                v-if="question.obrigatorio"
                                                class="text-primary"
                                                >*</span
                                            >
                                        </label>

                                        <div
                                            class="flex gap-2"
                                            :class="
                                                (question.tipo === 'texto' &&
                                                    (!question.altura ||
                                                        question.altura <
                                                            80)) ||
                                                ![
                                                    'texto',
                                                    'radio',
                                                    'arquivo',
                                                ].includes(question.tipo)
                                                    ? 'items-center'
                                                    : 'items-start'
                                            "
                                        >
                                            <!-- Field Wrapper -->
                                            <div class="flex-grow">
                                                <!-- Texto / Textarea -->
                                                <div
                                                    v-if="
                                                        question.tipo ===
                                                        'texto'
                                                    "
                                                    class="relative"
                                                >
                                                    <textarea
                                                        v-if="
                                                            question.altura &&
                                                            question.altura >=
                                                                80
                                                        "
                                                        v-model="
                                                            answers[
                                                                question
                                                                    .id_pergunta
                                                            ]
                                                        "
                                                        :style="{
                                                            height:
                                                                question.altura +
                                                                'px',
                                                        }"
                                                        class="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                                                    ></textarea>
                                                    <input
                                                        v-else
                                                        type="text"
                                                        v-model="
                                                            answers[
                                                                question
                                                                    .id_pergunta
                                                            ]
                                                        "
                                                        class="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                    />
                                                </div>

                                                <!-- Radio -->
                                                <div
                                                    v-else-if="
                                                        question.tipo ===
                                                        'radio'
                                                    "
                                                    class="flex flex-col gap-2"
                                                >
                                                    <label
                                                        v-for="(
                                                            option, idx
                                                        ) in getNormalizedOptions(
                                                            question,
                                                        )"
                                                        :key="idx"
                                                        class="flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <input
                                                            type="radio"
                                                            :name="
                                                                question.id_pergunta
                                                            "
                                                            :value="
                                                                option.label
                                                            "
                                                            v-model="
                                                                answers[
                                                                    question
                                                                        .id_pergunta
                                                                ]
                                                            "
                                                            class="w-4 h-4 text-primary bg-transparent border-white/30 focus:ring-primary"
                                                        />
                                                        <span
                                                            class="text-sm text-white"
                                                            >{{
                                                                option.label
                                                            }}</span
                                                        >
                                                    </label>
                                                </div>

                                                <!-- File Upload (Premium Style) -->
                                                <div
                                                    v-else-if="
                                                        question.tipo ===
                                                        'arquivo'
                                                    "
                                                >
                                                    <div
                                                        class="relative border-2 border-dashed border-white/10 rounded-xl p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer"
                                                        @click="
                                                            triggerFileUpload(
                                                                question.id_pergunta,
                                                            )
                                                        "
                                                    >
                                                        <input
                                                            :id="
                                                                'file-' +
                                                                question.id_pergunta
                                                            "
                                                            type="file"
                                                            class="hidden"
                                                            :accept="
                                                                getFileTypes(
                                                                    question,
                                                                ).join(',')
                                                            "
                                                            @change="
                                                                handleFileChange(
                                                                    $event,
                                                                    question,
                                                                )
                                                            "
                                                        />

                                                        <div
                                                            v-if="
                                                                question.uploading
                                                            "
                                                            class="flex flex-col items-center justify-center py-4"
                                                        >
                                                            <div
                                                                class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-2"
                                                            ></div>
                                                            <span
                                                                class="text-xs text-primary font-bold"
                                                                >Enviando...</span
                                                            >
                                                        </div>

                                                        <div
                                                            v-else-if="
                                                                !fileNames[
                                                                    question
                                                                        .id_pergunta
                                                                ]
                                                            "
                                                            class="flex flex-col items-center gap-2"
                                                        >
                                                            <div
                                                                class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform"
                                                            >
                                                                <svg
                                                                    class="w-6 h-6 text-primary"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    stroke-width="2"
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                >
                                                                    <path
                                                                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                                    ></path>
                                                                    <polyline
                                                                        points="17 8 12 3 7 8"
                                                                    ></polyline>
                                                                    <line
                                                                        x1="12"
                                                                        y1="3"
                                                                        x2="12"
                                                                        y2="15"
                                                                    ></line>
                                                                </svg>
                                                            </div>
                                                            <p
                                                                class="text-xs font-bold text-secondary-400 tracking-tight"
                                                            >
                                                                Clique ou
                                                                arraste para
                                                                enviar arquivo
                                                            </p>
                                                            <p
                                                                class="text-[10px] text-secondary-500/40"
                                                            >
                                                                {{
                                                                    question.pergunta ===
                                                                    "sua_foto"
                                                                        ? "JPG, PNG (Max 4MB)"
                                                                        : "PDF (Max 4MB)"
                                                                }}
                                                            </p>
                                                        </div>

                                                        <div
                                                            v-else
                                                            class="flex flex-col items-center gap-2 py-2 w-full"
                                                        >
                                                            <div
                                                                v-if="
                                                                    !confirmDeletes[
                                                                        question
                                                                            .id_pergunta
                                                                    ]
                                                                "
                                                                class="w-full flex flex-col items-center gap-2"
                                                            >
                                                                <div
                                                                    class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1"
                                                                >
                                                                    <svg
                                                                        class="w-6 h-6 text-green-500"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        stroke-width="2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    >
                                                                        <path
                                                                            d="M20 6L9 17l-5-5"
                                                                        ></path>
                                                                    </svg>
                                                                </div>
                                                                <p
                                                                    class="text-xs font-bold text-white truncate max-w-full px-4"
                                                                >
                                                                    {{
                                                                        fileNames[
                                                                            question
                                                                                .id_pergunta
                                                                        ]
                                                                    }}
                                                                </p>

                                                                <div
                                                                    class="flex gap-4"
                                                                >
                                                                    <button
                                                                        v-if="
                                                                            answers[
                                                                                question
                                                                                    .id_pergunta
                                                                            ]
                                                                        "
                                                                        type="button"
                                                                        :disabled="
                                                                            openingFile[
                                                                                question
                                                                                    .id_pergunta
                                                                            ]
                                                                        "
                                                                        class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1 bg-primary/10 px-2 py-1 rounded disabled:opacity-60 disabled:cursor-wait"
                                                                        @click.stop="
                                                                            openFile(
                                                                                question,
                                                                            )
                                                                        "
                                                                    >
                                                                        <svg
                                                                            v-if="
                                                                                openingFile[
                                                                                    question
                                                                                        .id_pergunta
                                                                                ]
                                                                            "
                                                                            class="w-3 h-3 animate-spin"
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
                                                                            class="w-3 h-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                stroke-width="2"
                                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                            ></path>
                                                                        </svg>
                                                                        {{
                                                                            openingFile[
                                                                                question
                                                                                    .id_pergunta
                                                                            ]
                                                                                ? "Abrindo..."
                                                                                : "Abrir Arquivo"
                                                                        }}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        class="text-[10px] font-black uppercase tracking-widest text-red-400 hover:underline mt-1"
                                                                        @click.stop="
                                                                            showConfirmDelete(
                                                                                question,
                                                                            )
                                                                        "
                                                                        :disabled="
                                                                            question.deleting
                                                                        "
                                                                    >
                                                                        {{
                                                                            question.deleting
                                                                                ? "Removendo..."
                                                                                : "Remover"
                                                                        }}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div
                                                                v-else
                                                                class="w-full bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3"
                                                            >
                                                                <p
                                                                    class="text-sm font-bold text-white"
                                                                >
                                                                    Tem certeza
                                                                    que deseja
                                                                    remover?
                                                                </p>
                                                                <div
                                                                    class="flex gap-3"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        class="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 font-bold py-1 px-3 rounded-lg text-xs"
                                                                        @click.stop="
                                                                            performDeleteFile(
                                                                                question,
                                                                            )
                                                                        "
                                                                    >
                                                                        Sim,
                                                                        remover
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        class="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-1 px-3 rounded-lg text-xs"
                                                                        @click.stop="
                                                                            confirmDeletes[
                                                                                question.id_pergunta
                                                                            ] =
                                                                                false
                                                                        "
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Fallback Text -->
                                                <input
                                                    v-else
                                                    type="text"
                                                    v-model="
                                                        answers[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                    class="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                                />
                                            </div>

                                            <!-- Save Button (Only for Non-Files) -->
                                            <button
                                                v-if="
                                                    question.tipo !== 'arquivo'
                                                "
                                                @click="handleSave(question)"
                                                :disabled="
                                                    isSaving[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all flex-shrink-0 disabled:opacity-50"
                                                title="Salvar alteração"
                                            >
                                                <svg
                                                    v-if="
                                                        isSaving[
                                                            question.id_pergunta
                                                        ]
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
                                </template>
                            </div>
                        </div>

                        <!-- AVALIACAO Content -->
                        <div
                            v-else-if="isAvaliarMode"
                            class="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar"
                        >
                            <div class="flex flex-col gap-6">
                                <!-- Opcoes -->
                                <div
                                    v-for="question in avaliacaoQuestions.opcoes"
                                    :key="question.id_pergunta"
                                    class="bg-white/5 rounded-xl p-4 border border-white/5"
                                >
                                    <label
                                        class="text-xs font-bold text-secondary-400 mb-2 block"
                                    >
                                        {{ question.pergunta }}
                                    </label>

                                    <div class="flex gap-2">
                                        <select
                                            v-model="
                                                answers[question.id_pergunta]
                                            "
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

                                        <!-- Save Button -->
                                        <button
                                            @click="handleSave(question)"
                                            :disabled="
                                                isSaving[question.id_pergunta]
                                            "
                                            class="p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all flex-shrink-0 disabled:opacity-50"
                                        >
                                            <svg
                                                v-if="
                                                    isSaving[
                                                        question.id_pergunta
                                                    ]
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

                                <!-- Numeros -->
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
                                        >
                                            {{ question.pergunta }}
                                        </label>

                                        <div class="flex gap-2 items-center">
                                            <input
                                                type="number"
                                                v-model="
                                                    answers[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="w-20 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                            />

                                            <!-- Save Button -->
                                            <button
                                                @click="handleSave(question)"
                                                :disabled="
                                                    isSaving[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all flex-shrink-0 disabled:opacity-50"
                                            >
                                                <svg
                                                    v-if="
                                                        isSaving[
                                                            question.id_pergunta
                                                        ]
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

                                    <!-- TOTAL -->
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
                                                >{{
                                                    totalScore.toFixed(0)
                                                }}</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div
                                    class="mt-8 bg-[#1E1E2D] rounded-xl p-6 border border-white/5 text-center"
                                >
                                    <h4
                                        class="text-lg font-bold text-white mb-2"
                                    >
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

                                    <div
                                        class="flex flex-wrap justify-center gap-2"
                                    >
                                        <button
                                            @click="updateStatus('Aprovado')"
                                            class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors text-sm"
                                        >
                                            Aprovar
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
        </div>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
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

/* Tabs Scroll Container - Primary Color */
.tabs-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) transparent;
}

.tabs-scroll-container::-webkit-scrollbar {
    height: 8px;
}

.tabs-scroll-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
}

.tabs-scroll-container::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: 4px;
    opacity: 0.5;
}

.tabs-scroll-container::-webkit-scrollbar-thumb:hover {
    opacity: 0.8;
}
</style>
