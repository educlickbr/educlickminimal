<script setup lang="ts">
interface CursoCard {
    id: string;
    nome_curso: string;
    cod_curso: string | null;
    area: string;
    area_int: string;
    modalidade: string | null;
    descricao: string | null;
    certificado_texto_institucional: string | null;
    certificado_nome_coordenador: string | null;
    certificado_nome_docente: string | null;
    certificado_nome_curador: string | null;
    certificado_carga_horaria_exibida: string | null;
    qtd_modulos: number | null;
    qtd_aulas_modulo: number | null;
    qtd_periodos: number | null;
    qtd_minutos_periodo: number | null;
    qtd_minutos_total: number | null;
    status: boolean;
}

const props = defineProps<{
    show: boolean;
    curso: CursoCard | null;
    idCertificadoEmitido?: string | null;
    previewAluno?: {
        nome?: string | null;
        sobrenome?: string | null;
    } | null;
    previewTurma?: {
        dt_ini_curso?: string | null;
        dt_fim_curso?: string | null;
    } | null;
    readOnly?: boolean;
}>();

const emit = defineEmits<{
    close: [];
    salvar: [
        dados: {
            cursoId: string;
            textoInstitucional: string;
            cargaHoraria: string;
            nomeCoordenador: string;
            nomeDocente: string;
            nomeCurador: string;
            descricaoHtml: string;
        },
    ];
}>();

const editorRef = ref<HTMLElement | null>(null);

const textoInstitucional = ref(
    "São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas",
);
const cargaHoraria = ref("");
const nomeCoordenador = ref("");
const nomeDocente = ref("");
const nomeCurador = ref("");
const descricaoHtml = ref("");
const nomeCoordenadorDummy = "José Da Silva (Inserir nome)";
import { useGestaoCertificadosModalParametrizacao } from "~/composables/gestao-certificados/useGestaoCertificadosModalParametrizacao";

const { fetchPublicCertificadoUrl } =
    useGestaoCertificadosModalParametrizacao();

const campoNaoInformado = "Não informado";
const qrCodeUrl = computed(() => {
    if (!props.idCertificadoEmitido) return "";
    return `/api/certificado/validacao/${props.idCertificadoEmitido}/qrcode?size=320`;
});

const openPublicCertificado = async () => {
    if (!props.idCertificadoEmitido || !import.meta.client) return;

    try {
        const data = await fetchPublicCertificadoUrl(
            props.idCertificadoEmitido,
        );
        const target = data?.path || data?.url;
        if (!target) {
            window.alert(
                "Página pública ainda indisponível para este certificado.",
            );
            return;
        }
        window.open(target, "_blank", "noopener,noreferrer");
    } catch (error) {
        console.error("Erro ao abrir página pública do certificado:", error);
        window.alert(
            "Não foi possível abrir a página pública deste certificado.",
        );
    }
};

const formatDataIso = (iso?: string | null): string | null => {
    if (!iso) return null;
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return null;
    return formatData(data);
};

const nomeAlunoPreview = computed(() => {
    const nome = (props.previewAluno?.nome || "").trim();
    const sobrenome = (props.previewAluno?.sobrenome || "").trim();
    const completo = `${nome} ${sobrenome}`.trim();
    return completo || "NOME DO(A) ESTUDANTE";
});

const periodoInicioPreview = computed(() => {
    return (
        formatDataIso(props.previewTurma?.dt_ini_curso) ||
        "05 de fevereiro de 2025"
    );
});

const periodoFimPreview = computed(() => {
    return (
        formatDataIso(props.previewTurma?.dt_fim_curso) ||
        "30 de novembro de 2025"
    );
});

const formatHoras = (minutos?: number | null): string => {
    if (!minutos || minutos <= 0) return "—";
    if (minutos % 60 === 0) return `${minutos / 60}h`;
    return `${(minutos / 60).toFixed(1)}h`;
};

const getTipoCurso = (area: string): string => {
    if (area === "Regulares") return "Curso Regular de";
    if (area === "Extensão") return "Curso de Extensão Cultural";
    if (area === "Cursos Livres") return "Curso Livre de";
    if (area === "Especialização") return "Curso de Especialização";
    return "Curso de";
};

