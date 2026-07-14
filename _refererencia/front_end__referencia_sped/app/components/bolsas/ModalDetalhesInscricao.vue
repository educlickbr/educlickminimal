<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";
import { generateUuidFileName } from "../../../utils/file";

const appStore = useAppStore();

const props = defineProps<{
    isOpen: boolean;
    inscricao: any;
    hideResumoTab?: boolean;
}>();

const emit = defineEmits(["close", "saved"]);

const { showToast } = useToast();

const activeTab = ref("Resumo");
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const isUploading = ref(false);

const localArquivo = ref("");

watch(
    () => props.inscricao,
    (newVal) => {
        localArquivo.value = newVal?.arquivo_cad_unico || "";
        // Se hideResumoTab for true, começa em 'Dados Cadastrais'
        if (props.hideResumoTab) {
            activeTab.value = "Dados Cadastrais";
        } else {
            activeTab.value = "Resumo";
        }
    },
    { immediate: true },
);

// Student Data State
const formData = ref<any[]>([]);
const answers = ref<Record<string, any>>({});
const activeBlockTab = ref(""); // For the inner tabs of student data

// Evaluation State
const comentario = ref("");

// Computed Blocks (Same as ModalDadosCandidato but simplified)
const processedBlocks = computed(() => {
    if (!formData.value) return {};
    const blocks: Record<string, any[]> = {};

    formData.value.forEach((q: any) => {
        if (!blocks[q.bloco]) blocks[q.bloco] = [];
        blocks[q.bloco]?.push(q);
    });

    Object.keys(blocks).forEach((key) => {
        blocks[key]?.sort((a: any, b: any) => a.ordem - b.ordem);
    });
    return blocks;
});

const activeBlocks = computed(() => {
    let keys = Object.keys(processedBlocks.value);

    // Hide blocks that have NO answered questions (resposta is null/undefined)
    keys = keys.filter((blockKey) => {
        const questionsInBlock = processedBlocks.value[blockKey] || [];
        return questionsInBlock.some(
            (q) => q.resposta !== null && q.resposta !== undefined,
        );
    });

    // Sort blocks by ordem_bloco from database
    return keys.sort((a, b) => {
        const blocksA = processedBlocks.value[a] || [];
        const blocksB = processedBlocks.value[b] || [];

        const ordemA = blocksA[0]?.ordem_bloco ?? 999;
        const ordemB = blocksB[0]?.ordem_bloco ?? 999;

        return ordemA - ordemB;
    });
});

// Fetch Student Data
const fetchStudentData = async () => {
    if (!props.inscricao?.id_aluno) return;

    isLoading.value = true;
    try {
        // Using 'regulares' and 'estudante' as default context for fetching general profile
        const res = await ofetch<any>("/api/common/respostas", {
            params: {
                area: "regulares",
                tipo_candidatura: "estudante",
                tipo_processo: "matricula",
                user_id: props.inscricao.id_aluno,
            },
        });

        formData.value = res.data || [];

        // Populate answers
        const initialAnswers: Record<string, any> = {};
        formData.value.forEach((q: any) => {
            if (q.resposta !== undefined && q.resposta !== null) {
                initialAnswers[q.id_pergunta] = q.resposta;
            }
        });
        answers.value = initialAnswers;

        // Set initial inner tab
        if (activeBlocks.value.length > 0 && !activeBlockTab.value) {
            const firstBlock = activeBlocks.value[0];
            if (firstBlock) activeBlockTab.value = firstBlock;
        }
    } catch (e) {
        console.error(e);
        showToast("Erro ao carregar dados do aluno.", { type: "error" });
    } finally {
        isLoading.value = false;
    }
};

const hashEditais = ref("");

