<script setup lang="ts">
import { useToast } from "../../../../../composables/useToast";
import { calculateAgeFromIso } from "../../../../utils/idade";
import {
    generateUuidFileName,
    fileToBase64,
    validateFile,
} from "../../../../../utils/file";
import { $fetch as ofetch } from "ofetch";

definePageMeta({
    // layout: 'base' // Using explicit NuxtLayout in template
});

const route = useRoute();
const appStore = useAppStore();
const cursoParam = String(route.params.curso || "").toLowerCase();
const turnoParam = String(route.params.turno || "").toLowerCase();

const COURSE_CONFIG: Record<
    string,
    Record<string, { id: string; header: string }>
> = {
    "danca-performance": {
        matutino: {
            id: "2e27cc66-b827-461a-b16b-9fd127e0302b",
            header:
                "Curso Regular: Processo Seletivo Descentralizado - Dança e Performance com Ênfase em Dancas do Brasil.",
        },
        vespertino: {
            id: "c1ea9fec-9a69-46d9-b137-2acb80282f23",
            header:
                "Curso Regular: Processo Seletivo Descentralizado - Dança e Performance com Ênfase em Dancas do Brasil.",
        },
    },
    "tecnicas-danca-moderno-cont": {
        matutino: {
            id: "e7f0f585-2f0b-453d-bd76-ba39347de3b7",
            header:
                "Curso Regular: Processo Seletivo Descentralizado - Técnicas da Dança com ênfase em Moderno e Contemporâneo",
        },
        vespertino: {
            id: "5f34bfab-1b68-49a2-8d2d-ccd237e45a4e",
            header:
                "Curso Regular: Processo Seletivo Descentralizado - Técnicas da Dança com ênfase em Moderno e Contemporâneo",
        },
    },
};

const config = COURSE_CONFIG[cursoParam]?.[turnoParam];

if (!config) {
    throw createError({
        statusCode: 404,
        statusMessage:
            "Curso ou turno inválido para inscrição de Fábrica de Cultura.",
    });
}

const courseId = config.id;
const FABRICA_HEADER = config.header;

// tipo and processo are always fixed for Fabrica de Cultura
const queryRole = "estudante";
const queryProcesso = "seletivo";
const isFabricaCulturaPilot = computed(() => true);
const CARTA_INTENCAO_SLUG = "carta_intencao";
const CARTA_INTENCAO_MIN = 800;
const CARTA_INTENCAO_MAX = 1500;
const supabase = useSupabaseClient();
const router = useRouter();

// --- Data Fetching ---
// We call it formData to maintain compatibility with the existing template
const {
    data: formData,
    pending,
    error,
} = await useAsyncData<any>("fabrica-cultura-form", () => {
    const $fetch = useRequestFetch();
    return $fetch("/api/inscricao/form", {
        query: { id: courseId, tipo: queryRole, processo: queryProcesso },
    });
});

// Type definition for Question from API
interface Pergunta {
    id_pergunta: string;
    pergunta: string;
    label: string;
    tipo: string;
    bloco: string;
    ordem: number;
    ordem_bloco?: number;
    obrigatorio: boolean;
    largura: number;
    altura: number;
    depende: boolean;
    depende_de: string | null;
    valor_depende: string[] | null;
    pergunta_gatilho: boolean;
    valor_gatilho: any;
    resposta: any;
    arquivo_original: string | null;
    uploading: boolean;
    deleting: boolean;
    load: boolean;
    artificial?: boolean;
    opcoes?: string[];
}

const isLikelyFileValue = (value: unknown) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    return /\.(pdf|png|jpg|jpeg|webp|doc|docx)$/.test(v);
};

const applyFabricaCulturaOverrides = (payload: any) => {
    if (
        !isFabricaCulturaPilot.value ||
        !payload?.perguntas ||
        !Array.isArray(payload.perguntas)
    )
        return;

    const withoutCurriculo = payload.perguntas.filter(
        (q: Pergunta) => q.pergunta !== "curriculo",
    );
    const currentCarta = withoutCurriculo.find(
        (q: Pergunta) => q.pergunta === CARTA_INTENCAO_SLUG,
    );

    const filteredWithoutCarta = withoutCurriculo.filter(
        (q: Pergunta) => q.pergunta !== CARTA_INTENCAO_SLUG,
    );
    const ordemSobreCurso = filteredWithoutCarta
        .filter((q: Pergunta) => q.bloco === "sobre_curso")
        .reduce((max: number, q: Pergunta) => Math.max(max, q.ordem || 0), 0);
    const ordemBlocoSobreCurso =
        filteredWithoutCarta.find((q: Pergunta) => q.bloco === "sobre_curso")
            ?.ordem_bloco || 6;

    const cartaResposta = currentCarta?.resposta;
    const sanitizedCartaResposta = isLikelyFileValue(cartaResposta)
        ? null
        : cartaResposta;

    const cartaPergunta: Pergunta = {
        ...(currentCarta || {
            id_pergunta: "carta_intencao_virtual",
            pergunta: CARTA_INTENCAO_SLUG,
            bloco: "sobre_curso",
            ordem_bloco: ordemBlocoSobreCurso,
            depende: false,
            depende_de: null,
            valor_depende: null,
            pergunta_gatilho: false,
            valor_gatilho: null,
            arquivo_original: null,
            uploading: false,
            deleting: false,
            load: false,
        }),
        pergunta: CARTA_INTENCAO_SLUG,
        label: "Carta de Intencao - Qual a importancia da danca na sua vida?",
        tipo: "texto",
        bloco: "sobre_curso",
        ordem_bloco: ordemBlocoSobreCurso,
        ordem: currentCarta?.ordem || ordemSobreCurso + 1,
        obrigatorio: true,
        largura: 2,
        altura: 220,
        resposta: sanitizedCartaResposta,
        arquivo_original: null,
        opcoes: [],
    };

    payload.perguntas = [...filteredWithoutCarta, cartaPergunta];
    payload.curso = FABRICA_HEADER;
};

