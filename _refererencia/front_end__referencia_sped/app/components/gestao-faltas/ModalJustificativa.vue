<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useAppStore } from "~/stores/app";
import { validateFileComplete } from "../../../utils/file-validator";
import { generateUuidFileName, fileToBase64 } from "../../../utils/file";
import BaseSelect from "~/components/BaseSelect.vue";
import { getAnoSemestre } from "../../../utils/ano_semestre";
import { fromZonedTime } from "date-fns-tz";

const props = defineProps<{
    isOpen: boolean;
    tipo: "atestado" | "justificativa";
}>();

const emit = defineEmits(["close", "success"]);

const store = useAppStore();

const apiFetch = async <T = any,>(
    url: string,
    options?: {
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        query?: Record<string, string | number | boolean | null | undefined>;
        body?: any;
    },
): Promise<T> => {
    const query = options?.query || {};
    const queryString = new URLSearchParams(
        Object.entries(query)
            .filter(([, value]) => value !== null && value !== undefined)
            .map(([key, value]) => [key, String(value)]),
    ).toString();

    const endpoint = queryString ? `${url}?${queryString}` : url;
    const response = await fetch(endpoint, {
        method: options?.method || "GET",
        headers: {
            "Content-Type": "application/json",
        },
        body:
            options?.body !== undefined
                ? JSON.stringify(options.body)
                : undefined,
    });

    if (!response.ok) {
        const fallbackMessage = `Erro na requisicao (${response.status})`;
        try {
            const errData = await response.json();
            throw new Error(
                errData?.statusMessage || errData?.message || fallbackMessage,
            );
        } catch {
            throw new Error(fallbackMessage);
        }
    }

    return (await response.json()) as T;
};

interface OpcaoNomeImpressao {
    tipo: "registro" | "social" | "artistico";
    label: string;
    valor: string | null;
    disponivel: boolean;
}

type NomeExibicaoModo = "registro" | "social" | "artistico";

// Confirmation Step
const confirmed = ref(false);
const justificativaWarningRead = ref(false);
const justificativaWarningConfirmed = ref(false);
const savingWarningConsent = ref(false);

// Form State
const texto = ref("");
const dataInicio = ref("");
const dataFim = ref("");
const file = ref<File | null>(null);
const dragging = ref(false);
const uploading = ref(false);
const saving = ref(false);
const errorMsg = ref<string | null>(null);
const nomeDocumentoOptions = ref<OpcaoNomeImpressao[]>([]);
const nomeDocumentoLoading = ref(false);
const selectedNomeDocumentoTipo = ref<NomeExibicaoModo>("registro");

// Selection State
const minhasTurmas = ref<any[]>([]);
const selectedAnoSemestre = ref<string | null>(getAnoSemestre());
const selectedTurmaId = ref<string | null>(null);
const loadingTurmas = ref(false);

// Computed Options
const anoSemestreOptions = computed(() => {
    if (!minhasTurmas.value.length) return [];

    // Extract unique ano_semestre
    const unique = [...new Set(minhasTurmas.value.map((t) => t.ano_semestre))];

    // Sort descending (newest first)
    return unique
        .sort()
        .reverse()
        .map((ano) => ({
            id: ano,
            nome: ano,
        }));
});

const turmasOptions = computed(() => {
    if (!selectedAnoSemestre.value) return [];

    return minhasTurmas.value
        .filter((t) => t.ano_semestre === selectedAnoSemestre.value)
        .map((t) => ({
            id: t.id_turma,
            nome: `${t.cod_turma} - ${t.nome_curso} (${t.turno})`,
        }));
});

const anoManualEstudante = computed(() => {
    const semestre = selectedAnoSemestre.value || "";
    const ano2 = semestre.slice(0, 2);
    return ano2 ? `20${ano2}` : String(new Date().getFullYear());
});

const nomeDocumentoCards = computed(() => {
    const labels: Record<NomeExibicaoModo, string> = {
        registro: "Nome de Registro",
        social: "Nome Social",
        artistico: "Nome Artístico",
    };

    const tipos: NomeExibicaoModo[] = ["registro", "social", "artistico"];
    return tipos.map((tipo) => {
        const match = nomeDocumentoOptions.value.find(
            (opcao) => opcao.tipo === tipo,
        );
        return {
            tipo,
            label: labels[tipo],
            valor: match?.valor || "Não informado",
            disponivel: !!(match?.disponivel && match?.valor),
        };
    });
});

const canShowForm = computed(() => {
    if (!confirmed.value) return false;
    if (props.tipo === "atestado") return true;
    return justificativaWarningConfirmed.value;
});

const getNomeAlunoRegistro = () => {
    return store.nome && store.sobrenome
        ? `${store.nome} ${store.sobrenome}`
        : store.nome || "NOME DO ALUNO";
};

const getNomeDocumentoSelecionado = () => {
    const opcao = nomeDocumentoCards.value.find(
        (item) =>
            item.tipo === selectedNomeDocumentoTipo.value && item.disponivel,
    );
    return opcao?.valor || getNomeAlunoRegistro();
};

const selectNomeDocumento = (tipo: NomeExibicaoModo) => {
    const opcao = nomeDocumentoCards.value.find((item) => item.tipo === tipo);
    if (!opcao?.disponivel) return;
    selectedNomeDocumentoTipo.value = tipo;
};

const fetchNomeDocumentoOptions = async () => {
    nomeDocumentoLoading.value = true;
    try {
        const data = await apiFetch<{
            ok: boolean;
            opcoes: OpcaoNomeImpressao[];
        }>("/api/avaliacao-gestao/opcoes-nome-impressao");
        nomeDocumentoOptions.value = data?.opcoes || [];

        const defaultOption = nomeDocumentoOptions.value.find(
            (opcao) =>
                opcao.tipo === "registro" && opcao.disponivel && !!opcao.valor,
        );
        if (defaultOption) {
            selectedNomeDocumentoTipo.value = "registro";
            return;
        }

        const firstAvailable = nomeDocumentoOptions.value.find(
            (opcao) => opcao.disponivel && !!opcao.valor,
        );
        selectedNomeDocumentoTipo.value = (firstAvailable?.tipo ||
            "registro") as NomeExibicaoModo;
    } catch (e) {
        console.error("Erro ao carregar opções de nome para documento:", e);
        nomeDocumentoOptions.value = [];
        selectedNomeDocumentoTipo.value = "registro";
    } finally {
        nomeDocumentoLoading.value = false;
    }
};

