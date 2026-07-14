<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useAppStore } from "~/stores/app";
import BaseSelect from "~/components/BaseSelect.vue";
import {
    getAnoSemestre,
    getAnoSemestreList,
} from "../../../utils/ano_semestre";

import { useToast } from "../../../composables/useToast";

const props = defineProps<{
    isOpen: boolean;
    declaracoesAnteriores?: any[];
}>();

const emit = defineEmits(["close", "success"]);
const store = useAppStore();
const { showToast } = useToast();

// State
const isLoading = ref(false);
const submitting = ref(false);
const minhasTurmas = ref<any[]>([]);

// Form State
const selectedAnoSemestre = ref<string>(getAnoSemestre());
const selectedTurmaId = ref<string | null>(null);

// Computeds
const anoSemestreOptions = computed(() => getAnoSemestreList(5));

const turmasOptions = computed(() => {
    if (!selectedAnoSemestre.value) return [];

    return minhasTurmas.value
        .filter((t) => t.ano_semestre === selectedAnoSemestre.value)
        .map((t) => ({
            id: t.id_turma,
            nome: `${t.cod_turma} - ${t.nome_curso} (${t.turno})`,
        }));
});

// Watchers
watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            // Reset or Fetch
            if (minhasTurmas.value.length === 0) {
                fetchMinhasTurmas();
            }
            selectedAnoSemestre.value = getAnoSemestre();
            selectedTurmaId.value = null;
        }
    },
);

watch(selectedAnoSemestre, (newVal) => {
    // Reset turma when semester changes
    selectedTurmaId.value = null;

    // Auto-select first class if available for new semester
    if (newVal && turmasOptions.value.length > 0) {
        selectedTurmaId.value = turmasOptions.value[0]?.id;
    }
});

// Also watch options logic: if options change (e.g. after fetch) and we have a semester but no class selected, auto select first
watch(turmasOptions, (newOptions) => {
    if (newOptions.length > 0 && !selectedTurmaId.value) {
        selectedTurmaId.value = newOptions[0]?.id;
    }
});

// Actions
const fetchDadosDeclaracao = async () => {
    if (!store.user_expandido_id)
        return { cpf: "000.000.000-00", ra: "RA não encontrado" };

    try {
        const data = await ofetch("/api/aluno/dados-declaracao", {
            params: { id_user_expandido: store.user_expandido_id },
        });
        return data || { cpf: "000.000.000-00", ra: "RA não encontrado" };
    } catch (e) {
        console.error("Erro ao buscar dados do aluno:", e);
        return { cpf: "000.000.000-00", ra: "RA não encontrado" };
    }
};

const fetchUserMe = async () => {
    try {
        const data: any = await ofetch("/api/me");
        if (data && data.nome && data.sobrenome) {
            return `${data.nome} ${data.sobrenome}`;
        }
        return store.user?.user_metadata?.full_name || "Nome Sobrenome";
    } catch (e) {
        console.error("Erro ao buscar dados do usuário (me):", e);
        return store.user?.user_metadata?.full_name || "Nome Sobrenome";
    }
};

const fetchMinhasTurmas = async () => {
    if (!store.user_expandido_id) return;

    isLoading.value = true;
    try {
        const data = await ofetch("/api/matriculas/minhas-turmas", {
            params: { id_user_expandido: store.user_expandido_id },
        });
        minhasTurmas.value = data || [];

        // Initial auto-select logic
        if (selectedAnoSemestre.value && turmasOptions.value.length > 0) {
            selectedTurmaId.value = turmasOptions.value[0]?.id;
        }
    } catch (e) {
        console.error("Erro ao buscar turmas:", e);
        showToast("Erro ao carregar suas turmas.", { type: "error" });
    } finally {
        isLoading.value = false;
    }
};