// Logic to process fields
const processedBlocks = computed(() => {
    const p = formData.value?.perguntas;
    if (!p) return {};

    // TODO: Remover quando o bloco de responsável legal for reativado no formulário.
    // A lógica original exibia o bloco apenas para candidatos com menos de 18 anos.
    // Para reativar: remover a linha abaixo e descomentar o bloco de cálculo de idade.
    const shouldBypassResponsavelLegal = true;

    /* LÓGICA ORIGINAL — reativar quando necessário:
    const shouldBypassResponsavelLegal = (() => {
        const perguntaNascimento = p.find((q: Pergunta) => q.pergunta === 'data_de_nascimento' || q.pergunta === 'data_nascimento')
        if (perguntaNascimento) {
            const nascimento = String(answers.value[perguntaNascimento.id_pergunta] ?? perguntaNascimento.resposta ?? '')
            const idadeCalculada = calculateAgeFromIso(nascimento)
            if (idadeCalculada !== null) {
                return idadeCalculada >= 18
            }
        }

        const perguntaIdade = p.find((q: Pergunta) => q.pergunta === 'idade')
        const idadeBruta = perguntaIdade
            ? (answers.value[perguntaIdade.id_pergunta] ?? perguntaIdade.resposta)
            : formData.value?.idade_usuario

        const idadeNumero = Number(idadeBruta)
        if (!Number.isNaN(idadeNumero)) {
            return idadeNumero >= 18
        }

        return false
    })()
    */

    // 1. Group by bloco
    const blocks: Record<string, Pergunta[]> = {};

    p.forEach((q: Pergunta) => {
        if (shouldBypassResponsavelLegal && q.bloco === "responsavel_legal") {
            return;
        }

        if (!blocks[q.bloco]) {
            blocks[q.bloco] = [];
        }
        blocks[q.bloco]!.push(q);
    });

    // 2. Sort by ordem within each block
    Object.keys(blocks).forEach((key) => {
        blocks[key]!.sort((a, b) => a.ordem - b.ordem);
    });

    return blocks;
});

// Dynamic block order based on API response
// Prefer `ordem_bloco` when provided by the API; fallback to question `ordem`.
const activeBlocks = computed<string[]>(() => {
    let blockEntries = Object.entries(processedBlocks.value);
    if (blockEntries.length === 0) return [];

    const blockOrderMap: Record<string, number> = {};

    blockEntries.forEach(([blockName, questions]) => {
        const firstOrder = questions.reduce((min, q) => {
            const ord = (q as any).ordem_bloco ?? q.ordem ?? 0;
            return Math.min(min, ord);
        }, Number.POSITIVE_INFINITY);

        blockOrderMap[blockName] = Number.isFinite(firstOrder) ? firstOrder : 0;
    });

    return Object.entries(blockOrderMap)
        .sort((a, b) => a[1] - b[1])
        .map(([k]) => k);
});

// State for active tab
const activeTab = ref<string>("");

// Reactive answers object: mapping question ID to its value
const answers = ref<Record<string, any>>({});

// Files state for upload management
const files = ref<Record<string, File | null>>({});
const fileNames = ref<Record<string, string>>({});

// Initialize answers and activeTab once data loaded
watch(
    formData,
    (newData) => {
        applyFabricaCulturaOverrides(newData);

        if (newData?.perguntas) {
            newData.perguntas.forEach((q: Pergunta) => {
                // Priority 1: Answer from database
                if (q.resposta !== undefined && q.resposta !== null) {
                    if (q.tipo === "boolean") {
                        // backend may return string 'true' or boolean true
                        answers.value[q.id_pergunta] =
                            q.resposta === true ||
                            String(q.resposta) === "true";
                    } else if (
                        q.tipo === "data" &&
                        typeof q.resposta === "string"
                    ) {
                        // input[type="date"] expects YYYY-MM-DD.
                        // Incoming might be ISO with time: "1988-01-07T16:01:00-02:00"
                        answers.value[q.id_pergunta] = q.resposta.split("T")[0];
                    } else {
                        answers.value[q.id_pergunta] = q.resposta;
                    }
                }
                // Priority 2: Artificial fields from AppStore
                else if (q.artificial) {
                    if (q.pergunta === "nome")
                        answers.value[q.id_pergunta] = appStore.nome;
                    if (q.pergunta === "sobrenome")
                        answers.value[q.id_pergunta] = appStore.sobrenome;
                    if (q.pergunta === "email")
                        answers.value[q.id_pergunta] = appStore.user?.email;
                }

                // Handle file info if exists
                if (q.tipo === "arquivo" && q.arquivo_original) {
                    fileNames.value[q.id_pergunta] = q.arquivo_original;
                }
            });
        }
    },
    { immediate: true },
);

watch(
    activeBlocks,
    (newBlocks) => {
        if (!newBlocks || newBlocks.length === 0) {
            activeTab.value = "";
            return;
        }

        if (!activeTab.value || !newBlocks.includes(activeTab.value)) {
            activeTab.value = newBlocks[0] as string;
        }
    },
    { immediate: true },
);

// Formatting helper
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
const formatBlockName = (name: string) => {
    return BLOCO_LABELS[name] ?? name;
};

// Input type processing
const getInputType = (tipo: string) => {
    switch (tipo) {
        case "texto":
            return "text";
        case "número":
            return "number";
        case "data":
            return "date";
        case "telefone":
            return "tel";
        case "email":
            return "email";
        default:
            return "text";
    }
};

const { showToast } = useToast();

// Navigation Handlers
const handleNext = () => {
    const currentIndex = activeBlocks.value.indexOf(activeTab.value);
    if (currentIndex < activeBlocks.value.length - 1) {
        // Validate current block before advancing
        const valid = validateBlock(activeTab.value);
        if (!valid) {
            showToast(
                "Existem respostas obrigatórias neste bloco. Role até o campo destacado para responder.",
                { type: "error", duration: 6000 },
            );
            return;
        }
        activeTab.value = activeBlocks.value[currentIndex + 1] as string;
    }
};

const isSubmitting = ref(false);