// Watchers
watch(
    () => props.isOpen,
    async (val) => {
        if (val) {
            // Refresh hash when modal opens
            try {
                const res = await ofetch<any>("/api/refresh-hash-editais");
                if (res.hash_base) {
                    hashEditais.value = res.hash_base;
                }
            } catch (e) {
                console.error("Error refreshing hash:", e);
            }

            comentario.value = props.inscricao?.comentario_admin || "";
            fetchStudentData();
        } else {
            activeTab.value = "Resumo";
            formData.value = [];
            answers.value = {};
        }
    },
);

// Actions
const pendingStatus = ref("");
const showConfirm = ref(false);

const requestUpdate = (status: string) => {
    pendingStatus.value = status;
    showConfirm.value = true;
};

const confirmUpdate = async () => {
    if (!pendingStatus.value) return;
    const status = pendingStatus.value;

    isSaving.value = true;
    try {
        await ofetch("/api/bolsas/avaliar", {
            method: "POST",
            body: {
                id_submissao: props.inscricao.id,
                status: status,
                comentario: comentario.value,
            },
        });

        showToast("Avaliação salva com sucesso!", { type: "success" });
        emit("saved");
        emit("close");
    } catch (e: any) {
        console.error(e);
        showToast("Erro ao salvar avaliação.", { type: "error" });
    } finally {
        isSaving.value = false;
        showConfirm.value = false; // Reset UI
    }
};

const showDeleteConfirm = ref(false);

const handleDeleteFile = async () => {
    // Previously used confirm(), now we just skip that check here because the button calling this is the "Confirmar" button in the UI
    // OR we change the flow. Let's make this the actual action.

    if (!props.inscricao?.id) {
        showToast("Erro: ID da inscrição não encontrado.", { type: "error" });
        return;
    }

    isDeleting.value = true;
    try {
        await ofetch("/api/bolsas/inscricao/delete-arquivo-submissao", {
            method: "POST",
            body: { id_submissao: props.inscricao.id },
        });

        localArquivo.value = "";
        showToast("Arquivo removido com sucesso!", { type: "success" });
        emit("saved");
    } catch (e) {
        console.error(e);
        showToast("Erro ao remover arquivo.", { type: "error" });
    } finally {
        isDeleting.value = false;
        showDeleteConfirm.value = false;
    }
};

const handleUploadFile = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (e.g. 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast("O arquivo deve ter no máximo 10MB.", { type: "error" });
        return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64 = reader.result?.toString().split(",")[1];

        isUploading.value = true;
        if (!props.inscricao?.id) {
            showToast("Erro: ID da inscrição não encontrado.", {
                type: "error",
            });
            isUploading.value = false;
            return;
        }

        // Generate UUID name
        const newFileName = generateUuidFileName(file.name);

        try {
            const res = await ofetch<any>(
                "/api/bolsas/inscricao/upload-correction",
                {
                    method: "POST",
                    body: {
                        id_submissao: props.inscricao.id,
                        fileName: newFileName,
                        fileBase64: base64,
                    },
                },
            );

            localArquivo.value = res.filePath;
            showToast("Arquivo enviado com sucesso!", { type: "success" });
            emit("saved");
        } catch (e: any) {
            console.error(e);
            showToast("Erro ao enviar arquivo.", { type: "error" });
        } finally {
            isUploading.value = false;
            // Reset input
            event.target.value = "";
        }
    };
};

const openFile = async (fileName: string) => {
    if (!fileName) return;

    // Refresh again to be safe? Or rely on the one fetched at open.
    // Ideally we refresh if it's been a while, but for now let's just ensure we have it.
    if (!hashEditais.value) {
        try {
            const res = await ofetch<any>("/api/refresh-hash-editais");
            if (res.hash_base) hashEditais.value = res.hash_base;
        } catch (e) {
            console.error(e);
        }
    }

    // Check if fileName already has 'editais/' prefix.
    const cleanName = fileName.replace("editais/", "");
    const url = hashEditais.value
        ? `${hashEditais.value}${cleanName}`
        : fileName;
    window.open(url, "_blank");
};

// Helpers
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