const getCoordenacaoArea = (area: string): string => {
    if (area === "Regulares") return "Coordenador(a) dos Cursos Regulares";
    if (area === "Extensão")
        return "Coordenador(a) dos Cursos de Extensão Cultural";
    if (area === "Cursos Livres") return "Coordenador(a) dos Cursos Livres";
    if (area === "Especialização")
        return "Coordenador(a) dos Cursos de Especialização";
    return "Coordenador(a) dos Cursos";
};

const getTextoCursoParaTitulo = (area: string): string => {
    if (area === "Regulares") return "CURSO REGULAR";
    if (area === "Extensão") return "CURSO DE EXTENSÃO CULTURAL";
    if (area === "Cursos Livres") return "CURSOS LIVRES";
    if (area === "Especialização") return "CURSO DE ESPECIALIZAÇÃO";
    return "CURSO";
};

const tipoCurso = computed(() => getTipoCurso(props.curso?.area ?? ""));
const coordenacaoArea = computed(() =>
    getCoordenacaoArea(props.curso?.area ?? ""),
);
const areaAtual = computed(() => props.curso?.area ?? "");
const requiresDocente = computed(() =>
    ["Cursos Livres", "Extensão"].includes(areaAtual.value),
);
const requiresCurador = computed(() => areaAtual.value === "Extensão");

const areaBadgeClass = computed(() => {
    const area = props.curso?.area ?? "";
    if (area === "Regulares")
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (area === "Extensão")
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (area === "Cursos Livres")
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-white/10 text-secondary border-white/15";
});

const getNomeAssinatura = (
    valor?: string | null,
    fallback: string = campoNaoInformado,
) => {
    const texto = String(valor || "").trim();
    return texto || fallback;
};

const getAssinaturasByArea = (
    area: string,
    nomes: {
        coordenador?: string | null;
        docente?: string | null;
        curador?: string | null;
    },
    fallbackCoordenador: string = campoNaoInformado,
) => {
    const linhas = [
        {
            titulo: getCoordenacaoArea(area),
            nome: getNomeAssinatura(nomes.coordenador, fallbackCoordenador),
        },
    ];

    if (area === "Cursos Livres" || area === "Extensão") {
        linhas.push({
            titulo: "Docente",
            nome: getNomeAssinatura(nomes.docente),
        });
    }

    if (area === "Extensão") {
        linhas.push({
            titulo: "Curador(a)",
            nome: getNomeAssinatura(nomes.curador),
        });
    }

    return linhas;
};

const getAssinaturaVariant = (area: string) => {
    if (area === "Extensão") return "coordenacao-triplo";
    if (area === "Cursos Livres") return "coordenacao-duplo";
    return "coordenacao-padrao";
};

const assinaturasPreview = computed(() =>
    getAssinaturasByArea(
        areaAtual.value,
        {
            coordenador: nomeCoordenador.value,
            docente: nomeDocente.value,
            curador: nomeCurador.value,
        },
        nomeCoordenadorDummy,
    ),
);

const aplicarFormato = (cmd: string) => {
    document.execCommand(cmd, false);
    if (editorRef.value) descricaoHtml.value = editorRef.value.innerHTML;
};

const onEditorInput = () => {
    if (editorRef.value) descricaoHtml.value = editorRef.value.innerHTML;
};

watch(
    () => props.curso,
    (curso) => {
        if (curso) {
            textoInstitucional.value =
                curso.certificado_texto_institucional ||
                "São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas";
            cargaHoraria.value =
                curso.certificado_carga_horaria_exibida ||
                formatHoras(curso.qtd_minutos_total);
            nomeCoordenador.value = curso.certificado_nome_coordenador || "";
            nomeDocente.value = curso.certificado_nome_docente || "";
            nomeCurador.value = curso.certificado_nome_curador || "";
            descricaoHtml.value = curso.descricao ?? "";
            nextTick(() => {
                if (editorRef.value)
                    editorRef.value.innerHTML = curso.descricao ?? "";
            });
        }
    },
    { immediate: true },
);

const formatData = (data: Date = new Date()): string => {
    const opcoes: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
    };
    return data.toLocaleDateString("pt-BR", opcoes);
};