const handleSubmit = async () => {
    // 1. Validate current block
    const valid = validateBlock(activeTab.value);
    if (!valid) {
        showToast(
            "Existem respostas obrigatórias neste bloco. Role até o campo destacado para responder.",
            { type: "error", duration: 6000 },
        );
        return;
    }

    const processoLabel = "Inscrição";

    if (
        confirm(
            `Tem certeza que deseja enviar sua ${processoLabel.toLowerCase()}? Essa ação não poderá ser desfeita.`,
        )
    ) {
        isSubmitting.value = true;
        try {
            // 2. Refresh Session
            const { error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                throw new Error(
                    "Sessão expirada. Recarregue a página e tente novamente.",
                );
            }

            // 3. Submit
            const result: any = await ofetch("/api/inscricao/submit", {
                method: "POST",
                body: {
                    id_turma: courseId,
                    tipo_candidatura: queryRole || "estudante",
                    tipo_processo: queryProcesso || "seletivo",
                },
            });

            if (result && result.ok) {
                appStore.statusMessage = {
                    title: `${processoLabel} enviada com sucesso!`,
                    message: `${processoLabel} enviada com sucesso! Confira suas inscrições e os documentos enviados em Meus Processos, basta clicar no botão abaixo.`,
                    type: "success",
                    actionLabel: "Meus Processos",
                    actionPath: "/meus-processos",
                };
                router.push("/mensagem");
            } else if (result && result.acao === "ignorado") {
                showToast(`Aviso: ${result.mensagem}`, {
                    type: "info",
                    duration: 6000,
                });
            } else {
                throw new Error("Erro desconhecido ao enviar.");
            }
        } catch (err: any) {
            console.error("Submit Error:", err);
            showToast(
                err.message || "Erro ao enviar inscrição. Tente novamente.",
                { type: "error", duration: 6000 },
            );
        } finally {
            isSubmitting.value = false;
        }
    }
};

// Validation: track missing required fields per question
const requiredMissing = ref<Record<string, boolean>>({});
const fieldErrors = ref<Record<string, string>>({});

// Logic to check dependencies
const shouldShowQuestion = (question: Pergunta) => {
    // 1. If not dependent, show
    if (!question.depende) return true;

    // 2. If config missing, show (fail-safe)
    if (!question.depende_de || !question.valor_depende) return true;

    // 3. Get answer of the parent question from local state
    const parentAnswer = answers.value[question.depende_de];

    // Convert to string to robustly match against allowed values (which are usually strings in JSON)
    const parentValStr =
        parentAnswer === undefined || parentAnswer === null
            ? ""
            : String(parentAnswer);

    // 4. Check if parent answer is in allowed values
    const allowedValues = Array.isArray(question.valor_depende)
        ? question.valor_depende.map((v) => String(v))
        : [String(question.valor_depende)];

    return allowedValues.includes(parentValStr);
};

const validateBlock = (blockKey: string) => {
    const block = processedBlocks.value[blockKey];
    if (!block || block.length === 0) return true;

    let hasMissing = false;
    block.forEach((q: Pergunta) => {
        // Skip validation if question is hidden by dependency
        if (!shouldShowQuestion(q)) {
            // Also ensure we clear any previous error state for hidden fields
            if (requiredMissing.value[q.id_pergunta]) {
                requiredMissing.value[q.id_pergunta] = false;
            }
            return;
        }

        if (q.obrigatorio) {
            const val = answers.value[q.id_pergunta];
            const empty =
                val === undefined || val === null || String(val).trim() === "";
            if (empty) {
                requiredMissing.value[q.id_pergunta] = true;
                fieldErrors.value[q.id_pergunta] = "Resposta obrigatoria";
                hasMissing = true;
            } else {
                requiredMissing.value[q.id_pergunta] = false;
                fieldErrors.value[q.id_pergunta] = "";

                if (
                    isFabricaCulturaPilot.value &&
                    q.pergunta === CARTA_INTENCAO_SLUG
                ) {
                    const tamanho = String(val).trim().length;
                    if (
                        tamanho < CARTA_INTENCAO_MIN ||
                        tamanho > CARTA_INTENCAO_MAX
                    ) {
                        fieldErrors.value[q.id_pergunta] =
                            `A Carta de Intencao deve ter entre ${CARTA_INTENCAO_MIN} e ${CARTA_INTENCAO_MAX} caracteres.`;
                        hasMissing = true;
                    }
                }
            }
        }
    });

    return !hasMissing;
};

// Navigate to tab with forward validation
const goToTab = (blockKey: string) => {
    const currentIndex = activeBlocks.value.indexOf(activeTab.value);
    const targetIndex = activeBlocks.value.indexOf(blockKey);
    if (targetIndex === -1) return;

    // Moving forward: validate current block
    if (targetIndex > currentIndex) {
        const ok = validateBlock(activeTab.value);
        if (!ok) {
            showToast(
                "Existem respostas obrigatórias neste bloco. Role até o campo destacado para responder.",
                { type: "error", duration: 6000 },
            );
            return;
        }
    }

    activeTab.value = blockKey;
};

// Clear missing flags when answers change
watch(
    answers,
    (newA) => {
        Object.keys(newA).forEach((k) => {
            const v = newA[k];
            if (v !== undefined && v !== null && String(v).trim() !== "") {
                if (requiredMissing.value[k]) requiredMissing.value[k] = false;
                if (fieldErrors.value[k]) fieldErrors.value[k] = "";
            }
        });
    },
    { deep: true },
);

const getCartaLength = (questionId: string) => {
    const raw = answers.value[questionId];
    if (raw === undefined || raw === null) return 0;
    return String(raw).trim().length;
};

const isLastBlock = computed(() => {
    if (activeBlocks.value.length === 0) return false;
    return (
        activeTab.value === activeBlocks.value[activeBlocks.value.length - 1]
    );
});

// Auto-save State & Logic
const isSaving = ref<Record<string, boolean>>({});
const lastSaved = ref<Record<string, string>>({});
const saveTimeouts: Record<string, any> = {}; // Store timeouts for debounce