const handleSubmit = async () => {
    if (!selectedTurmaId.value || !store.user_expandido_id) {
        showToast("Selecione uma turma para continuar.", { type: "error" });
        return;
    }

    try {
        submitting.value = true;
        const turma = minhasTurmas.value.find(
            (t) => t.id_turma === selectedTurmaId.value,
        );
        if (!turma) throw new Error("Turma não encontrada localmente");

        // VALIDATION: Check if matricula is active
        if (turma.status_matricula !== "Ativa") {
            showToast(
                `Não é possível solicitar declaração para matrícula com status: ${turma.status_matricula}`,
                { type: "error" },
            );
            return;
        }

        // VALIDATION: Check for existing pending/approved declaration for this matricula
        // We need the matricula ID to check against declaracoesAnteriores
        // The RPC returns `id_matricula` (after migration applied).
        // The `declaracoesAnteriores` list contains objects with `id_matricula`.

        // Note: declaracoesAnteriores might be null/undefined initially, handle gracefully.
        if (
            props.declaracoesAnteriores &&
            props.declaracoesAnteriores.length > 0
        ) {
            // Check if there is any declaration for this matricula that is NOT rejected (false).
            // i.e. Pending (null) or Approved (true).
            // NOTE: declaracoesAnteriores item structure is now FLAT from RPC.
            const existing = props.declaracoesAnteriores.find(
                (d: any) =>
                    d.id_matricula === (turma as any).id_matricula &&
                    d.aprovado !== false,
            );

            if (existing) {
                const statusText =
                    existing.aprovado === true ? "aprovada" : "pendente";
                showToast(
                    `Já existe uma declaração ${statusText} para esta matrícula. Verifique o histórico.`,
                    { type: "error" },
                );
                return;
            }
        }

        // Fetch additional data via BFF (RPC)
        const dadosAluno = await fetchDadosDeclaracao();
        const nomeCompleto = await fetchUserMe();

        // Construct object for HTML generation
        const declaracaoDados = {
            criado_em: new Date().toISOString(),
            matriculas: {
                aluno: {
                    cpf: (dadosAluno as any)?.cpf || "000.000.000-00",
                    nome: nomeCompleto,
                    ra: (dadosAluno as any)?.ra || "RA não encontrado",
                },
                turmas: {
                    curso: {
                        nome_curso: turma.nome_curso,
                        carga_horaria_minutos: turma.carga_horaria_minutos || 0,
                        qtd_semestres: turma.qtd_semestres || 0,
                    },
                    turno: turma.turno,
                    dt_ini_curso: turma.dt_ini_curso,
                    dt_fim_curso: turma.dt_fim_curso,
                    dt_matricula: turma.dt_matricula,
                    num_semestre_atual: turma.num_semestre_atual || 0,
                    total_semestres_cursados:
                        turma.total_semestres_cursados || 0,
                },
            },
        };

        // Generate HTML content specifically for storage
        const htmlContent = generateFullHTML(declaracaoDados); // Ensure this function exists or move logic here

        // Submit to BFF
        await ofetch("/api/aluno/solicitar-declaracao", {
            method: "POST",
            body: {
                id_matricula: (turma as any).id_matricula,
                criado_por: store.user_expandido_id,
            },
        });

        showToast("Solicitação enviada para aprovação!", { type: "success" });
        emit("success");
        emit("close");
    } catch (e: any) {
        console.error("Erro ao processar:", e);
        showToast(
            e.statusMessage || e.message || "Erro ao processar solicitação.",
            { type: "error" },
        );
    } finally {
        submitting.value = false;
    }
};