const gerarHTMLCertificado = (): string => {
    if (!props.curso) return "";

    const hoje = formatData();
    const nomeEstudante = nomeAlunoPreview.value;
    const periodoInicio = periodoInicioPreview.value;
    const periodoFim = periodoFimPreview.value;
    const assinaturaVariant = getAssinaturaVariant(props.curso.area);
    const pagina2BodyClass =
        props.curso.area === "Extensão"
            ? "pagina-2-body pagina-2-body-triplo"
            : props.curso.area === "Cursos Livres"
              ? "pagina-2-body pagina-2-body-duplo"
              : "pagina-2-body pagina-2-body-padrao";
    const rodapeClass =
        props.curso.area === "Extensão"
            ? "rodape-p2 rodape-p2-triplo"
            : props.curso.area === "Cursos Livres"
              ? "rodape-p2 rodape-p2-duplo"
              : "rodape-p2 rodape-p2-padrao";
    const assinaturasPagina2 = getAssinaturasByArea(
        props.curso.area,
        {
            coordenador: nomeCoordenador.value,
            docente: nomeDocente.value,
            curador: nomeCurador.value,
        },
        nomeCoordenadorDummy,
    )
        .map(
            (linha) => `
                        <div class="coordenacao-bloco">
                            <div class="coord-titulo">${linha.titulo}</div>
                            <div class="coord-nome">${linha.nome}</div>
                        </div>`,
        )
        .join("");

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Certificado - ${props.curso.nome_curso}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; }
            @page { size: A4 landscape; margin: 0; }

            .pagina {
                width: 297mm;
                height: 210mm;
                background-image: url('https://spedppull.b-cdn.net/site/certificado_sped_01_eleitotal.png');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                position: relative;
                page-break-after: always;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .pagina-2 {
                background-image: url('https://spedppull.b-cdn.net/site/sped_cetificado_02x.png');
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                padding-top: 64mm;
            }

            .conteudo {
                width: 85%;
                text-align: justify;
                font-size: 13px;
                line-height: 1.8;
                color: #1a1a1a;
                font-family: 'Roboto', Arial, sans-serif;
            }

            .conteudo p {
                margin-bottom: 12px;
            }

            .destaque-nome {
                font-weight: bold;
                text-decoration: none;
            }

            .destaque-curso {
                font-weight: bold;
                text-decoration: none;
            }

            .header-2 {
                text-align: center;
                margin-bottom: 12px;
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
            }

            .descricao-curso {
                margin: 4px 0 14px;
                text-align: justify;
                font-size: 14px;
                line-height: 1.75;
            }

            .info-carga {
                margin: 26px 0 0;
                font-size: 12px;
            }

            .info-carga p {
                margin: 8px 0;
            }

            /* Página 1: desloca texto para a área livre após o grafismo da esquerda */
            .pagina-1 {
                justify-content: flex-start;
                padding-left: 92mm;
            }
            .pagina-1 .conteudo {
                width: 80%;
            }

            .data-local {
                margin-top: 40px;
                font-size: 14px;
                font-weight: normal;
                color: #1a1a1a;
                text-align: center;
            }

            .validacao-box {
                margin: 24px auto 0;
                padding: 14px;
                width: 88%;
                border: 1px solid #d4d4d8;
                background: rgba(255, 255, 255, 0.96);
                display: flex;
                align-items: center;
                gap: 14px;
            }

            .validacao-box img {
                width: 76px;
                height: 76px;
                flex: 0 0 76px;
                display: block;
            }

            .validacao-texto {
                font-size: 10px;
                line-height: 1.55;
                text-align: left;
            }

            .validacao-autoridades {
                margin-top: 6px;
                font-weight: 600;
            }

            .autoridades-box {
                margin: 34px auto 0;
                text-align: center;
            }

            .autoridade-item {
                margin: 8px 0;
                font-size: 14px;
                line-height: 1.45;
                color: #1a1a1a;
            }

            .autoridade-nome {
                font-weight: 700;
            }

            .autoridade-cargo {
                font-weight: 500;
            }

            .coordenacao {
                margin-top: 25px;
                font-size: 11px;
            }

            .coordenacao-bloco + .coordenacao-bloco {
                margin-top: 14px;
            }

            .coord-titulo {
                font-weight: 700;
                text-transform: uppercase;
                font-size: 16px;
                line-height: 1.3;
                margin-bottom: 2px;
            }

            .coord-nome {
                font-size: 13px;
                font-weight: 400;
                margin-top: 0;
            }

            .coordenacao-duplo {
                margin-top: 20px;
            }

            .coordenacao-duplo .coord-titulo {
                font-size: 15px;
                line-height: 1.22;
            }

            .coordenacao-duplo .coord-nome {
                font-size: 12px;
            }

            .coordenacao-duplo .coordenacao-bloco + .coordenacao-bloco {
                margin-top: 12px;
            }

            .coordenacao-triplo {
                margin-top: 16px;
            }

            .coordenacao-triplo .coord-titulo {
                font-size: 14px;
                line-height: 1.18;
            }

            .coordenacao-triplo .coord-nome {
                font-size: 11.5px;
            }

            .coordenacao-triplo .coordenacao-bloco + .coordenacao-bloco {
                margin-top: 10px;
            }

            .pagina-2-body {
                display: flex;
                gap: 28px;
                align-items: center;
                justify-content: space-between;
            }

            .pagina-2-esquerda {
                flex: 0 1 46%;
                max-width: 46%;
                min-width: 0;
            }

            .pagina-2-direita {
                flex: 0 0 495px;
                width: 495px;
            }

            .validacao-box-p2 {
                margin: 10px 0 0;
                width: 100%;
            }

            .validacao-box-p2 img {
                width: 72px;
                height: 72px;
                flex: 0 0 72px;
            }

            .validacao-box-p2 .validacao-texto {
                font-size: 9.5px;
                line-height: 1.45;
            }

            .pagina-2-body-duplo {
                gap: 24px;
            }

            .pagina-2-body-triplo {
                gap: 20px;
            }

            .pagina-2-body-triplo .info-carga {
                margin-top: 20px;
            }

            .pagina-2-body-triplo .validacao-box-p2 {
                margin-top: 4px;
            }

            .rodape-p2-padrao {
                margin-top: 50px;
            }

            .rodape-p2-duplo {
                margin-top: 36px;
            }

            .rodape-p2-triplo {
                margin-top: 24px;
            }

            .tipo-curso-box {
                position: absolute;
                top: 36mm;
                left: 50%;
                transform: translateX(-50%);
                width: fit-content;
                background: linear-gradient(to bottom, #009c82 0%, #008870 100%);
                padding: 18px 46px;
                text-align: center;
                z-index: 10;
                margin: 0;
                clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
            }

            .tipo-curso-texto {
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 25px;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 0.8px;
                -webkit-text-stroke: 0.55px rgba(255, 255, 255, 0.45);
                text-shadow: 0.35px 0 currentColor, -0.35px 0 currentColor, 0 0.35px currentColor, 0 -0.35px currentColor, 0 2px 3px rgba(0, 0, 0, 0.18);
            }
        </style>
    </head>
    <body>
        <!-- PÁGINA 1 -->
        <div class="pagina pagina-1">
            <div class="conteudo">
                <p>
                    Certificamos que <span class="destaque-nome">${nomeEstudante}</span> concluiu o
                    <span class="destaque-curso">${tipoCurso.value} ${props.curso.nome_curso}</span> na
                    <strong>${textoInstitucional.value}</strong>.
                    Duração de <strong>${cargaHoraria.value}</strong>, presencial, no período de
                    <strong>${periodoInicio}</strong> a <strong>${periodoFim}</strong>.
                </p>
                <p class="data-local">São Paulo, ${hoje}</p>
                <div class="autoridades-box">
                    <p class="autoridade-item"><span class="autoridade-nome">Inês Bogéa</span> - <span class="autoridade-cargo">Diretora Artística e Educacional</span></p>
                    <p class="autoridade-item"><span class="autoridade-nome">José Simões</span> - <span class="autoridade-cargo">Superintendente Educacional</span></p>
                </div>
            </div>
        </div>

        <!-- PÁGINA 2 -->
        <div class="pagina pagina-2">
            <div class="tipo-curso-box">
                <div class="tipo-curso-texto">${getTextoCursoParaTitulo(props.curso.area)}</div>
            </div>
            <div class="conteudo">
                <div class="header-2">Descrição do Curso</div>
                <div class="descricao-curso">${descricaoHtml.value || props.curso.descricao || "Sem descrição cadastrada."}</div>

                <div class="${pagina2BodyClass}">
                    <div class="pagina-2-esquerda">
                        <div class="info-carga">
                            <p><strong>Carga horária:</strong> ${cargaHoraria.value}</p>
                            <p><strong>Período:</strong> ${periodoInicio} a ${periodoFim}</p>
                        </div>
                        <div class="coordenacao ${assinaturaVariant}">
${assinaturasPagina2}
                        </div>
                    </div>
                    <div class="pagina-2-direita">
                        ${
                            props.idCertificadoEmitido
                                ? `
                        <div class="validacao-box validacao-box-p2">
                            <img src="${qrCodeUrl.value}" alt="QR Code de validação do certificado" />
                            <div class="validacao-texto">
                                Documento validado digitalmente pela SP Escola de Dança. Para verificar a integridade deste certificado, aponte a câmera do seu celular para o QR Code.
                                <div class="validacao-autoridades">• Victor Santos (Secretaria Educacional)</div>
                            </div>
                        </div>`
                                : ""
                        }
                    </div>
                </div>
                <div class="${rodapeClass}" style="border-top: 1px solid #ccc; padding-top: 12px; font-size: 10px; text-align: center;">
                    <p style="margin: 4px 0;"><strong>SÃO PAULO ESCOLA DE DANÇA - CENTRO DE FORMAÇÃO EM ARTES COREOGRÁFICAS</strong></p>
                    <p style="margin: 4px 0;">Rua Mauá, 51 • 3º andar • Luz • São Paulo • SP • 01028-900 • Fone +55 (11) 3367-5900</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

const abrirPreviewCertificado = () => {
    if (!props.curso) return;

    const htmlContent = gerarHTMLCertificado();

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
        const images = doc.getElementsByTagName("img");
        if (!images.length) {
            abrirPrint(iframe);
            return;
        }

        const pendingImages = Array.from(images).filter((img) => !img.complete);
        if (!pendingImages.length) {
            abrirPrint(iframe);
            return;
        }

        let loadedCount = 0;
        const checkComplete = () => {
            loadedCount++;
            if (loadedCount === pendingImages.length) abrirPrint(iframe);
        };

        for (let i = 0; i < pendingImages.length; i++) {
            const img = pendingImages[i] as HTMLImageElement;
            img.onload = checkComplete;
            img.onerror = checkComplete;
        }
    };

    iframe.onload = () => waitForImages();
    setTimeout(() => waitForImages(), 500);
};

const abrirPrint = (iframe: HTMLIFrameElement) => {
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
    }, 300);
};