const shouldShowQuestion = (question: any) => {
    if (!question.depende) return true;
    if (!question.depende_de || !question.valor_depende) return true;
    const parentAnswer = answers.value[question.depende_de];
    const parentValStr =
        parentAnswer === undefined || parentAnswer === null
            ? ""
            : String(parentAnswer);
    return String(question.valor_depende) === parentValStr;
};

const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleString("pt-BR");
};
</script>

<template>
    <div v-if="isOpen" class="relative z-50">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            @click="$emit('close')"
        ></div>

        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4">
                <div
                    class="relative w-full max-w-4xl bg-[#16161E] border border-white/10 rounded-xl shadow-2xl p-6 md:p-8"
                    @click.stop
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between mb-6 border-b border-white/10 pb-4"
                    >
                        <div>
                            <h3 class="text-xl font-bold text-white">
                                Detalhes da Inscrição
                            </h3>
                            <p class="text-sm text-secondary">
                                {{ inscricao?.nome }}
                                {{ inscricao?.sobrenome }} • RA:
                                {{ inscricao?.ra }}
                            </p>
                        </div>
                        <button
                            @click="$emit('close')"
                            class="text-secondary hover:text-white"
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

                    <!-- Main Tabs -->
                    <div class="flex gap-4 mb-6 border-b border-white/5">
                        <button
                            v-for="tab in hideResumoTab
                                ? ['Dados Cadastrais']
                                : ['Resumo', 'Dados Cadastrais']"
                            :key="tab"
                            @click="activeTab = tab"
                            class="pb-2 text-sm font-bold border-b-2 transition-colors"
                            :class="
                                activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-secondary hover:text-white'
                            "
                        >
                            {{ tab }}
                        </button>
                    </div>

                    <!-- TAB: RESUMO -->
                    <div v-if="activeTab === 'Resumo'" class="space-y-6">
                        <!-- Info Grid -->
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-lg border border-white/5"
                        >
                            <div>
                                <label
                                    class="text-xs font-bold text-secondary-500 uppercase"
                                    >Edital</label
                                >
                                <p class="text-white">
                                    {{ inscricao?.edital_titulo }} ({{
                                        inscricao?.ano_semestre
                                    }})
                                </p>
                            </div>
                            <div>
                                <label
                                    class="text-xs font-bold text-secondary-500 uppercase"
                                    >Status Atual</label
                                >
                                <span
                                    class="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider border"
                                    :class="{
                                        'bg-yellow-400/10 text-yellow-400 border-yellow-400/20':
                                            inscricao?.status === 'Aguardando',
                                        'bg-blue-400/10 text-blue-400 border-blue-400/20':
                                            inscricao?.status === 'Em Análise',
                                        'bg-green-400/10 text-green-400 border-green-400/20':
                                            inscricao?.status === 'Aprovado',
                                        'bg-red-400/10 text-red-400 border-red-400/20':
                                            inscricao?.status === 'Reprovado',
                                    }"
                                >
                                    {{ inscricao?.status }}
                                </span>
                            </div>
                            <div>
                                <label
                                    class="text-xs font-bold text-secondary-500 uppercase"
                                    >Data Envio</label
                                >
                                <p class="text-white">
                                    {{ formatDate(inscricao?.criado_em) }}
                                </p>
                            </div>
                            <div>
                                <label
                                    class="text-xs font-bold text-secondary-500 uppercase"
                                    >Curso / Turno</label
                                >
                                <p class="text-white">
                                    {{ inscricao?.nome_curso }} -
                                    {{ inscricao?.turno }}
                                </p>
                            </div>
                        </div>

                        <!-- Arquivo CadUnico -->
                        <div
                            class="bg-primary/5 border border-primary/20 rounded-lg p-4"
                        >
                            <h4
                                class="text-sm font-bold text-white mb-2 flex items-center gap-2"
                            >
                                <svg
                                    class="w-4 h-4 text-primary"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    ></path>
                                </svg>
                                Comprovante CadÚnico
                            </h4>
                            <div
                                v-if="localArquivo"
                                class="flex flex-col gap-2 mt-2"
                            >
                                <div class="flex items-center gap-4">
                                    <span
                                        class="text-xs text-secondary truncate max-w-xs"
                                        >{{ localArquivo }}</span
                                    >
                                    <button
                                        @click="openFile(localArquivo)"
                                        class="text-xs font-bold bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded transition-colors"
                                    >
                                        Baixar / Visualizar
                                    </button>
                                    <div
                                        v-if="showDeleteConfirm"
                                        class="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                                    >
                                        <span
                                            class="text-xs font-bold text-red-400"
                                            >Tem certeza?</span
                                        >
                                        <button
                                            @click="showDeleteConfirm = false"
                                            class="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-2 py-1.5 rounded transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            @click="handleDeleteFile"
                                            class="text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded transition-colors shadow-lg shadow-red-500/20"
                                        >
                                            Sim, Deletar
                                        </button>
                                    </div>

                                    <button
                                        v-else
                                        @click="showDeleteConfirm = true"
                                        :disabled="isDeleting"
                                        class="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
                                    >
                                        <svg
                                            v-if="isDeleting"
                                            class="w-3 h-3 animate-spin"
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
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                        Deletar
                                    </button>
                                </div>
                            </div>
                            <div v-else class="mt-2">
                                <div class="flex items-center gap-2">
                                    <label
                                        class="relative cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-colors group"
                                    >
                                        <span
                                            class="text-xs font-bold text-secondary group-hover:text-white flex items-center gap-2"
                                        >
                                            <svg
                                                v-if="isUploading"
                                                class="w-4 h-4 animate-spin text-primary"
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
                                                class="w-4 h-4 text-primary"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                />
                                            </svg>
                                            {{
                                                isUploading
                                                    ? "Enviando..."
                                                    : "Enviar Correção / Novo Arquivo"
                                            }}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            @change="handleUploadFile"
                                            :disabled="isUploading"
                                            class="hidden"
                                        />
                                    </label>
                                </div>
                                <p
                                    class="text-[10px] text-secondary/50 mt-1 ml-1"
                                >
                                    Formatos aceitos: PDF, JPG, PNG (Max 10MB).
                                    <br />
                                    O envio substitui o arquivo anterior
                                    imediatamente.
                                </p>
                            </div>
                        </div>

                        <!-- Avaliação -->
                        <div
                            class="bg-black/20 border border-white/10 rounded-lg p-4 space-y-4"
                        >
                            <h4 class="text-sm font-bold text-white mb-2">
                                Avaliação da Secretaria
                            </h4>

                            <div>
                                <label
                                    class="text-xs font-bold text-secondary mb-1 block"
                                    >Comentário / Observação Interna</label
                                >
                                <textarea
                                    v-model="comentario"
                                    placeholder="Adicione um comentário para justificar a decisão..."
                                    class="w-full bg-[#16161E] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    rows="3"
                                ></textarea>
                            </div>

                            <!-- Action Buttons or Confirmation -->
                            <div class="pt-2">
                                <div
                                    v-if="showConfirm"
                                    class="flex flex-col items-end gap-3 bg-[#16161E] border border-white/10 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
                                >
                                    <p class="text-sm font-bold text-white">
                                        Confirma alterar para
                                        <span
                                            :class="{
                                                'text-blue-400':
                                                    pendingStatus ===
                                                    'Em Análise',
                                                'text-red-400':
                                                    pendingStatus ===
                                                    'Reprovado',
                                                'text-emerald-400':
                                                    pendingStatus ===
                                                    'Aprovado',
                                            }"
                                            >{{ pendingStatus }}</span
                                        >?
                                    </p>
                                    <div class="flex gap-2">
                                        <button
                                            @click="showConfirm = false"
                                            class="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            @click="confirmUpdate"
                                            :disabled="isSaving"
                                            class="px-3 py-1.5 rounded font-bold text-xs transition-colors flex items-center gap-2"
                                            :class="{
                                                'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30':
                                                    pendingStatus ===
                                                    'Em Análise',
                                                'bg-red-500/20 text-red-400 hover:bg-red-500/30':
                                                    pendingStatus ===
                                                    'Reprovado',
                                                'bg-emerald-500 text-white hover:bg-emerald-600':
                                                    pendingStatus ===
                                                    'Aprovado',
                                            }"
                                        >
                                            <svg
                                                v-if="isSaving"
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
                                            Confirmar
                                        </button>
                                    </div>
                                </div>

                                <div v-else class="flex gap-2 justify-end">
                                    <button
                                        @click="requestUpdate('Em Análise')"
                                        :disabled="isSaving"
                                        class="px-4 py-2 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-sm border border-blue-500/20 transition-colors"
                                    >
                                        Em Análise
                                    </button>
                                    <button
                                        @click="requestUpdate('Reprovado')"
                                        :disabled="isSaving"
                                        class="px-4 py-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-sm border border-red-500/20 transition-colors"
                                    >
                                        Reprovar
                                    </button>
                                    <button
                                        @click="requestUpdate('Aprovado')"
                                        :disabled="isSaving"
                                        class="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-colors"
                                    >
                                        Aprovar Bolsa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB: DADOS CADASTRAIS (READ ONLY) -->
                    <div
                        v-else-if="activeTab === 'Dados Cadastrais'"
                        class="min-h-[400px]"
                    >
                        <div v-if="isLoading" class="flex justify-center py-20">
                            <div
                                class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                            ></div>
                        </div>

                        <div v-else class="flex gap-4">
                            <!-- Sidebar Tabs -->
                            <div class="w-1/4 space-y-1">
                                <button
                                    v-for="blockKey in activeBlocks"
                                    :key="blockKey"
                                    @click="activeBlockTab = blockKey"
                                    class="w-full text-left px-3 py-2 rounded text-xs font-bold transition-colors truncate"
                                    :class="
                                        activeBlockTab === blockKey
                                            ? 'bg-primary/20 text-primary'
                                            : 'text-secondary hover:text-white hover:bg-white/5'
                                    "
                                >
                                    {{ formatBlockName(blockKey) }}
                                </button>
                            </div>

                            <!-- Content -->
                            <div
                                class="w-3/4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                            >
                                <div
                                    v-if="processedBlocks[activeBlockTab]"
                                    class="space-y-4"
                                >
                                    <template
                                        v-for="question in processedBlocks[
                                            activeBlockTab
                                        ]"
                                        :key="question.id_pergunta"
                                    >
                                        <div
                                            v-if="shouldShowQuestion(question)"
                                            class="border-b border-white/5 pb-4 last:border-0"
                                        >
                                            <label
                                                class="text-xs font-bold text-secondary-500 block mb-1"
                                            >
                                                {{ question.label }}
                                            </label>

                                            <div
                                                v-if="
                                                    question.tipo === 'arquivo'
                                                "
                                            >
                                                <button
                                                    v-if="
                                                        answers[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                    @click="
                                                        openFile(
                                                            answers[
                                                                question
                                                                    .id_pergunta
                                                            ],
                                                        )
                                                    "
                                                    class="text-xs text-primary underline flex items-center gap-1"
                                                >
                                                    <svg
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
                                                    Ver Arquivo Anexado
                                                </button>
                                                <span
                                                    v-else
                                                    class="text-xs text-secondary/50 italic"
                                                    >Nenhum arquivo.</span
                                                >
                                            </div>

                                            <div v-else>
                                                <p
                                                    class="text-sm text-white bg-black/20 p-2 rounded"
                                                >
                                                    {{
                                                        answers[
                                                            question.id_pergunta
                                                        ] || "-"
                                                    }}
                                                </p>
                                            </div>
                                        </div>
                                    </template>
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
</style>