// --- PDF Generation Logic ---
const generateStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

    * { box-sizing: border-box; font-family: 'Roboto', Arial, sans-serif; }
    body { margin: 0; padding: 0; }

    @page { size: A4; margin: 0; }

    .pagina {
        width: 210mm;
        height: 297mm;
        background-image: url('https://spedppull.b-cdn.net/site/nova_declaracao_eleitoral.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
    }

    .conteudo {
        position: absolute;
        top: 35%;
        left: 15%;
        right: 15%;
        text-align: justify;
        font-size: 14px;
        line-height: 1.6;
        color: #000;
        font-family: 'Roboto', sans-serif;
    }

    .data-local {
        text-align: right;
        margin-bottom: 30px;
    }

    strong { font-weight: 700; }
`;

const generateBody = (item: any) => {
    // Data Preparation
    const nomeAluno = item.matriculas?.aluno?.nome || "Nome Sobrenome";
    const cpfAluno = item.matriculas?.aluno?.cpf || "000.000.000-00";
    // const raAluno = item.matriculas?.aluno?.ra || 'RA não encontrado'; // Not asked to display yet, but available
    const curso = item.matriculas?.turmas?.curso?.nome_curso || "Nome do curso";
    const turno = item.matriculas?.turmas?.turno || "turno";
    const dataDeclaracao = new Date(
        item.criado_em || new Date(),
    ).toLocaleDateString("pt-BR");

    const rawQtdSemestres = item.matriculas?.turmas?.curso?.qtd_semestres;
    const qtdSemestres =
        rawQtdSemestres !== undefined && rawQtdSemestres !== null
            ? rawQtdSemestres
            : "0";

    const rawMinutos =
        item.matriculas?.turmas?.curso?.carga_horaria_minutos || 0;
    const cargaHorariaHoras = Math.floor(rawMinutos / 60);

    // Sequence info
    const numSemestreAtual = item.matriculas?.turmas?.num_semestre_atual || 0;
    const totalSemestresCursados =
        item.matriculas?.turmas?.total_semestres_cursados || 0;

    // Pluralization
    const semestreText = Number(qtdSemestres) === 1 ? "semestre" : "semestres";
    const horaText = cargaHorariaHoras === 1 ? "hora" : "horas";

    // Date of enrollment
    const dtMatricula = item.matriculas?.turmas?.dt_matricula
        ? new Date(item.matriculas?.turmas?.dt_matricula)
        : new Date();
    const dataMatriculaFormatada = dtMatricula.toLocaleDateString("pt-BR");

    const getOrdinalSemestre = (n: number) => {
        const names: Record<number, string> = {
            1: "Primeiro Semestre",
            2: "Segundo Semestre",
            3: "Terceiro Semestre",
            4: "Quarto Semestre",
            5: "Quinto Semestre",
            6: "Sexto Semestre",
            7: "Sétimo Semestre",
            8: "Oitavo Semestre",
            9: "Nono Semestre",
            10: "Décimo Semestre",
        };
        return names[n] || `${n}º Semestre`;
    };

    return `
        <div class="pagina">
            <!-- Hidden image to force load background -->
            <img src="https://spedppull.b-cdn.net/site/nova_declaracao_eleitoral.png" style="display:none;" />

            <div class="conteudo">
                <div class="data-local">
                    São Paulo, ${dataDeclaracao}
                </div>

                <p>
                    Declaramos que o(a) estudante <strong>${nomeAluno}</strong> portador(a) do CPF: <strong>${cpfAluno}</strong>,
                    está devidamente matriculado(a) no curso <strong>${curso}</strong>, turno <strong>${turno}</strong>,
                    tendo o curso duração de <strong>${qtdSemestres}</strong> ${semestreText} com um total de <strong>${cargaHorariaHoras}</strong> ${horaText}.
                    O(a) estudante foi matriculado(a) em <strong>${dataMatriculaFormatada}</strong> e está no <strong>${getOrdinalSemestre(numSemestreAtual)}</strong>.
                    Ficamos à disposição para quaisquer esclarecimentos.
                </p>
            </div>
        </div>
    `;
};

const generateFullHTML = (item: any) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Declaração de Matrícula</title>
        <style>
          ${generateStyles()}
        </style>
      </head>
      <body>
        ${generateBody(item)}
      </body>
    </html>
    `;
};