const salvar = () => {
    if (!props.curso) return;

    if (requiresDocente.value && !nomeDocente.value.trim()) {
        window.alert(`Docente é obrigatório para ${props.curso.area}.`);
        return;
    }

    if (requiresCurador.value && !nomeCurador.value.trim()) {
        window.alert("Curador(a) é obrigatório para Extensão.");
        return;
    }

    emit("salvar", {
        cursoId: props.curso.id,
        textoInstitucional: textoInstitucional.value,
        cargaHoraria: cargaHoraria.value,
        nomeCoordenador: nomeCoordenador.value,
        nomeDocente: nomeDocente.value,
        nomeCurador: nomeCurador.value,
        descricaoHtml: descricaoHtml.value,
    });
};
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="show && curso"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-5"
                @click.self="emit('close')"
            >
                <div
                    class="bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden"
                >
                    <!-- ── Header ─────────────────────────────────────────────── -->
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0"
                    >
                        <div class="flex items-center gap-3 min-w-0">
                            <span
                                class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border shrink-0"
                                :class="areaBadgeClass"
                            >
                                {{ curso.area }}
                            </span>
                            <div class="min-w-0">
                                <p
                                    class="text-[10px] text-secondary uppercase tracking-widest font-bold leading-none mb-0.5"
                                >
                                    Parametrizar Certificado
                                </p>
                                <h2
                                    class="text-base font-black text-white truncate leading-tight"
                                >
                                    {{ curso.nome_curso }}
                                </h2>
                            </div>
                        </div>
                        <button
                            @click="emit('close')"
                            class="ml-4 w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 transition-all shrink-0"
                            title="Fechar"
                        >
                            <svg
                                class="w-5 h-5"
                                xmlns="http://www.w3.org/2000/svg"
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

                    <!-- ── Body (two columns) ──────────────────────────────────── -->
                    <div class="flex flex-1 overflow-hidden min-h-0">
                        <!-- LEFT: Form panel -->
                        <div
                            class="w-full md:w-[42%] border-r border-white/10 overflow-y-auto p-6 space-y-6 custom-scrollbar shrink-0"
                        >
                            <!-- Section: Identificação -->
                            <div>
                                <p
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5"
                                >
                                    Identificação
                                </p>
                                <div class="space-y-3">
                                    <div>
                                        <p
                                            class="text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"
                                        >
                                            Tipo de Certificado
                                        </p>
                                        <div
                                            class="flex items-center gap-2 bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"
                                        >
                                            <span
                                                class="text-sm text-white/80"
                                                >{{ tipoCurso }}</span
                                            >
                                            <span
                                                class="ml-auto text-[9px] text-blue-400/70 uppercase tracking-wider font-bold shrink-0"
                                                >Automático</span
                                            >
                                        </div>
                                    </div>
                                    <div>
                                        <p
                                            class="text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"
                                        >
                                            Nome do Curso
                                        </p>
                                        <div
                                            class="bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"
                                        >
                                            <span
                                                class="text-sm text-white/80"
                                                >{{ curso.nome_curso }}</span
                                            >
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <p
                                                class="text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"
                                            >
                                                Código
                                            </p>
                                            <div
                                                class="bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"
                                            >
                                                <span
                                                    class="text-xs font-mono text-secondary"
                                                    >{{
                                                        curso.cod_curso || "—"
                                                    }}</span
                                                >
                                            </div>
                                        </div>
                                        <div>
                                            <p
                                                class="text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"
                                            >
                                                Carga Total
                                            </p>
                                            <div
                                                class="bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"
                                            >
                                                <span
                                                    class="text-xs text-primary font-bold"
                                                    >{{
                                                        formatHoras(
                                                            curso.qtd_minutos_total,
                                                        )
                                                    }}</span
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Section: Texto Principal -->
                            <div>
                                <p
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5"
                                >
                                    Texto Principal
                                </p>
                                <div class="space-y-4">
                                    <div>
                                        <label
                                            class="flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Instituição
                                            <span
                                                class="text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"
                                                >· editável</span
                                            >
                                        </label>
                                        <textarea
                                            v-model="textoInstitucional"
                                            rows="2"
                                            placeholder="Nome da instituição no certificado..."
                                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30 resize-none leading-relaxed"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            class="flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Carga Horária (exibida)
                                            <span
                                                class="text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"
                                                >· editável</span
                                            >
                                        </label>
                                        <input
                                            v-model="cargaHoraria"
                                            type="text"
                                            placeholder="ex: 320h"
                                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Section: Descrição -->
                            <div>
                                <p
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5 flex items-center gap-1.5"
                                >
                                    Descrição do Curso
                                    <span
                                        class="text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"
                                        >· editável</span
                                    >
                                </p>
                                <div
                                    class="border border-white/10 rounded-lg overflow-hidden focus-within:border-amber-500/40 transition-colors"
                                >
                                    <!-- Toolbar -->
                                    <div
                                        class="flex items-center gap-0.5 px-2 py-1.5 bg-white/3 border-b border-white/10"
                                    >
                                        <button
                                            @mousedown.prevent="
                                                aplicarFormato('bold')
                                            "
                                            class="w-7 h-7 flex items-center justify-center text-xs font-black bg-transparent hover:bg-white/10 rounded text-white transition-colors"
                                            title="Negrito"
                                        >
                                            B
                                        </button>
                                        <button
                                            @mousedown.prevent="
                                                aplicarFormato('italic')
                                            "
                                            class="w-7 h-7 flex items-center justify-center text-xs italic bg-transparent hover:bg-white/10 rounded text-white transition-colors"
                                            title="Itálico"
                                        >
                                            I
                                        </button>
                                        <button
                                            @mousedown.prevent="
                                                aplicarFormato('underline')
                                            "
                                            class="w-7 h-7 flex items-center justify-center text-xs underline bg-transparent hover:bg-white/10 rounded text-white transition-colors"
                                            title="Sublinhado"
                                        >
                                            U
                                        </button>
                                        <button
                                            @mousedown.prevent="
                                                aplicarFormato('strikeThrough')
                                            "
                                            class="w-7 h-7 flex items-center justify-center text-xs line-through bg-transparent hover:bg-white/10 rounded text-secondary transition-colors"
                                            title="Tachado"
                                        >
                                            S
                                        </button>
                                        <div
                                            class="w-px h-4 bg-white/10 mx-1"
                                        />
                                        <button
                                            @mousedown.prevent="
                                                aplicarFormato('removeFormat')
                                            "
                                            class="px-2 h-7 flex items-center justify-center text-[10px] font-bold bg-transparent hover:bg-white/10 rounded text-secondary hover:text-white transition-colors uppercase tracking-wide"
                                            title="Remover formatação"
                                        >
                                            Limpar
                                        </button>
                                    </div>
                                    <div
                                        ref="editorRef"
                                        contenteditable="true"
                                        @input="onEditorInput"
                                        class="min-h-[140px] max-h-[240px] overflow-y-auto px-4 py-3 text-sm text-white/90 leading-7 bg-[#0f0f15] focus:outline-none custom-scrollbar"
                                    />
                                </div>
                                <p class="text-[10px] text-secondary/40 mt-1.5">
                                    Usa a coluna
                                    <span class="font-mono">descricao</span> do
                                    curso como ponto de partida.
                                </p>
                            </div>

                            <!-- Section: Coordenação -->
                            <div>
                                <p
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5"
                                >
                                    Coordenação
                                </p>
                                <div class="space-y-3">
                                    <div>
                                        <p
                                            class="text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"
                                        >
                                            Área de Coordenação
                                        </p>
                                        <div
                                            class="flex items-center gap-2 bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"
                                        >
                                            <span
                                                class="text-sm text-white/80"
                                                >{{ coordenacaoArea }}</span
                                            >
                                            <span
                                                class="ml-auto text-[9px] text-blue-400/70 uppercase tracking-wider font-bold shrink-0"
                                                >Automático</span
                                            >
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            class="flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Nome do(a) Coordenador(a)
                                            <span
                                                class="text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"
                                                >· editável</span
                                            >
                                        </label>
                                        <input
                                            v-model="nomeCoordenador"
                                            type="text"
                                            placeholder="ex: Prof.ª Ana Lima"
                                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"
                                        />
                                    </div>
                                    <div v-if="requiresDocente">
                                        <label
                                            class="flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Nome do Docente
                                            <span
                                                class="text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"
                                                >· obrigatório</span
                                            >
                                        </label>
                                        <input
                                            v-model="nomeDocente"
                                            type="text"
                                            placeholder="ex: Prof. João Silva"
                                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"
                                        />
                                    </div>
                                    <div v-if="requiresCurador">
                                        <label
                                            class="flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Nome do Curador(a)
                                            <span
                                                class="text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"
                                                >· obrigatório</span
                                            >
                                        </label>
                                        <input
                                            v-model="nomeCurador"
                                            type="text"
                                            placeholder="ex: Curadora Maria Souza"
                                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT: Certificate Preview -->
                        <div
                            class="flex-1 overflow-y-auto p-6 custom-scrollbar"
                        >
                            <!-- Legend -->
                            <div
                                class="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 pb-4 border-b border-white/5"
                            >
                                <p
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/50 w-full"
                                >
                                    Legenda da prévia
                                </p>
                                <span
                                    class="flex items-center gap-1.5 text-[10px] text-secondary font-bold"
                                >
                                    <span
                                        class="inline-block w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30 shrink-0"
                                    />
                                    Dado do curso
                                </span>
                                <span
                                    class="flex items-center gap-1.5 text-[10px] text-secondary font-bold"
                                >
                                    <span
                                        class="inline-block w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30 shrink-0"
                                    />
                                    Dado do estudante / turma (exemplo)
                                </span>
                                <span
                                    class="flex items-center gap-1.5 text-[10px] text-secondary font-bold"
                                >
                                    <span
                                        class="inline-block w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30 shrink-0"
                                    />
                                    Campo editável
                                </span>
                            </div>

                            <!-- Certificate document -->
                            <div
                                class="bg-[#111119] border border-white/8 rounded-xl p-7 space-y-7 text-[13px] leading-8"
                            >
                                <!-- § Corpo principal -->
                                <p class="text-white/85">
                                    <span>Certificamos que </span
                                    ><mark
                                        class="bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic font-semibold"
                                        >{{ nomeAlunoPreview }}</mark
                                    ><span> concluiu o </span
                                    ><mark
                                        class="bg-blue-500/15 text-blue-300 rounded px-1 not-italic"
                                        >{{ tipoCurso }}</mark
                                    ><span> </span
                                    ><mark
                                        class="bg-blue-500/15 text-blue-300 rounded px-1 not-italic font-semibold"
                                        >{{ curso.nome_curso }}</mark
                                    ><span> na </span
                                    ><mark
                                        class="bg-amber-500/15 text-amber-300 rounded px-1 not-italic"
                                        >{{ textoInstitucional || "—" }}</mark
                                    ><span>. Duração de </span
                                    ><mark
                                        class="bg-amber-500/15 text-amber-300 rounded px-1 not-italic"
                                        >{{ cargaHoraria || "—" }}</mark
                                    ><span>, presencial, no período de </span
                                    ><mark
                                        class="bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic"
                                        >{{ periodoInicioPreview }}</mark
                                    ><span> a </span
                                    ><mark
                                        class="bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic"
                                        >{{ periodoFimPreview }}</mark
                                    ><span>.</span>
                                </p>

                                <!-- § Data (página 1) -->
                                <p class="text-white/70 text-sm leading-6 mt-2">
                                    São Paulo,
                                    <mark
                                        class="bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic text-sm"
                                        >15 de abril de 2026</mark
                                    >
                                </p>

                                <hr class="border-white/8" />

                                <!-- § Descrição do curso -->
                                <div>
                                    <p
                                        class="text-[9px] uppercase tracking-widest text-secondary/40 mb-3 font-black"
                                    >
                                        Descrição do Curso
                                    </p>
                                    <div
                                        class="text-white/75 leading-7 bg-blue-500/5 border border-blue-500/10 rounded-lg px-4 py-3"
                                        v-html="descricaoHtml"
                                    />
                                    <p
                                        v-if="!descricaoHtml"
                                        class="text-secondary/40 italic text-xs px-1"
                                    >
                                        Sem descrição cadastrada.
                                    </p>
                                </div>

                                <hr class="border-white/8" />

                                <!-- § Carga e Período -->
                                <div class="space-y-2">
                                    <p class="text-white/80">
                                        Carga horária:
                                        <mark
                                            class="bg-amber-500/15 text-amber-300 rounded px-1 not-italic"
                                            >{{ cargaHoraria || "—" }}</mark
                                        >
                                    </p>
                                    <p class="text-white/80">
                                        Período:
                                        <mark
                                            class="bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic"
                                            >{{ periodoInicioPreview }} –
                                            {{ periodoFimPreview }}</mark
                                        >
                                    </p>
                                </div>

                                <!-- § Coordenação -->
                                <div class="space-y-3">
                                    <div
                                        v-for="linha in assinaturasPreview"
                                        :key="linha.titulo"
                                        class="space-y-0.5"
                                    >
                                        <p
                                            class="text-[13px] uppercase tracking-wider font-bold leading-snug"
                                        >
                                            <mark
                                                class="bg-blue-500/15 text-blue-300 rounded px-1 not-italic font-bold"
                                                >{{ linha.titulo }}</mark
                                            >
                                        </p>
                                        <p
                                            class="text-sm font-normal leading-tight"
                                        >
                                            <mark
                                                class="bg-amber-500/15 text-amber-300 rounded px-1 not-italic font-normal"
                                                >{{ linha.nome }}</mark
                                            >
                                        </p>
                                    </div>
                                </div>

                                <!-- § Rodapé fixo (página 2) -->
                                <div
                                    class="border-t border-white/8 pt-4 space-y-1"
                                >
                                    <p
                                        class="text-[10px] font-black text-white/40 uppercase tracking-widest"
                                    >
                                        SÃO PAULO ESCOLA DE DANÇA - CENTRO DE
                                        FORMAÇÃO EM ARTES COREOGRÁFICAS
                                    </p>
                                    <p class="text-[10px] text-white/25">
                                        Rua Mauá, 51 • 3º andar • Luz • São
                                        Paulo • SP • 01028-900 • Fone +55 (11)
                                        3367-5900
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Footer actions ─────────────────────────────────────── -->
                    <div
                        class="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0"
                    >
                        <button
                            v-if="props.idCertificadoEmitido"
                            @click="openPublicCertificado"
                            class="px-5 py-2.5 text-sm font-bold text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2"
                            title="Abrir página pública do certificado"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.8"
                                    d="M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5zm12 1h1m2 0h1m-5 2h5m-3-3v5"
                                />
                            </svg>
                            Página Pública
                        </button>
                        <button
                            @click="abrirPreviewCertificado"
                            class="px-5 py-2.5 text-sm font-bold text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2"
                            title="Visualizar prévia em PDF"
                        >
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                            Preview
                        </button>
                        <button
                            @click="emit('close')"
                            class="px-5 py-2.5 text-sm font-bold text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                        >
                            {{ props.readOnly ? "Fechar" : "Cancelar" }}
                        </button>
                        <button
                            v-if="!props.readOnly"
                            @click="salvar"
                            class="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:brightness-110 rounded-lg transition-all"
                        >
                            Salvar Parametrização
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(var(--color-secondary-rgb), 0.1);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