// Watch open state to reset form and fetch classes if needed
watch(
    () => props.isOpen,
    async (val) => {
        if (val) {
            // Reset confirmation step
            confirmed.value = false;
            justificativaWarningRead.value = false;
            justificativaWarningConfirmed.value = false;
            savingWarningConsent.value = false;

            // Reset Form
            texto.value = "";
            dataInicio.value = "";
            dataFim.value = "";
            file.value = null;
            errorMsg.value = null;
            uploading.value = false;
            saving.value = false;
            dragging.value = false;

            // Ensure we have classes loaded
            if (minhasTurmas.value.length === 0) {
                await fetchMinhasTurmas();
            }

            await fetchNomeDocumentoOptions();

            // Set default semester if not set
            if (
                !selectedAnoSemestre.value &&
                anoSemestreOptions.value?.length > 0
            ) {
                selectedAnoSemestre.value = anoSemestreOptions.value[0]?.id;
            }
        }
    },
);

// Watch semester to clear class or auto-select if only one
watch(selectedAnoSemestre, (newVal) => {
    selectedTurmaId.value = null;
    if (newVal && turmasOptions.value?.length === 1) {
        selectedTurmaId.value = turmasOptions.value[0]?.id; // Convenience auto-select
    }
});

const fetchMinhasTurmas = async () => {
    if (!store.user_expandido_id) return;
    // const fixedId = "e3a59153-ae54-408a-9d08-d07d04e6126d";

    loadingTurmas.value = true;
    try {
        const data = await apiFetch<any[]>("/api/matriculas/minhas-turmas", {
            query: { id_user_expandido: store.user_expandido_id },
        });
        minhasTurmas.value = data || [];
    } catch (e) {
        console.error("Erro ao buscar turmas:", e);
    } finally {
        loadingTurmas.value = false;
    }
};

const fetchPrintContext = async (idTurma: string) => {
    const data = await apiFetch<{
        rg: string;
        cpf: string;
        modulo: number;
        nome_curso: string;
        turno: string;
    }>("/api/matriculas/justificativas/print-context", {
        query: {
            id_user_expandido: store.user_expandido_id,
            id_turma: idTurma,
        },
    });

    return data;
};

// File Handling
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const f = target.files[0];
        if (f) processFile(f);
    }
};

const handleDrop = (event: DragEvent) => {
    dragging.value = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        const f = event.dataTransfer.files[0];
        if (f) processFile(f);
    }
};

const processFile = async (selectedFile: File) => {
    errorMsg.value = null;

    // Validação completa com detecção de corrupção
    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ];
    const validation = await validateFileComplete(selectedFile, allowedTypes);

    if (!validation.valid) {
        errorMsg.value =
            validation.error || "❌ Arquivo inválido. Tente novamente.";
        file.value = null;
        return;
    }

    // Arquivo validado com sucesso
    errorMsg.value = null;
    file.value = selectedFile;
};

const removeFile = () => {
    file.value = null;
};

// ... (imports)

// ...

// Signature State
const signaturePad = ref<HTMLCanvasElement | null>(null);
const signatureData = ref<string | null>(null);
const isDrawing = ref(false);

const startDrawing = (e: MouseEvent | TouchEvent) => {
    isDrawing.value = true;
    const canvas = signaturePad.value;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
    } else {
        const touch = e.touches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
};

const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing.value) return;
    const canvas = signaturePad.value;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
    } else {
        const touch = e.touches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
};

const stopDrawing = () => {
    isDrawing.value = false;
    saveSignature();
};

const clearSignature = () => {
    const canvas = signaturePad.value;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureData.value = null;
};

const saveSignature = () => {
    if (signaturePad.value) {
        signatureData.value = signaturePad.value.toDataURL("image/png");
    }
};

const formatDateLocal = (dateString: string) => {
    if (!dateString) return "--";
    const [y, m, d] = dateString.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return new Date(dateString).toLocaleDateString("pt-BR");
};

const printViaIframe = (htmlContent: string) => {
    const iframe = document.createElement("iframe");
    // Create a temporary container for rendering
    Object.assign(iframe.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "0",
        height: "0",
        border: "0",
        zIndex: "-9999",
    });
    document.body.appendChild(iframe);

    const doc =
        iframe.contentDocument ||
        (iframe.contentWindow && iframe.contentWindow.document);
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    const printNow = () => {
        if ((iframe as any)._hasPrinted) return;
        (iframe as any)._hasPrinted = true;

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 500);
    };

    const waitForImages = () => {
        const images = doc.getElementsByTagName("img");
        if (images.length === 0) {
            printNow();
            return;
        }

        let loadedCount = 0;
        const totalImages = images.length;
        const checkComplete = () => {
            loadedCount++;
            if (loadedCount >= totalImages) printNow();
        };

        for (let i = 0; i < totalImages; i++) {
            const img = images[i] as HTMLImageElement;
            if (!img) continue;
            if (img.complete) {
                checkComplete();
            } else {
                img.addEventListener("load", checkComplete);
                img.addEventListener("error", checkComplete);
            }
        }
    };

    iframe.onload = waitForImages;
    setTimeout(waitForImages, 1000);
};

// Helper to convert image URL to Base64
const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error fetching watermark image:", e);
        return "https://spedppull.b-cdn.net/site/sped_cabec_a.png"; // Fallback
    }
};