const saveAnswer = (question: Pergunta) => {
    const value = answers.value[question.id_pergunta];

    // Bypass saving for locked (read-only) fields
    if (lockedFields.value[question.id_pergunta]) return;

    // Don't save if empty
    if (value === undefined || value === null || String(value).trim() === "")
        return;

    // Visual feedback immediately
    isSaving.value[question.id_pergunta] = true;

    // Clear pending save for this question
    if (saveTimeouts[question.id_pergunta]) {
        clearTimeout(saveTimeouts[question.id_pergunta]);
    }

    // Set new debounce timeout (500ms)
    // Backup current value in case we need to revert
    const previous = value;

    saveTimeouts[question.id_pergunta] = setTimeout(async () => {
        try {
            const res: any = await ofetch("/api/inscricao/save", {
                method: "POST",
                body: {
                    p_id_turma: courseId,
                    p_id_pergunta: question.id_pergunta,
                    p_resposta: value,
                },
            });

            // Some BFF RPC endpoints return an envelope like { success: true, data: { sucesso: true } }
            const savedOk =
                res && (res.success === true || res.data?.sucesso === true);

            if (!savedOk) {
                // Revert value and inform user
                answers.value[question.id_pergunta] = null;
                showToast(
                    "Erro de sincronização: resposta não foi salva. Tente novamente.",
                    { type: "error", duration: 6000 },
                );
            } else {
                lastSaved.value[question.id_pergunta] =
                    new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    });
            }
        } catch (err: any) {
            console.error("Erro ao salvar resposta:", err);
            // Revert value and inform user
            answers.value[question.id_pergunta] = null;
            showToast(
                "Erro de sincronização: resposta não foi salva. Tente novamente.",
                { type: "error", duration: 6000 },
            );
        } finally {
            isSaving.value[question.id_pergunta] = false;
            delete saveTimeouts[question.id_pergunta];
        }
    }, 500);
};

const getOptions = (question: any) => {
    // Priority 1: Real options from database (Phase 3)
    if (
        question.opcoes &&
        Array.isArray(question.opcoes) &&
        question.opcoes.length > 0
    )
        return question.opcoes;

    // Priority 2: Fallback for common/artificial fields if not configured in DB yet
    switch (question.pergunta) {
        case "cor_raca":
            return ["Branca", "Preta", "Parda", "Amarela", "Indígena"];
        case "identidade_genero":
            return [
                "Cisgênero",
                "Transgênero",
                "Não-binário",
                "Outro",
                "Prefiro não informar",
            ];
        case "nacionalidade":
            return ["Brasileira", "Estrangeira"];
        case "formacao_escolar":
            return [
                "Fundamental Incompleto",
                "Fundamental Completo",
                "Médio Incompleto",
                "Médio Completo",
                "Superior Incompleto",
                "Superior Completo",
            ];
        case "renda_familiar_per_capita":
            return [
                "Até 1 salário mínimo",
                "1 a 3 salários mínimos",
                "3 a 5 salários mínimos",
                "Acima de 5 salários mínimos",
            ];
        case "pcd":
            return ["Sim", "Não"];
        default:
            return ["Sim", "Não"]; // Basic boolean fallback
    }
};

// File Handlers
// File Handlers

// Helper to get allowed MIME types
const getFileTypes = (question: Pergunta): string[] => {
    // If it's the photo field, allow images
    if (question.pergunta === "sua_foto") {
        return ["image/jpeg", "image/png", "image/jpg"];
    }
    // Otherwise, default to PDF only
    return ["application/pdf"];
};

