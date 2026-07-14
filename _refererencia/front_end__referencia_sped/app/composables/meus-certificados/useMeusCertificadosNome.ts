import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useMeusCertificadosNome() {
  const tokenOverrides = ref<
    Record<
      string,
      { token: string; expiraEm: string | null; tokenValidacao: string | null }
    >
  >({});

  // --- Helpers de formatação ---
  const normalizarArea = (area?: string | null) => {
    const valor = String(area || "").toLowerCase();
    if (valor === "regulares") return "Regulares";
    if (valor === "extensao" || valor === "extensão") return "Extensão";
    if (valor === "cursos_livres" || valor === "cursos livres")
      return "Cursos Livres";
    if (valor === "especializacao" || valor === "especialização")
      return "Especialização";
    return area || "Curso";
  };

  const getAreaBadgeClass = (area?: string | null) => {
    const valor = normalizarArea(area);
    if (valor === "Extensão")
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (valor === "Regulares")
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (valor === "Cursos Livres")
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (valor === "Especialização")
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    return "bg-white/10 text-secondary border-white/15";
  };

  const formatDataCurta = (iso?: string | null) => {
    if (!iso) return "—";
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return "—";
    return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  };

  const formatDataLonga = (iso?: string | null) => {
    if (!iso) return "—";
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return "—";
    return data.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
  };

  const formatHoje = (data: Date = new Date()) => {
    return data.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
  };

  const formatHoras = (minutos?: number | null) => {
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

  const getQrCodeUrl = (idCertificadoEmitido: string) => {
    return `/api/certificado/validacao/${idCertificadoEmitido}/qrcode?size=320`;
  };

  const getTextoCursoParaTitulo = (area: string): string => {
    if (area === "Regulares") return "CURSO REGULAR";
    if (area === "Extensão") return "CURSO DE EXTENSÃO CULTURAL";
    if (area === "Cursos Livres") return "CURSOS LIVRES";
    if (area === "Especialização") return "CURSO DE ESPECIALIZAÇÃO";
    return "CURSO";
  };

  const campoNaoInformado = "Não informado";

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
  ) => {
    const linhas = [
      {
        titulo: getCoordenacaoArea(area),
        nome: getNomeAssinatura(nomes.coordenador),
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

  // --- Chamadas externas ---
  const fetchNomeOptions = async () => {
    const data = await ofetch<{ ok: boolean; opcoes: any[] }>(
      "/api/avaliacao-gestao/opcoes-nome-impressao",
    );
    return data.opcoes || [];
  };

  const openPublicCertificado = async (idCertificadoEmitido: string) => {
    if (!idCertificadoEmitido || !import.meta.client) return;
    try {
      const data = await ofetch<{ ok: boolean; path: string; url: string }>(
        `/api/certificado/validacao/${idCertificadoEmitido}/publico`,
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

  // --- Geração de HTML do certificado ---
  const gerarHTMLCertificado = (
    item: any,
    nomeAlunoImpressao?: string,
  ): string => {
    const area = normalizarArea(item.area_curso);
    const tipoCurso = getTipoCurso(area);
    const coordenacaoArea = getCoordenacaoArea(area);
    const nomeAluno =
      String(nomeAlunoImpressao || "").trim() ||
      `${item.aluno_nome || ""} ${item.aluno_sobrenome || ""}`.trim() ||
      "NOME DO(A) ESTUDANTE";
    const textoInstitucional =
      item.certificado_texto_institucional ||
      "São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas";
    const cargaHoraria =
      item.certificado_carga_horaria_exibida ||
      formatHoras(item.qtd_minutos_total);
    const periodoInicio = formatDataLonga(item.dt_ini_curso_contexto);
    const periodoFim = formatDataLonga(item.dt_fim_curso_contexto);
    const hoje = formatHoje();
    const assinaturaVariant = getAssinaturaVariant(area);
    const pagina2BodyClass =
      area === "Extensão"
        ? "pagina-2-body pagina-2-body-triplo"
        : area === "Cursos Livres"
          ? "pagina-2-body pagina-2-body-duplo"
          : "pagina-2-body pagina-2-body-padrao";
    const rodapeClass =
      area === "Extensão"
        ? "rodape-p2 rodape-p2-triplo"
        : area === "Cursos Livres"
          ? "rodape-p2 rodape-p2-duplo"
          : "rodape-p2 rodape-p2-padrao";
    const assinaturasPagina2 = getAssinaturasByArea(area, {
      coordenador: item.certificado_nome_coordenador,
      docente: item.certificado_nome_docente,
      curador: item.certificado_nome_curador,
    })
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
            <title>Certificado - ${item.nome_curso}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

                .destaque-nome,
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
            <div class="pagina pagina-1">
                <div class="conteudo">
                    <p>
                        Certificamos que <span class="destaque-nome">${nomeAluno}</span> concluiu o
                        <span class="destaque-curso">${tipoCurso} ${item.nome_curso}</span> na
                        <strong>${textoInstitucional}</strong>.
                        Duração de <strong>${cargaHoraria}</strong>, presencial, no período de
                        <strong>${periodoInicio}</strong> a <strong>${periodoFim}</strong>.
                    </p>
                    <p class="data-local">São Paulo, ${hoje}</p>
                    <div class="autoridades-box">
                        <p class="autoridade-item"><span class="autoridade-nome">Inês Bogéa</span> - <span class="autoridade-cargo">Diretora Artística e Educacional</span></p>
                        <p class="autoridade-item"><span class="autoridade-nome">José Simões</span> - <span class="autoridade-cargo">Superintendente Educacional</span></p>
                    </div>
                </div>
            </div>

            <div class="pagina pagina-2">
                <div class="tipo-curso-box">
                    <div class="tipo-curso-texto">${getTextoCursoParaTitulo(area)}</div>
                </div>
                <div class="conteudo">
                    <div class="header-2">Descrição do Curso</div>
                    <div class="descricao-curso">${item.descricao_curso || "Sem descrição cadastrada."}</div>

                    <div class="${pagina2BodyClass}">
                        <div class="pagina-2-esquerda">
                            <div class="info-carga">
                                <p><strong>Carga horária:</strong> ${cargaHoraria}</p>
                                <p><strong>Período:</strong> ${periodoInicio} a ${periodoFim}</p>
                            </div>

                            <div class="coordenacao ${assinaturaVariant}">
${assinaturasPagina2}
                            </div>
                        </div>
                        <div class="pagina-2-direita">
                            <div class="validacao-box validacao-box-p2">
                                <img src="${getQrCodeUrl(item.id_certificado_emitido)}" alt="QR Code de validação do certificado" />
                                <div class="validacao-texto">
                                    Documento validado digitalmente pela SP Escola de Dança. Para verificar a integridade deste certificado, aponte a câmera do seu celular para o QR Code.
                                    <div class="validacao-autoridades">• Victor Santos (Secretaria Educacional)</div>
                                </div>
                            </div>
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

  const previewCertificado = (item: any, nomeAlunoImpressao?: string) => {
    const htmlContent = gerarHTMLCertificado(item, nomeAlunoImpressao);

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

  return {
    tokenOverrides,
    normalizarArea,
    getAreaBadgeClass,
    formatDataCurta,
    formatDataLonga,
    formatHoje,
    formatHoras,
    getTipoCurso,
    getCoordenacaoArea,
    getQrCodeUrl,
    getTextoCursoParaTitulo,
    campoNaoInformado,
    getNomeAssinatura,
    getAssinaturasByArea,
    getAssinaturaVariant,
    fetchNomeOptions,
    openPublicCertificado,
    gerarHTMLCertificado,
    previewCertificado,
    abrirPrint,
  };
}