const printPDF = (declaracaoItem: any) => {
    const htmlContent = generateFullHTML(declaracaoItem);

    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
        position: "fixed",
        right: "0",
        bottom: "0",
        width: "0",
        height: "0",
        border: "0",
    });
    document.body.appendChild(iframe);

    const doc =
        iframe.contentDocument ||
        (iframe.contentWindow && iframe.contentWindow.document);
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    const waitForImages = () => {
        const images = doc.images;
        if (!images.length) {
            printNow(iframe);
            return;
        }

        let loadedCount = 0;
        const checkComplete = () => {
            loadedCount++;
            if (loadedCount === images.length) {
                printNow(iframe);
            }
        };

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (!img) continue;

            if (img.complete) {
                checkComplete();
            } else {
                img.addEventListener("load", checkComplete);
                img.addEventListener("error", checkComplete);
            }
        }
    };

    iframe.onload = () => setTimeout(() => printNow(iframe), 1000);
};

const printNow = (iframe: HTMLIFrameElement) => {
    if ((iframe as any)._hasPrinted) return;
    (iframe as any)._hasPrinted = true;

    if (!iframe.contentWindow) return;

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
</script>

<template>
    <div v-if="isOpen" class="relative z-50">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            @click="$emit('close')"
        ></div>

        <!-- Modal -->
        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div
                class="flex min-h-full items-center justify-center p-4 text-center"
            >
                <div
                    class="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#1A1B26] text-left align-middle shadow-xl transition-all border border-white/10"
                >
                    <!-- Header -->
                    <div
                        class="p-6 border-b border-white/10 flex justify-between items-center bg-[#16161E]"
                    >
                        <h3 class="text-lg font-bold text-white">
                            Solicitar Declaração
                        </h3>
                        <button
                            @click="$emit('close')"
                            class="text-secondary hover:text-white transition-colors"
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

                    <!-- Body -->
                    <div class="p-6 space-y-6">
                        <div v-if="isLoading" class="flex justify-center py-8">
                            <div
                                class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"
                            ></div>
                        </div>

                        <div v-else class="space-y-4">
                            <div class="space-y-1">
                                <label
                                    class="text-xs text-secondary font-bold uppercase tracking-wider"
                                    >Ano / Semestre</label
                                >
                                <BaseSelect
                                    v-model="selectedAnoSemestre"
                                    :options="anoSemestreOptions"
                                    placeholder="Selecione o período..."
                                />
                            </div>

                            <div class="space-y-1">
                                <label
                                    class="text-xs text-secondary font-bold uppercase tracking-wider"
                                    >Turma / Curso</label
                                >
                                <BaseSelect
                                    v-model="selectedTurmaId"
                                    :options="turmasOptions"
                                    label-key="nome"
                                    value-key="id"
                                    placeholder="Selecione a turma..."
                                    :disabled="!selectedAnoSemestre"
                                />
                                <p
                                    v-if="
                                        selectedAnoSemestre &&
                                        turmasOptions.length === 0
                                    "
                                    class="text-xs text-yellow-500 mt-1"
                                >
                                    Nenhuma turma encontrada neste semestre.
                                </p>
                            </div>
                        </div>

                        <div
                            class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                        >
                            <h4
                                class="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2"
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
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Informação
                            </h4>
                            <p class="text-xs text-blue-200/80">
                                A declaração será gerada com base nos dados da
                                matrícula selecionada. Você poderá visualizar e
                                imprimir o documento após a solicitação.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#16161E]"
                    >
                        <button
                            @click="$emit('close')"
                            class="px-4 py-2 text-sm font-bold text-secondary hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="handleSubmit"
                            :disabled="submitting || !selectedTurmaId"
                            class="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg
                                v-if="submitting"
                                class="animate-spin h-4 w-4"
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
                            Confirmar Solicitação
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