const handleFileChange = async (event: Event, question: Pergunta) => {
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
            alert(error); // Simple alert for now, could be toast
            target.value = "";
            return;
        }

        // 2. Prepare Upload
        question.uploading = true;
        fileNames.value[question.id_pergunta] = file.name; // Optimistic update

        try {
            const uuidName = generateUuidFileName(file.name);
            const base64 = await fileToBase64(file);

            // 3. Upload via BFF
            await ofetch("/api/inscricao/upload", {
                method: "POST",
                body: {
                    id_turma: courseId,
                    id_pergunta: question.id_pergunta, // Renamed from id_question
                    fileName: uuidName,
                    originalName: file.name,
                    fileBase64: base64,
                },
            });

            // 4. Update State on Success
            files.value[question.id_pergunta] = file;
            answers.value[question.id_pergunta] = uuidName; // CRITICAL: Store UUID for subsequent actions (like delete)
            lastSaved.value[question.id_pergunta] =
                new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
        } catch (err) {
            console.error("Upload Error:", err);
            showToast(
                "Falha no upload. Tente novamente. (sincronização falhou)",
                { type: "error", duration: 6000 },
            );
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

const triggerFileUpload = (questionId: string) => {
    const el = document.getElementById(`file-${questionId}`);
    if (el) el.click();
};

// Inline confirmation state for file deletions (per-question)
const confirmDeletes = ref<Record<string, boolean>>({});

const showConfirmDelete = (question: Pergunta) => {
    confirmDeletes.value[question.id_pergunta] = true;
};

const cancelConfirmDelete = (question: Pergunta) => {
    confirmDeletes.value[question.id_pergunta] = false;
};

const performDeleteFile = async (question: Pergunta) => {
    question.deleting = true;
    try {
        // 1. Delete via BFF
        await ofetch("/api/inscricao/delete-file", {
            method: "POST",
            body: {
                id_turma: courseId,
                id_pergunta: question.id_pergunta,
                fileName: answers.value[question.id_pergunta],
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
    } catch (err) {
        console.error("Delete Error:", err);
        alert("Erro ao excluir arquivo.");
    } finally {
        question.deleting = false;
    }
};
// End File Handlers

// ... (skipping to template for brevity in search replacement)
/*
   We also need to update the input element in the template.
   I'll include the template change in a separate call or try to capture it if it's contiguous,
   but it's far down. I will split this into two edits if needed.
   The current block covers lines 209-302 approx.
*/

// CEP Logic
const loadingCep = ref(false);
const lockedFields = ref<Record<string, boolean>>({});

// Make artificial identity fields read-only (nome, sobrenome, email)
watch(
    formData,
    (newData) => {
        if (!newData?.perguntas) return;

        let perguntaNascimento: Pergunta | undefined;
        let perguntaIdade: Pergunta | undefined;

        newData.perguntas.forEach((q: Pergunta) => {
            if (
                (q.artificial &&
                    ["nome", "sobrenome", "email"].includes(q.pergunta)) ||
                q.pergunta === "idade"
            ) {
                lockedFields.value[q.id_pergunta] = true;
            }

            if (
                q.pergunta === "data_de_nascimento" ||
                q.pergunta === "data_nascimento"
            ) {
                perguntaNascimento = q;
            }

            if (q.pergunta === "idade") {
                perguntaIdade = q;
            }
        });

        if (perguntaNascimento && perguntaIdade) {
            const nascimento = String(
                answers.value[perguntaNascimento.id_pergunta] || "",
            );
            const idade = calculateAgeFromIso(nascimento);

            if (idade !== null) {
                answers.value[perguntaIdade.id_pergunta] = String(idade);
                lockedFields.value[perguntaIdade.id_pergunta] = true;
                if (formData.value) {
                    formData.value.idade_usuario = idade;
                }
            }
        }
    },
    { immediate: true },
);

const findQuestionBySlug = (slug: string) => {
    if (!formData.value?.perguntas) return null;
    // We match against the 'pergunta' field (slug) from the database
    return formData.value.perguntas.find((q: Pergunta) => q.pergunta === slug);
};

const findQuestionByAnySlug = (slugs: string[]) => {
    for (const slug of slugs) {
        const question = findQuestionBySlug(slug);
        if (question) return question;
    }
    return null;
};

const handleNascimentoBlur = async (question: Pergunta) => {
    if (lockedFields.value[question.id_pergunta]) return;

    const nascimento = String(answers.value[question.id_pergunta] || "");
    const idadeQuestion = findQuestionByAnySlug(["idade"]);
    if (!idadeQuestion) {
        saveAnswer(question);
        return;
    }

    const idade = calculateAgeFromIso(nascimento);
    if (idade === null) {
        saveAnswer(question);
        return;
    }

    answers.value[idadeQuestion.id_pergunta] = String(idade);
    lockedFields.value[idadeQuestion.id_pergunta] = true;
    if (formData.value) {
        formData.value.idade_usuario = idade;
    }
    isSaving.value[question.id_pergunta] = true;
    isSaving.value[idadeQuestion.id_pergunta] = true;

    try {
        const batchAnswers = [
            {
                id_pergunta: question.id_pergunta,
                resposta: nascimento,
                nome_arquivo_original: "",
            },
            {
                id_pergunta: idadeQuestion.id_pergunta,
                resposta: String(idade),
                nome_arquivo_original: "",
            },
        ];

        const res: any = await ofetch("/api/inscricao/save", {
            method: "POST",
            body: {
                p_id_turma: courseId,
                p_respostas_batch: batchAnswers,
            },
        });

        const savedOk =
            res && (res.success === true || res.data?.sucesso === true);
        if (!savedOk) {
            showToast("Erro ao salvar idade calculada automaticamente.", {
                type: "error",
                duration: 5000,
            });
            return;
        }

        lastSaved.value[question.id_pergunta] = new Date().toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" },
        );
        lastSaved.value[idadeQuestion.id_pergunta] =
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
    } catch (err) {
        console.error("Erro ao salvar idade automática:", err);
        showToast("Erro ao salvar idade calculada automaticamente.", {
            type: "error",
            duration: 5000,
        });
    } finally {
        isSaving.value[question.id_pergunta] = false;
        isSaving.value[idadeQuestion.id_pergunta] = false;
    }
};

const handleCepBlur = async (question: Pergunta) => {
    const cepValue = answers.value[question.id_pergunta];
    if (!cepValue) return;

    const sanitizedCep = String(cepValue).replace(/\D/g, "");
    if (sanitizedCep.length !== 8) return;

    loadingCep.value = true;

    try {
        // 1. Fetch from ViaCEP
        const data: any = await ofetch(
            `https://viacep.com.br/ws/${sanitizedCep}/json/`,
        );

        if (data.erro) {
            // Handle invalid CEP if needed (show toast/error)
            console.warn("CEP não encontrado");
            return;
        }

        // 2. Identify target fields
        const targets = {
            endereco: findQuestionBySlug("endereco"), // logradouro
            bairro: findQuestionBySlug("bairro"),
            cidade: findQuestionBySlug("cidade"), // localidade
            estado: findQuestionBySlug("estado"), // uf
            pais: findQuestionBySlug("pais"),
            numero: findQuestionBySlug("numero"), // keep clickable
            complemento: findQuestionBySlug("complemento"), // keep clickable
        };

        // 3. Prepare Batch Save Payload
        const batchAnswers: any[] = [];

        // Helper to update and lock
        const updateField = (
            q: Pergunta | undefined,
            val: string,
            lock = true,
        ) => {
            if (q) {
                answers.value[q.id_pergunta] = val;
                if (lock) lockedFields.value[q.id_pergunta] = true;
                batchAnswers.push({
                    id_pergunta: q.id_pergunta,
                    resposta: val,
                    nome_arquivo_original: "",
                });
                // Visually mark as saving/saved
                lastSaved.value[q.id_pergunta] = new Date().toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                );
            }
        };

        // Update fields
        updateField(question, cepValue, false); // Save CEP itself
        updateField(targets.endereco, data.logradouro);
        updateField(targets.bairro, data.bairro);
        updateField(targets.cidade, data.localidade);
        updateField(targets.estado, data.uf);
        updateField(targets.pais, "Brasil");

        // 4. Send Batch to BFF
        if (batchAnswers.length > 0) {
            await ofetch("/api/inscricao/save", {
                method: "POST",
                body: {
                    p_id_turma: courseId,
                    p_respostas_batch: batchAnswers, // New batch parameter
                },
            });
        }

        // Focus number field for UX
        if (targets.numero) {
            const numEl = document.getElementById(targets.numero.id_pergunta);
            if (numEl) numEl.focus();
        }
    } catch (err) {
        console.error("Erro ao buscar CEP:", err);
    } finally {
        loadingCep.value = false;
    }
};
</script>

<template>
    <NuxtLayout name="base">
        <div class="flex flex-col gap-8 pb-10">
            <!-- Header Section -->
            <div
                class="bg-div-15 rounded-lg p-4 md:p-8 border border-secondary/10 shadow-sm relative overflow-hidden"
            >
                <div
                    class="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"
                ></div>

                <div v-if="formData" class="relative z-10">
                    <div class="mb-1.5 md:mb-2">
                        <span
                            class="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded"
                        >
                            {{ formData.area }}
                        </span>
                    </div>
                    <h1
                        class="text-xl md:text-3xl font-black text-text mb-2 md:mb-4 leading-tight"
                    >
                        {{
                            isFabricaCulturaPilot
                                ? FABRICA_HEADER
                                : formData.curso
                        }}
                    </h1>

                    <div
                        class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm font-bold text-secondary"
                    >
                        <div class="flex items-center gap-2">
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                ></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            {{ formData.semestre }}
                        </div>
                        <div
                            v-if="formData.turno"
                            class="flex items-center gap-2"
                        >
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {{ formData.turno }}
                        </div>
                    </div>
                </div>
                <!-- Skeleton for Header while loading -->
                <div v-else class="relative z-10 animate-pulse">
                    <div class="h-4 w-20 bg-primary/10 rounded mb-4"></div>
                    <div class="h-10 w-3/4 bg-div-30 rounded mb-6"></div>
                    <div class="h-4 w-1/3 bg-div-30 rounded"></div>
                </div>
            </div>

            <!-- Dynamic Form Blocks -->
            <div>
                <!-- Tabs Navigation -->
                <div
                    class="flex items-center gap-4 overflow-x-auto pb-4 mb-4 custom-scrollbar-x border-b border-secondary/10"
                >
                    <template v-if="pending">
                        <div
                            v-for="i in 4"
                            :key="i"
                            class="h-10 w-24 bg-div-15 animate-pulse rounded-full"
                        ></div>
                    </template>
                    <template v-else>
                        <button
                            v-for="blockKey in activeBlocks"
                            :key="blockKey"
                            @click="goToTab(blockKey)"
                            class="whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 border"
                            :class="
                                activeTab === blockKey
                                    ? 'bg-primary text-white border-primary shadow-md'
                                    : 'bg-background text-secondary border-secondary/10 hover:bg-div-15'
                            "
                        >
                            {{ formatBlockName(blockKey) }}
                        </button>
                    </template>
                </div>

                <!-- Active Block Name (Mobile accessible title) -->
                <h2
                    class="text-xl font-black text-text mb-6 capitalize flex items-center gap-2 md:hidden"
                >
                    <div class="w-1 h-6 bg-primary rounded-full"></div>
                    {{ formatBlockName(activeTab) }}
                </h2>

                <form class="space-y-8" @submit.prevent>
                    <!-- Skeleton Loader for Form Body -->
                    <div
                        v-if="pending"
                        class="bg-background border border-secondary/10 rounded-lg p-8 shadow-sm space-y-8"
                    >
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div v-for="i in 4" :key="i" class="space-y-3">
                                <div
                                    class="h-4 w-24 bg-div-15 animate-pulse rounded"
                                ></div>
                                <div
                                    class="h-12 w-full bg-div-15 animate-pulse rounded-lg"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div
                        v-else-if="processedBlocks[activeTab]"
                        class="bg-transparent md:bg-background border-none md:border md:border-secondary/10 rounded-none md:rounded-lg p-0 md:p-8 shadow-none md:shadow-sm transition-all duration-300"
                    >
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <template
                                v-for="question in processedBlocks[activeTab]"
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
                                        :for="question.id_pergunta"
                                        class="text-sm font-bold text-secondary"
                                    >
                                        {{ question.label }}
                                        <span
                                            v-if="question.obrigatorio"
                                            class="text-primary"
                                            >*</span
                                        >
                                    </label>
                                    <p
                                        v-if="
                                            requiredMissing[
                                                question.id_pergunta
                                            ]
                                        "
                                        class="text-xs text-red-500 font-bold mt-1"
                                    >
                                        Resposta obrigatoria
                                    </p>
                                    <p
                                        v-if="fieldErrors[question.id_pergunta]"
                                        class="text-xs text-red-500 font-bold mt-1"
                                    >
                                        {{ fieldErrors[question.id_pergunta] }}
                                    </p>

                                    <!-- 1. Textarea (Height >= 120) -->
                                    <div
                                        v-if="
                                            question.tipo === 'texto' &&
                                            question.altura >= 120
                                        "
                                        class="group/field relative"
                                    >
                                        <p
                                            v-if="
                                                isFabricaCulturaPilot &&
                                                question.pergunta ===
                                                    CARTA_INTENCAO_SLUG
                                            "
                                            class="text-xs text-secondary/80 mb-2"
                                        >
                                            Neste espaco, conte para nos o
                                            porque a Danca e importante na sua
                                            vida, compartilhe sua relacao com a
                                            danca, suas experiencias e
                                            interesses.
                                        </p>
                                        <textarea
                                            :id="question.id_pergunta"
                                            v-model="
                                                answers[question.id_pergunta]
                                            "
                                            :placeholder="question.label"
                                            :readonly="
                                                lockedFields[
                                                    question.id_pergunta
                                                ]
                                            "
                                            :minlength="
                                                isFabricaCulturaPilot &&
                                                question.pergunta ===
                                                    CARTA_INTENCAO_SLUG
                                                    ? CARTA_INTENCAO_MIN
                                                    : undefined
                                            "
                                            :maxlength="
                                                isFabricaCulturaPilot &&
                                                question.pergunta ===
                                                    CARTA_INTENCAO_SLUG
                                                    ? CARTA_INTENCAO_MAX
                                                    : undefined
                                            "
                                            :style="{
                                                height: question.altura + 'px',
                                            }"
                                            @blur="
                                                !lockedFields[
                                                    question.id_pergunta
                                                ] && saveAnswer(question)
                                            "
                                            class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30 resize-none"
                                        ></textarea>
                                        <p
                                            v-if="
                                                isFabricaCulturaPilot &&
                                                question.pergunta ===
                                                    CARTA_INTENCAO_SLUG
                                            "
                                            class="text-[11px] text-secondary/70 mt-1 text-right"
                                        >
                                            {{
                                                getCartaLength(
                                                    question.id_pergunta,
                                                )
                                            }}
                                            /
                                            {{ CARTA_INTENCAO_MAX }} caracteres
                                        </p>
                                        <div
                                            class="absolute right-3 bottom-3 flex items-center gap-1.5 opacity-0 group-focus-within/field:opacity-100 transition-opacity"
                                        >
                                            <span
                                                v-if="
                                                    isSaving[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="text-[10px] text-primary animate-pulse font-bold"
                                                >Salvando...</span
                                            >
                                            <span
                                                v-else-if="
                                                    lastSaved[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="text-[10px] text-secondary/40 font-bold"
                                                >Salvo
                                                {{
                                                    lastSaved[
                                                        question.id_pergunta
                                                    ]
                                                }}</span
                                            >
                                        </div>
                                    </div>

                                    <!-- 2. Radio Buttons -->
                                    <div v-else-if="question.tipo === 'radio'">
                                        <div class="flex flex-col gap-2 mt-1">
                                            <label
                                                v-for="(
                                                    option, idx
                                                ) in getOptions(question)"
                                                :key="idx"
                                                class="flex items-center gap-3 p-3 rounded-md border border-secondary/10 bg-div-15 cursor-pointer hover:bg-div-30 transition-colors group"
                                            >
                                                <input
                                                    type="radio"
                                                    :name="question.id_pergunta"
                                                    :value="
                                                        typeof option ===
                                                        'object'
                                                            ? option.label ||
                                                              option.value
                                                            : option
                                                    "
                                                    v-model="
                                                        answers[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                    @change="
                                                        !lockedFields[
                                                            question.id_pergunta
                                                        ] &&
                                                        saveAnswer(question)
                                                    "
                                                    :disabled="
                                                        lockedFields[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                    class="w-4 h-4 text-primary border-secondary/30 focus:ring-primary bg-background"
                                                />
                                                <span
                                                    class="text-sm font-bold text-secondary group-hover:text-text transition-colors"
                                                >
                                                    {{
                                                        typeof option ===
                                                        "object"
                                                            ? option.label ||
                                                              option.value
                                                            : option
                                                    }}
                                                </span>
                                            </label>
                                        </div>
                                        <div class="mt-2 flex justify-end">
                                            <span
                                                v-if="
                                                    isSaving[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="text-[10px] text-primary animate-pulse font-bold"
                                                >Salvando...</span
                                            >
                                            <span
                                                v-else-if="
                                                    lastSaved[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="text-[10px] text-secondary/40 font-bold"
                                                >Salvo
                                                {{
                                                    lastSaved[
                                                        question.id_pergunta
                                                    ]
                                                }}</span
                                            >
                                        </div>
                                    </div>

                                    <!-- 3. Premium File Uploader -->
                                    <div
                                        v-else-if="question.tipo === 'arquivo'"
                                    >
                                        <div
                                            class="relative border-2 border-dashed border-secondary/20 rounded-lg p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer"
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
                                                    getFileTypes(question).join(
                                                        ',',
                                                    )
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
                                                    !fileNames[
                                                        question.id_pergunta
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
                                                    class="text-xs font-bold text-secondary tracking-tight"
                                                >
                                                    Clique ou arraste para
                                                    enviar arquivo
                                                </p>
                                                <p
                                                    class="text-[10px] text-secondary/40"
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
                                                            question.id_pergunta
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
                                                        class="text-xs font-bold text-text truncate max-w-full px-4"
                                                    >
                                                        {{
                                                            fileNames[
                                                                question
                                                                    .id_pergunta
                                                            ]
                                                        }}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
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
                                                                : "Remover arquivo"
                                                        }}
                                                    </button>
                                                </div>

                                                <div
                                                    v-else
                                                    class="w-full bg-div-15 border border-secondary/10 rounded-lg p-4 flex flex-col items-center gap-3"
                                                >
                                                    <p
                                                        class="text-sm font-bold text-text"
                                                    >
                                                        Tem certeza que deseja
                                                        remover este arquivo?
                                                    </p>
                                                    <div class="flex gap-3">
                                                        <button
                                                            type="button"
                                                            class="bg-danger text-white font-bold py-2 px-4 rounded-lg text-xs"
                                                            @click.stop="
                                                                performDeleteFile(
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
                                                                    : "Sim, remover"
                                                            }}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            class="bg-background border border-secondary/10 text-secondary font-bold py-2 px-4 rounded-lg text-xs"
                                                            @click.stop="
                                                                cancelConfirmDelete(
                                                                    question,
                                                                )
                                                            "
                                                            :disabled="
                                                                question.deleting
                                                            "
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 4. Boolean Toggle -->
                                    <div
                                        v-else-if="question.tipo === 'boolean'"
                                        class="group/field relative"
                                    >
                                        <div class="flex items-center gap-3">
                                            <label
                                                :for="
                                                    'bool-' +
                                                    question.id_pergunta
                                                "
                                                class="inline-flex items-center cursor-pointer"
                                            >
                                                <input
                                                    :id="
                                                        'bool-' +
                                                        question.id_pergunta
                                                    "
                                                    type="checkbox"
                                                    class="sr-only"
                                                    v-model="
                                                        answers[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                    @change="
                                                        !lockedFields[
                                                            question.id_pergunta
                                                        ] &&
                                                        saveAnswer(question)
                                                    "
                                                    :disabled="
                                                        lockedFields[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                />
                                                <div
                                                    :class="
                                                        answers[
                                                            question.id_pergunta
                                                        ]
                                                            ? 'bg-primary'
                                                            : 'bg-div-15'
                                                    "
                                                    class="w-12 h-6 rounded-full relative transition-colors"
                                                >
                                                    <span
                                                        :class="
                                                            answers[
                                                                question
                                                                    .id_pergunta
                                                            ]
                                                                ? 'translate-x-6'
                                                                : 'translate-x-0'
                                                        "
                                                        class="absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform"
                                                    ></span>
                                                </div>
                                            </label>
                                            <span
                                                class="text-sm font-bold text-secondary"
                                                >{{
                                                    answers[
                                                        question.id_pergunta
                                                    ]
                                                        ? "Sim"
                                                        : "Não"
                                                }}</span
                                            >
                                        </div>
                                    </div>

                                    <!-- 5. Generic Input (Fallback) -->
                                    <div v-else class="group/field relative">
                                        <div class="relative">
                                            <input
                                                :type="
                                                    getInputType(question.tipo)
                                                "
                                                :id="question.id_pergunta"
                                                v-model="
                                                    answers[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                :placeholder="question.label"
                                                :style="[
                                                    {
                                                        height:
                                                            question.altura +
                                                            'px',
                                                    },
                                                    question.tipo === 'data'
                                                        ? {
                                                              colorScheme:
                                                                  'dark',
                                                              accentColor:
                                                                  '#d60956',
                                                          }
                                                        : {},
                                                ]"
                                                :readonly="
                                                    lockedFields[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                @blur="
                                                    !lockedFields[
                                                        question.id_pergunta
                                                    ] &&
                                                    (question.pergunta === 'cep'
                                                        ? handleCepBlur(
                                                              question,
                                                          )
                                                        : question.pergunta ===
                                                                'data_de_nascimento' ||
                                                            question.pergunta ===
                                                                'data_nascimento'
                                                          ? handleNascimentoBlur(
                                                                question,
                                                            )
                                                          : saveAnswer(
                                                                question,
                                                            ))
                                                "
                                                class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                                :class="{
                                                    'pr-10':
                                                        question.pergunta ===
                                                            'cep' ||
                                                        lockedFields[
                                                            question.id_pergunta
                                                        ] ||
                                                        question.tipo ===
                                                            'data',
                                                    '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none':
                                                        question.tipo ===
                                                        'data',
                                                }"
                                            />

                                            <!-- Custom Calendar Icon -->
                                            <div
                                                v-if="question.tipo === 'data'"
                                                class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                >
                                                    <rect
                                                        x="3"
                                                        y="4"
                                                        width="18"
                                                        height="18"
                                                        rx="2"
                                                        ry="2"
                                                    ></rect>
                                                    <line
                                                        x1="16"
                                                        y1="2"
                                                        x2="16"
                                                        y2="6"
                                                    ></line>
                                                    <line
                                                        x1="8"
                                                        y1="2"
                                                        x2="8"
                                                        y2="6"
                                                    ></line>
                                                    <line
                                                        x1="3"
                                                        y1="10"
                                                        x2="21"
                                                        y2="10"
                                                    ></line>
                                                </svg>
                                            </div>

                                            <!-- CEP Loading Indicator -->
                                            <div
                                                v-if="
                                                    question.pergunta ===
                                                        'cep' && loadingCep
                                                "
                                                class="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                <svg
                                                    class="animate-spin h-4 w-4 text-primary"
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
                                            </div>

                                            <!-- Lock Icon for auto-filled fields -->
                                            <div
                                                v-if="
                                                    lockedFields[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40"
                                            >
                                                <svg
                                                    class="w-4 h-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                >
                                                    <rect
                                                        x="3"
                                                        y="11"
                                                        width="18"
                                                        height="11"
                                                        rx="2"
                                                        ry="2"
                                                    ></rect>
                                                    <path
                                                        d="M7 11V7a5 5 0 0 1 10 0v4"
                                                    ></path>
                                                </svg>
                                            </div>
                                        </div>

                                        <div
                                            class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-focus-within/field:opacity-100 transition-opacity pointer-events-none"
                                            v-if="!loadingCep"
                                        >
                                            <span
                                                v-if="
                                                    isSaving[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="text-[10px] text-primary animate-pulse font-bold"
                                                >Salvando...</span
                                            >
                                            <span
                                                v-else-if="
                                                    lastSaved[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="text-[10px] text-secondary/40 font-bold"
                                                >Salvo
                                                {{
                                                    lastSaved[
                                                        question.id_pergunta
                                                    ]
                                                }}</span
                                            >
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <!-- Action Buttons -->
                        <div
                            class="flex justify-between items-center pt-8 mt-4 border-t border-secondary/10"
                        >
                            <!-- Placeholder for Back Button if needed later -->
                            <div></div>

                            <div class="flex gap-4">
                                <!-- Next Button -->
                                <button
                                    v-if="!isLastBlock"
                                    type="button"
                                    @click="handleNext"
                                    class="bg-secondary text-white font-bold py-3 px-8 rounded-md text-xs uppercase tracking-wider shadow-md hover:bg-secondary/90 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    Avançar
                                    <svg
                                        class="w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <polyline
                                            points="9 18 15 12 9 6"
                                        ></polyline>
                                    </svg>
                                </button>

                                <!-- Submit Button (Last Block) -->
                                <button
                                    v-else
                                    type="button"
                                    @click="handleSubmit"
                                    :disabled="isSubmitting"
                                    class="bg-primary text-white font-bold py-3 px-8 rounded-md text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg
                                        v-if="isSubmitting"
                                        class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                    {{
                                        isSubmitting
                                            ? "Enviando..."
                                            : "Enviar Inscrição"
                                    }}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <template #sidebar>
            <!-- Widget: Meus Processos -->
            <div>
                <h4
                    class="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Meus Processos
                </h4>

                <!-- Mock: Fallback se não tiver processos -->
                <div
                    class="p-4 bg-background border border-secondary/5 rounded-md text-center"
                >
                    <div
                        class="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-3"
                    >
                        <svg
                            class="w-4 h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path
                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                            ></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <p class="text-[11px] font-bold text-text mb-1">
                        Primeira Inscrição?
                    </p>
                    <p class="text-[10px] text-secondary leading-relaxed">
                        Esta será sua primeira inscrição. Neste espaço você
                        poderá ver seus processos em aberto no futuro.
                    </p>
                </div>
            </div>
        </template>
    </NuxtLayout>
</template>

<style scoped>
/* Custom Horizontal Scrollbar for Dark Theme */
.custom-scrollbar-x::-webkit-scrollbar {
    height: 6px;
}

.custom-scrollbar-x::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.custom-scrollbar-x::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
}

.custom-scrollbar-x::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
}
</style>