const generateJustificativaHTML = (
    item: any,
    signatureBase64: string,
    nomeAlunoImpressao: string,
    watermarkSrc: string = "https://spedppull.b-cdn.net/site/sped_cabec_a.png",
) => {
    const studentName = nomeAlunoImpressao || getNomeAlunoRegistro();
    const studentEmail = store.user?.email || "EMAIL DO ALUNO";
    const today = new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const formattedDateRange = `${formatDateLocal(item.data_inicio_janela)} a ${formatDateLocal(item.data_fim_janela)}`;
    const watermarkUrl = watermarkSrc;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Justificativa de Faltas</title>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
            * { box-sizing: border-box; font-family: 'Roboto', Arial, sans-serif; color: #000; -webkit-print-color-adjust: exact; }

            @page { size: A4; margin: 0; }
            html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; }

            .watermark-container {
                position: fixed;
                top: 0; left: 0; width: 210mm; height: 297mm; z-index: 0; overflow: hidden;
            }
            .watermark-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.2; }

            .content-wrapper {
                position: relative; z-index: 1;
                /* AJUSTE AQUI A ALTURA DO TEXTO (PADDING SUPERIOR) */
                padding: 25mm 20mm;
                width: 100%; height: 100%;
            }

            .header { text-align: center; margin-bottom: 40px; text-transform: uppercase; font-weight: bold; margin-top: 0; }
            .header h1 { font-size: 16px; margin: 5px 0; }
            .header h2 { font-size: 14px; margin: 5px 0; }
            .header h3 { font-size: 14px; margin: 20px 0 5px; text-decoration: underline; text-underline-offset: 4px; }

            .content { margin-bottom: 30px; text-align: justify; font-size: 12px; line-height: 1.6; }
            .content p { margin-bottom: 10px; }

            .justificativa-box {
                margin: 12px 0; font-weight: bold; text-transform: uppercase; border: 1px solid #000; padding: 15px;
                background: rgba(255,255,255,0.7); height: 120px; overflow: hidden; border-radius: 4px;
                font-size: 10px; line-height: 1.3;
            }

            .list-notes { margin-left: 20px; font-size: 11px; color: #333; }

            .signature-section { margin-top: 34px; text-align: center; break-inside: avoid; }
            .line { border-top: 1px solid #000; width: 300px; margin: 0 auto 5px; }
            .signature-label { font-size: 12px; font-weight: bold; }

            .coord-section { margin-top: 14px; border: 1px dashed #000; padding: 20px; break-inside: avoid; border-radius: 8px; background: rgba(255,255,255,0.6); }
            .coord-title { text-align: center; font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 20px; }

            .checkboxes { display: flex; gap: 60px; margin: 15px 0; font-weight: bold; font-size: 12px; justify-content: center; }
            .check-item { display: flex; align-items: center; gap: 5px; }
            .box { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="watermark-container"><img src="${watermarkUrl}" class="watermark-img" crossorigin="anonymous" /></div>
        <div class="content-wrapper">
            <div class="header">
                <h1>SÃO PAULO ESCOLA DE DANÇA</h1>
                <h2>CENTRO DE FORMAÇÃO EM ARTES COREOGRÁFICAS</h2>
                <h3>FORMULÁRIO DE SOLICITAÇÃO DE JUSTIFICATIVA DE FALTAS – CURSOS REGULARES</h3>
            </div>
            <div class="content">
                <p>
                    Eu <strong>${studentName.toUpperCase()}</strong>, inscrito(a) no RG <strong>${item.rg || "RG não informado"}</strong> e CPF <strong>${item.cpf || "CPF não informado"}</strong>,
                    justifico a minha falta no Curso Regular de <strong>${item.nome_curso || ""}</strong>, turno <strong>${item.turno || "Não informado"}</strong>, módulo <strong>${item.modulo || 1}</strong>, vinculado
                    aos Cursos Regulares da São Paulo Escola de Dança – Centro de Formação em Artes Coreográficas, conforme justificativa:
                </p>
                <div class="justificativa-box">${(item.texto || "").toUpperCase()}</div>
                <p><strong>Data da falta:</strong> ${formattedDateRange}</p>
                <p><strong>E-mail:</strong> ${studentEmail}</p>
                <p><strong>É OBRIGATÓRIO o comprovante da justificativa:</strong></p>
                <ul class="list-notes">
                    <li>Problemas com o transporte - retirar uma declaração da empresa de transporte/SAC,</li>
                    <li>Declarações de trabalhos, na área da dança - papel timbrado com assinatura GOV.br,</li>
                    <li>Folder - conter nome do estudante, data e horário da apresentação,</li>
                </ul>
                <p><strong>NÃO SÃO MOTIVOS de faltas justificadas:</strong></p>
                <ul class="list-notes">
                    <li>Trabalho sem a devida comprovação;</li>
                    <li>Trabalho em atividade distinta do campo formativo do estudante;</li>
                    <li>Afastamento por doença sem atestado médico;</li>
                    <li>Problemas individuais de acesso à São Paulo Escola de Dança;</li>
                    <li>Após 4 dias do ocorrido, <strong>não será possível realizar a devida justificativa</strong>.</li>
                </ul>
            </div>
            <div class="signature-section">
                <div style="height: 44px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 3px;">
                    ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 50px;">` : ""}
                </div>
                <div class="line"></div>
                <p class="signature-label">Assinatura do Estudante</p>
                <p>São Paulo, ${today}</p>
            </div>
            <div class="coord-section">
                <div class="coord-title">****************** Preenchimento da Coordenação ******************</div>
                <div class="checkboxes">
                    <span class="check-item"><span class="box"></span> Deferido</span>
                    <span class="check-item"><span class="box"></span> Indeferido</span>
                </div>
                <div class="checkboxes">
                    <span class="check-item"><span class="box"></span> COM Atividade de compensação</span>
                    <span class="check-item"><span class="box"></span> SEM atividade de compensação</span>
                </div>
                <div class="signature-section" style="margin-top: 60px;">
                    <div class="line"></div>
                    <p class="signature-label">Assinatura do(a) Coordenador(a) dos Cursos Regulares</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

const generateDocument = () => {
    if (!selectedTurmaId.value) return alert("Selecione uma turma");
    if (!texto.value) return alert("Descreva o motivo");
    if (!dataInicio.value || !dataFim.value) return alert("Selecione as datas");
    const signature: string = signatureData.value ?? "";
    if (!signature) return alert("Assine o documento antes de gerar");

    const turma = minhasTurmas.value.find(
        (t) => t.id_turma === selectedTurmaId.value,
    );
    const item = {
        nome_curso: turma?.nome_curso || "",
        cod_turma: turma?.cod_turma || "",
        turno: turma?.turno || "",
        texto: texto.value,
        data_inicio_janela: dataInicio.value,
        data_fim_janela: dataFim.value,
    };

    fetchPrintContext(selectedTurmaId.value)
        .then((ctx) => {
            const item = {
                nome_curso: ctx?.nome_curso || turma?.nome_curso || "",
                cod_turma: turma?.cod_turma || "",
                turno: ctx?.turno || turma?.turno || "",
                rg: ctx?.rg,
                cpf: ctx?.cpf,
                modulo: ctx?.modulo,
                texto: texto.value,
                data_inicio_janela: dataInicio.value,
                data_fim_janela: dataFim.value,
            };

            const html = generateJustificativaHTML(
                item,
                signature,
                getNomeDocumentoSelecionado(),
            );
            printViaIframe(html);
        })
        .catch((e) => {
            console.error("Erro ao montar contexto de impressao:", e);
            alert("Nao foi possivel preparar o texto da impressao.");
        });
};

import { jsPDF } from "jspdf";

const generatePdfBlob = async (
    item: any,
    signatureBase64: string,
    nomeAlunoImpressao: string,
): Promise<Blob> => {
    // 1. Fetch Watermark
    const watermarkBase64 = await imageUrlToBase64(
        "https://spedppull.b-cdn.net/site/sped_cabec_a.png",
    );

    // 2. Prepare Data
    const studentName = nomeAlunoImpressao || getNomeAlunoRegistro();
    const studentEmail = store.user?.email || "EMAIL DO ALUNO";
    const formattedDateRange = `${formatDateLocal(item.data_inicio_janela)} a ${formatDateLocal(item.data_fim_janela)}`;
    const today = new Date().toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // 3. Initialize jsPDF (A4)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Watermark (Background)
    if (watermarkBase64) {
        doc.addImage(
            watermarkBase64,
            "PNG",
            0,
            0,
            pageWidth,
            pageHeight,
            undefined,
            "FAST",
        );
    }

    // --- Content ---
    let y = 40; // Start Y

    // Header (Already in watermark? Assuming yes or plain text)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SÃO PAULO ESCOLA DE DANÇA", pageWidth / 2, y, {
        align: "center",
    });
    y += 5;
    doc.setFontSize(10);
    doc.text("CENTRO DE FORMAÇÃO EM ARTES COREOGRÁFICAS", pageWidth / 2, y, {
        align: "center",
    });
    y += 10;
    doc.setFontSize(11);
    doc.text(
        "FORMULÁRIO DE SOLICITAÇÃO DE JUSTIFICATIVA DE FALTAS",
        pageWidth / 2,
        y,
        { align: "center" },
    );
    y += 5;
    doc.text("CURSOS REGULARES", pageWidth / 2, y, { align: "center" });

    y += 15;

    // Body Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const bodyText = `Eu ${studentName.toUpperCase()}, inscrito(a) no RG ${item.rg || "RG não informado"} e CPF ${item.cpf || "CPF não informado"}, justifico a minha falta no Curso Regular de ${item.nome_curso || ""}, turno ${item.turno || "Não informado"}, módulo ${item.modulo || 1}, vinculado aos Cursos Regulares da São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas, conforme justificativa:`;

    const splitBody = doc.splitTextToSize(bodyText, contentWidth);
    doc.text(splitBody, margin, y);
    y += splitBody.length * 5 + 2;

    // Box Justificativa
    doc.setDrawColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentWidth, 23, "FD");

    const justificativaText = (item.texto || "").toUpperCase();
    const splitJust = doc.splitTextToSize(justificativaText, contentWidth - 4);
    doc.setFontSize(9);
    doc.text(splitJust, margin + 2, y + 5);

    y += 27;

    // Metadata
    doc.setFontSize(10);
    doc.text(`Data da falta: ${formattedDateRange}`, margin, y);
    y += 6;
    doc.text(`E-mail: ${studentEmail}`, margin, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("É OBRIGATÓRIO o comprovante da justificativa:", margin, y);
    y += 6;

    const requiredProofs = [
        "- Problemas com o transporte - retirar uma declaração da empresa de transporte/SAC,",
        "- Declarações de trabalhos, na área da dança - papel timbrado com assinatura GOV.br,",
        "- Folder - conter nome do estudante, data e horário da apresentação,",
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    requiredProofs.forEach((rule) => {
        doc.text(rule, margin + 5, y);
        y += 5;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("NÃO SÃO MOTIVOS de faltas justificadas:", margin, y);
    y += 6;

    const rules = [
        "- Trabalho sem a devida comprovação;",
        "- Trabalho em atividade distinta do campo formativo do estudante;",
        "- Afastamento por doença sem atestado médico;",
        "- Problemas individuais de acesso à São Paulo Escola de Dança;",
        "- Após 4 dias do ocorrido, não será possível realizar a devida justificativa.",
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    rules.forEach((rule) => {
        doc.text(rule, margin + 5, y);
        y += 5;
    });

    y += 10;

    // Signature
    if (signatureBase64) {
        doc.addImage(signatureBase64, "PNG", pageWidth / 2 - 25, y, 50, 20);
        y += 15;
    } else {
        y += 20; // Space for signature
    }

    doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y); // Line
    y += 5;
    doc.setFontSize(10);
    doc.text("Assinatura do Estudante", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.text(`São Paulo, ${today}`, pageWidth / 2, y, { align: "center" });

    // Coordination Section
    y += 6;
    (doc as any).setLineDash([1, 1], 0);
    doc.setDrawColor(0);
    // Reduced height to 55 (less internal padding, but enough for content)
    doc.rect(margin, y, contentWidth, 55);
    (doc as any).setLineDash([], 0); // Reset dash

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
        "****************** Preenchimento da Coordenação ******************",
        pageWidth / 2,
        y,
        { align: "center" },
    );

    y += 12;
    // Deferido / Indeferido
    doc.rect(margin + 20, y - 3, 3, 3);
    doc.text("Deferido", margin + 25, y);
    doc.rect(margin + 80, y - 3, 3, 3);
    doc.text("Indeferido", margin + 85, y);

    y += 10;
    // Compensacao
    doc.rect(margin + 20, y - 3, 3, 3);
    doc.text("COM Atividade de compensação", margin + 25, y);
    doc.rect(margin + 80, y - 3, 3, 3);
    doc.text("SEM atividade de compensação", margin + 85, y);

    y += 15;
    doc.line(pageWidth / 2 - 60, y, pageWidth / 2 + 60, y);
    y += 4;
    doc.text("Assinatura do(a) Coordenador(a)", pageWidth / 2, y, {
        align: "center",
    });

    return doc.output("blob");
};

const submit = async () => {
    if (!store.user_expandido_id) {
        errorMsg.value = "Usuário não identificado.";
        return;
    }

    if (!selectedTurmaId.value) {
        errorMsg.value = "Por favor, selecione uma turma.";
        return;
    }
    if (!texto.value) {
        errorMsg.value = "Por favor, descreva o motivo.";
        return;
    }
    if (!dataInicio.value || !dataFim.value) {
        errorMsg.value = "Por favor, selecione o período.";
        return;
    }

    // Validate dates
    if (new Date(dataFim.value) < new Date(dataInicio.value)) {
        errorMsg.value = "Data final não pode ser anterior à data inicial.";
        return;
    }
    if (!file.value) {
        errorMsg.value = "Por favor, anexe o comprovante obrigatório.";
        return;
    }

    saving.value = true;
    errorMsg.value = null;
    let uploadedFilePath = null;
    let uploadedFichaPath = null;

    try {
        uploading.value = true;

        // 1. Upload Attachment (if exists)
        if (file.value) {
            try {
                const f = file.value as File;
                const base64 = await fileToBase64(f);
                if (!base64) {
                    throw new Error(
                        "Base64 vazio - arquivo pode estar corrompido",
                    );
                }

                const uuidName = generateUuidFileName(f.name);
                const uploadRes = await apiFetch<{ path: string }>(
                    "/api/matriculas/justificativas/upload",
                    {
                        method: "POST",
                        body: {
                            fileBase64: base64,
                            fileName: uuidName,
                        },
                    },
                );

                uploadedFilePath = uploadRes.path;
            } catch (e: any) {
                throw new Error(
                    `Erro ao processar arquivo: ${e?.message || "conversion Base64 falhou"}`,
                );
            }
        }

        // 2. Gerar e fazer upload da ficha assinada
        if (signatureData.value) {
            if (props.tipo !== "atestado") {
                // Justificativa: gera PDF client-side (fluxo existente)
                const turma = minhasTurmas.value.find(
                    (t) => t.id_turma === selectedTurmaId.value,
                );
                const ctx = await fetchPrintContext(selectedTurmaId.value!);
                const item = {
                    nome_curso: ctx?.nome_curso || turma?.nome_curso || "",
                    cod_turma: turma?.cod_turma || "",
                    turno: ctx?.turno || turma?.turno || "",
                    rg: ctx?.rg,
                    cpf: ctx?.cpf,
                    modulo: ctx?.modulo,
                    texto: texto.value,
                    data_inicio_janela: dataInicio.value,
                    data_fim_janela: dataFim.value,
                };

                // Client-side generation (with Base64 watermark)
                const pdfBlob = await generatePdfBlob(
                    item,
                    signatureData.value,
                    getNomeDocumentoSelecionado(),
                );

                // Upload (Convert to File -> Base64)
                const pdfFile = new File([pdfBlob], "ficha_justificativa.pdf", {
                    type: "application/pdf",
                });
                const base64 = await fileToBase64(pdfFile);
                const uuidName = generateUuidFileName(pdfFile.name);

                const uploadRes = await apiFetch<{ path: string }>(
                    "/api/matriculas/justificativas/upload",
                    {
                        method: "POST",
                        body: { fileBase64: base64, fileName: uuidName },
                    },
                );

                uploadedFichaPath = uploadRes.path;
            } else {
                // Atestado: gera HTML no backend silenciosamente (aluno não tem acesso)
                const fichaRes = await apiFetch<{ caminho_ficha: string }>(
                    "/api/matriculas/justificativas/gerar-ficha",
                    {
                        method: "POST",
                        body: {
                            id_user_expandido: store.user_expandido_id,
                            id_turma: selectedTurmaId.value,
                            texto: texto.value,
                            data_inicio_janela: fromZonedTime(
                                dataInicio.value + " 00:00:00",
                                "America/Sao_Paulo",
                            ).toISOString(),
                            data_fim_janela: fromZonedTime(
                                dataFim.value + " 23:59:59",
                                "America/Sao_Paulo",
                            ).toISOString(),
                            assinatura_base64: signatureData.value,
                            nome_exibicao: getNomeDocumentoSelecionado(),
                            escopo: "atestado",
                        },
                    },
                );

                uploadedFichaPath = fichaRes.caminho_ficha;
            }
        }

        // 3. Save Justificativa
        await apiFetch("/api/matriculas/justificativas", {
            method: "POST",
            body: {
                id_aluno: store.user_expandido_id,
                id_turma: selectedTurmaId.value,
                texto: texto.value,
                escopo: props.tipo,
                aceite_termo_justificativa:
                    props.tipo === "justificativa"
                        ? justificativaWarningConfirmed.value
                        : false,
                nome_exibicao_tipo: selectedNomeDocumentoTipo.value,
                nome_exibicao: getNomeDocumentoSelecionado(),
                data_inicio_janela: fromZonedTime(
                    dataInicio.value + " 00:00:00",
                    "America/Sao_Paulo",
                ).toISOString(),
                data_fim_janela: fromZonedTime(
                    dataFim.value + " 23:59:59",
                    "America/Sao_Paulo",
                ).toISOString(),
                arquivo: uploadedFilePath,
                caminho_ficha: uploadedFichaPath,
            },
        });
        emit("success");
        emit("close");
    } catch (e: any) {
        console.error("Erro ao enviar:", e);

        // Mensagens de erro específicas por tipo
        let mensagem = "❌ Erro ao salvar solicitação. Tente novamente.";

        if (e?.message?.includes("Base64")) {
            mensagem =
                "❌ Falha ao processar arquivo. Arquivo corrompido ou não suportado. Tente com outro arquivo.";
        } else if (e?.message?.includes("conversion")) {
            mensagem =
                "❌ Não foi possível converter o arquivo. Tente novamente com um arquivo válido.";
        } else if (
            e?.message?.includes("network") ||
            e?.message?.includes("offline")
        ) {
            mensagem =
                "❌ Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (e?.message) {
            mensagem = `❌ ${e.message}`;
        }

        errorMsg.value = mensagem;
    } finally {
        saving.value = false;
        uploading.value = false;
    }
};

const close = () => {
    emit("close");
};

const proceedInitialStep = () => {
    confirmed.value = true;
};

const backToInitialStep = () => {
    confirmed.value = false;
    justificativaWarningRead.value = false;
    savingWarningConsent.value = false;
};

const confirmJustificativaWarning = async () => {
    if (!justificativaWarningRead.value || !store.user_expandido_id) {
        errorMsg.value =
            "Confirme a leitura do aviso obrigatório para continuar.";
        return;
    }

    savingWarningConsent.value = true;
    errorMsg.value = null;

    justificativaWarningConfirmed.value = true;
    savingWarningConsent.value = false;
};
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm"
    >
        <div
            class="bg-[#1A1A24] border-none md:border md:border-white/10 rounded-none md:rounded-lg w-full md:max-w-2xl overflow-hidden shadow-none md:shadow-2xl transform transition-all h-full md:h-auto max-h-[100dvh] md:max-h-[85vh] flex flex-col"
        >
            <!-- Header -->
            <div
                class="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0"
            >
                <div class="flex flex-col gap-1">
                    <span
                        class="text-[10px] uppercase font-bold tracking-wider text-primary"
                        >{{
                            tipo === "atestado"
                                ? "Atestado Médico"
                                : "Justificativa de Falta"
                        }}</span
                    >
                    <h3 class="text-xl font-bold text-white">
                        Nova Solicitação
                    </h3>
                </div>
                <button
                    @click="close"
                    class="text-secondary hover:text-white transition-colors"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <!-- Confirmation Screen -->
            <div
                v-if="!confirmed"
                class="p-4 md:p-8 flex flex-col gap-5 grow overflow-y-auto custom-scrollbar [touch-action:pan-y] justify-start md:justify-center"
            >
                <!-- Icon -->
                <div class="flex justify-center">
                    <div
                        class="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center"
                        :class="
                            tipo === 'justificativa'
                                ? 'bg-yellow-500/10'
                                : 'bg-blue-500/10'
                        "
                    >
                        <svg
                            v-if="tipo === 'justificativa'"
                            class="w-6 h-6 md:w-7 md:h-7 text-yellow-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                        </svg>
                        <svg
                            v-else
                            class="w-6 h-6 md:w-7 md:h-7 text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                </div>

                <!-- Title -->
                <div class="text-center">
                    <p
                        class="text-[10px] uppercase font-bold tracking-widest mb-1"
                        :class="
                            tipo === 'justificativa'
                                ? 'text-yellow-400'
                                : 'text-blue-400'
                        "
                    >
                        Confirmação de Envio
                    </p>
                    <h4 class="text-lg font-bold text-white">
                        Atenção antes de prosseguir
                    </h4>
                </div>

                <!-- Warning Box -->
                <div
                    class="rounded-xl border p-4 md:p-5 space-y-4 text-sm"
                    :class="
                        tipo === 'justificativa'
                            ? 'bg-yellow-500/5 border-yellow-500/20'
                            : 'bg-blue-500/5 border-blue-500/20'
                    "
                >
                    <p class="text-white/90 leading-relaxed">
                        Antes de avançar, confirme: o que você vai enviar é
                        <template v-if="tipo === 'justificativa'">
                            uma
                            <strong class="text-white">Justificativa</strong>
                            (ex: declaração de trabalho, problema técnico,
                            motivo particular com comprovante) ou um
                            <strong class="text-white">Atestado Médico</strong>?
                        </template>
                        <template v-else>
                            um
                            <strong class="text-white">Atestado Médico</strong>
                            (documento emitido por médico ou instituição de
                            saúde) ou uma
                            <strong class="text-white">Justificativa</strong>
                            (ex: declaração de trabalho, problema técnico)?
                        </template>
                    </p>

                    <div class="space-y-2">
                        <div class="flex items-start gap-2">
                            <span
                                class="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-black"
                                >✓</span
                            >
                            <p class="text-white/80">
                                <template v-if="tipo === 'justificativa'">
                                    Se for
                                    <strong class="text-white"
                                        >Justificativa</strong
                                    >: clique em
                                    <strong class="text-white"
                                        >Prosseguir</strong
                                    >.
                                </template>
                                <template v-else>
                                    Se for
                                    <strong class="text-white"
                                        >Atestado Médico</strong
                                    >: clique em
                                    <strong class="text-white"
                                        >Prosseguir</strong
                                    >.
                                </template>
                            </p>
                        </div>
                        <div class="flex items-start gap-2">
                            <span
                                class="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[10px] font-black"
                                >✕</span
                            >
                            <p class="text-white/80">
                                <template v-if="tipo === 'justificativa'">
                                    Se for
                                    <strong class="text-white"
                                        >Atestado Médico</strong
                                    >: saia deste modal e acesse a aba
                                    <strong class="text-white"
                                        >"Atestados"</strong
                                    >.
                                </template>
                                <template v-else>
                                    Se for
                                    <strong class="text-white"
                                        >Justificativa</strong
                                    >: saia deste modal e acesse a aba
                                    <strong class="text-white"
                                        >"Justificativas"</strong
                                    >.
                                </template>
                            </p>
                        </div>
                    </div>

                    <p
                        class="text-red-400 font-bold text-xs border-t pt-3"
                        :class="
                            tipo === 'justificativa'
                                ? 'border-yellow-500/20'
                                : 'border-blue-500/20'
                        "
                    >
                        ⚠ Documentos enviados no local incorreto serão
                        indeferidos e precisarão ser reenviados.
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-3 mt-auto pt-2">
                    <button
                        @click="close"
                        class="flex-1 py-3 text-xs uppercase tracking-wider font-bold text-secondary bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
                    >
                        Sair
                    </button>
                    <button
                        @click="proceedInitialStep"
                        class="flex-1 py-3 text-xs uppercase tracking-wider font-bold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors shadow-lg shadow-primary/20"
                    >
                        Prosseguir
                    </button>
                </div>
            </div>

            <div
                v-else-if="
                    tipo === 'justificativa' && !justificativaWarningConfirmed
                "
                class="p-4 md:p-8 flex flex-col gap-5 grow overflow-y-auto custom-scrollbar [touch-action:pan-y]"
            >
                <div class="text-center">
                    <p
                        class="text-[10px] uppercase font-bold tracking-widest mb-1 text-red-300"
                    >
                        Aviso Obrigatório
                    </p>
                    <h4 class="text-lg font-bold text-white">
                        Comprovantes e regras para justificativa
                    </h4>
                </div>

                <div
                    class="rounded-xl border border-red-500/25 bg-red-500/10 p-4 md:p-5 space-y-4 text-sm"
                >
                    <p class="text-red-100 font-bold uppercase tracking-wide">
                        É OBRIGATÓRIO o comprovante da justificativa:
                    </p>
                    <ul class="space-y-2 text-white/90 list-disc pl-5">
                        <li>
                            Problemas com o transporte - retirar uma declaração
                            da empresa de transporte/SAC;
                        </li>
                        <li>
                            Declarações de trabalhos, na área da dança - papel
                            timbrado com assinatura GOV.br;
                        </li>
                        <li>
                            Folder - conter nome do estudante, data e horário da
                            apresentação.
                        </li>
                    </ul>

                    <p
                        class="text-red-100 font-bold uppercase tracking-wide pt-2 border-t border-red-400/25"
                    >
                        NÃO SÃO MOTIVOS de faltas justificadas:
                    </p>
                    <ul class="space-y-2 text-white/90 list-disc pl-5">
                        <li>Trabalho sem a devida comprovação;</li>
                        <li>
                            Trabalho em atividade distinta do campo formativo do
                            estudante;
                        </li>
                        <li>Afastamento por doença sem atestado médico;</li>
                        <li>
                            Problemas individuais de acesso à São Paulo Escola
                            de Dança;
                        </li>
                        <li>
                            Após 4 dias do ocorrido, não será possível realizar
                            a devida justificativa.
                        </li>
                    </ul>
                </div>

                <button
                    type="button"
                    class="w-full rounded-lg border px-4 py-3 flex items-center justify-between gap-3 transition-all"
                    :class="
                        justificativaWarningRead
                            ? 'bg-primary/10 border-primary/40'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                    "
                    @click="
                        justificativaWarningRead = !justificativaWarningRead
                    "
                >
                    <span class="text-sm text-left text-white/90"
                        >Declaro que li e compreendi os critérios acima para
                        envio de justificativa.</span
                    >
                    <div
                        class="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
                        :class="
                            justificativaWarningRead
                                ? 'bg-primary'
                                : 'bg-gray-600'
                        "
                    >
                        <div
                            class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm"
                            :class="
                                justificativaWarningRead ? 'translate-x-4' : ''
                            "
                        ></div>
                    </div>
                </button>

                <div class="flex flex-col sm:flex-row gap-3 mt-auto pt-2">
                    <button
                        @click="backToInitialStep"
                        class="flex-1 py-3 text-xs uppercase tracking-wider font-bold text-secondary bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
                    >
                        Voltar
                    </button>
                    <button
                        @click="confirmJustificativaWarning"
                        :disabled="
                            !justificativaWarningRead || savingWarningConsent
                        "
                        class="flex-1 py-3 text-xs uppercase tracking-wider font-bold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {{
                            savingWarningConsent
                                ? "Validando..."
                                : "Li e desejo continuar"
                        }}
                    </button>
                </div>
            </div>

            <!-- Body -->
            <div
                v-if="canShowForm"
                class="p-4 md:p-6 space-y-5 overflow-y-auto custom-scrollbar [touch-action:pan-y] grow"
            >
                <div
                    class="rounded-xl border border-primary/20 bg-primary/10 px-4 py-4 md:px-5 md:py-4 shadow-sm shadow-primary/5"
                >
                    <p
                        class="text-[11px] font-black uppercase tracking-[0.18em] text-primary mb-2"
                    >
                        Aviso importante
                    </p>
                    <p class="text-sm leading-6 text-white/90">
                        Conforme o Manual de Estudante
                        {{ anoManualEstudante }} (Seção 15 – Abono de Falta),
                        atestados médicos ou declarações de comparecimento devem
                        ser enviados pela plataforma em até 48 horas a partir da
                        sua emissão. Fora deste prazo, não serão aceitos.
                    </p>
                </div>

                <!-- Selectors (Ano/Semestre & Turma) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label
                            class="text-xs text-secondary font-bold uppercase tracking-wider"
                            >Período</label
                        >
                        <BaseSelect
                            v-model="selectedAnoSemestre"
                            :options="anoSemestreOptions"
                            placeholder="Selecione..."
                        />
                    </div>
                    <div class="space-y-1">
                        <label
                            class="text-xs text-secondary font-bold uppercase tracking-wider"
                            >Turma</label
                        >
                        <BaseSelect
                            v-model="selectedTurmaId"
                            :options="turmasOptions"
                            label-key="nome"
                            value-key="id"
                            placeholder="Selecione a turma..."
                            :disabled="!selectedAnoSemestre"
                        />
                    </div>
                </div>

                <!-- Período Datas -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1 relative group">
                        <label
                            class="text-xs text-secondary font-bold uppercase tracking-wider"
                            >Data Início</label
                        >
                        <div class="relative">
                            <input
                                v-model="dataInicio"
                                type="date"
                                class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                :style="{
                                    colorScheme: 'dark',
                                    accentColor: '#d60956',
                                }"
                            />
                            <div
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
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-1 relative group">
                        <label
                            class="text-xs text-secondary font-bold uppercase tracking-wider"
                            >Data Fim</label
                        >
                        <div class="relative">
                            <input
                                v-model="dataFim"
                                type="date"
                                class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                :style="{
                                    colorScheme: 'dark',
                                    accentColor: '#d60956',
                                }"
                            />
                            <div
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
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Texto -->
                <div class="space-y-1">
                    <label
                        class="text-xs text-secondary font-bold uppercase tracking-wider"
                        >Motivo / Descrição</label
                    >
                    <textarea
                        v-model="texto"
                        rows="4"
                        class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors resize-none placeholder-secondary/30"
                        placeholder="Descreva o motivo da ausência..."
                    ></textarea>
                </div>

                <div class="space-y-2">
                    <label
                        class="text-xs text-secondary font-bold uppercase tracking-wider"
                        >Nome no Documento</label
                    >
                    <div
                        v-if="nomeDocumentoLoading"
                        class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm text-secondary/80"
                    >
                        Carregando opções de nome...
                    </div>
                    <div v-else class="space-y-2">
                        <button
                            v-for="opcao in nomeDocumentoCards"
                            :key="opcao.tipo"
                            type="button"
                            class="w-full text-left rounded-lg border px-4 py-3 transition-colors"
                            :class="[
                                opcao.disponivel
                                    ? 'hover:border-primary/50 hover:bg-primary/5'
                                    : 'opacity-60 cursor-not-allowed',
                                selectedNomeDocumentoTipo === opcao.tipo &&
                                opcao.disponivel
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 bg-div-15',
                            ]"
                            :disabled="!opcao.disponivel"
                            @click="selectNomeDocumento(opcao.tipo)"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <p
                                        class="text-[10px] font-black uppercase tracking-wider text-secondary"
                                    >
                                        {{ opcao.label }}
                                    </p>
                                    <p
                                        class="text-sm text-white mt-1 break-words"
                                    >
                                        {{ opcao.valor }}
                                    </p>
                                </div>
                                <span
                                    v-if="
                                        selectedNomeDocumentoTipo ===
                                            opcao.tipo && opcao.disponivel
                                    "
                                    class="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black"
                                >
                                    ✓
                                </span>
                            </div>
                        </button>
                    </div>
                    <p
                        class="text-[11px] text-secondary/70"
                        v-if="
                            nomeDocumentoCards.every(
                                (item) => !item.disponivel,
                            ) && !nomeDocumentoLoading
                        "
                    >
                        Nenhuma opção alternativa disponível. O documento usará
                        o nome de registro do cadastro.
                    </p>
                </div>

                <!-- Signature Section (obrigatória para atestado e justificativa) -->
                <div class="space-y-2">
                    <label
                        class="text-xs text-secondary font-bold uppercase tracking-wider"
                        >Assinatura do Estudante</label
                    >
                    <div
                        class="border border-secondary/10 rounded-md overflow-hidden bg-white relative"
                    >
                        <canvas
                            ref="signaturePad"
                            width="500"
                            height="150"
                            class="w-full h-[150px] cursor-crosshair touch-none"
                            @mousedown="startDrawing"
                            @mousemove="draw"
                            @mouseup="stopDrawing"
                            @mouseleave="stopDrawing"
                            @touchstart.prevent="startDrawing"
                            @touchmove.prevent="draw"
                            @touchend.prevent="stopDrawing"
                        ></canvas>
                        <button
                            v-if="signatureData"
                            @click="clearSignature"
                            class="absolute top-2 right-2 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded hover:bg-red-500/20"
                        >
                            Limpar
                        </button>
                        <div
                            v-if="!isDrawing && !signatureData"
                            class="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400 text-sm"
                        >
                            Assine aqui
                        </div>
                    </div>
                </div>

                <!-- Print Button (Only if signed AND not atestado) -->
                <div
                    v-if="tipo !== 'atestado' && signatureData"
                    class="flex justify-start"
                >
                    <button
                        @click="generateDocument"
                        class="w-full py-3 text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2zm9-2V4a2 2 0 00-2-2H5a2 2 0 00-2-2v4"
                            ></path>
                        </svg>
                        Imprimir Documento Assinado
                    </button>
                </div>

                <!-- Arquivo (Premium Style) -->
                <div class="space-y-1">
                    <label
                        class="text-xs text-secondary font-bold uppercase tracking-wider"
                        >Anexo <span class="text-red-400">*</span></label
                    >

                    <div
                        class="relative border-2 border-dashed rounded-lg p-6 transition-all group text-center cursor-pointer"
                        :class="
                            dragging
                                ? 'border-primary bg-primary/10'
                                : 'border-white/10 hover:border-primary/40 hover:bg-primary/5 bg-div-15'
                        "
                        @click="
                            () =>
                                !file &&
                                ($refs.fileInput as HTMLInputElement).click()
                        "
                        @dragover.prevent="dragging = true"
                        @dragleave.prevent="dragging = false"
                        @drop.prevent="handleDrop"
                    >
                        <input
                            ref="fileInput"
                            type="file"
                            @change="handleFileChange"
                            class="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                        />

                        <!-- Empty State -->
                        <div
                            v-if="!file"
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
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>
                            <p
                                class="text-xs font-bold text-secondary tracking-tight"
                            >
                                Clique ou arraste para enviar arquivo
                            </p>
                            <p class="text-[10px] text-secondary/40">
                                PDF, JPG, PNG (Max 4MB)
                            </p>
                        </div>

                        <!-- Selected State -->
                        <div
                            v-else
                            class="flex flex-col items-center gap-2 w-full"
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
                                    <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                            </div>
                            <p
                                class="text-xs font-bold text-white truncate max-w-full px-4"
                            >
                                {{ file.name }}
                            </p>
                            <button
                                @click.stop="removeFile"
                                class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
                            >
                                Remover arquivo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                v-if="canShowForm"
                class="border-t border-white/5 bg-[#16161E] shrink-0"
            >
                <Transition
                    enter-active-class="transition-all duration-200"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition-all duration-150"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-1"
                >
                    <div
                        v-if="errorMsg"
                        class="px-4 md:px-6 pt-3 pb-0 text-red-400 text-xs text-center font-semibold flex items-center justify-center gap-1.5"
                    >
                        <svg
                            class="w-3.5 h-3.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                        </svg>
                        {{ errorMsg }}
                    </div>
                </Transition>
                <div class="p-4 md:p-6">
                    <button
                        @click="submit"
                        :disabled="saving || !signatureData"
                        :class="[
                            'w-full py-3 text-xs uppercase tracking-wider font-bold text-white rounded-md transition-colors shadow-lg flex items-center justify-center gap-2',
                            signatureData
                                ? 'bg-primary hover:bg-primary-hover shadow-primary/20'
                                : 'bg-white/5 text-white/40 cursor-not-allowed',
                        ]"
                    >
                        <svg
                            v-if="saving"
                            class="animate-spin h-4 w-4 text-white"
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
                            saving
                                ? "Gerando Documento..."
                                : "Confirmar Solicitação"
                        }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
