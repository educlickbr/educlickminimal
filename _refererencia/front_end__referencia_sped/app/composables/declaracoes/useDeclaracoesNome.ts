import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export type NomeExibicaoModo = "registro" | "social" | "artistico";

export function useDeclaracoesNome() {
  const tokenOverrides = ref<
    Record<
      string,
      { token: string; expiraEm: string | null; tokenValidacao: string | null }
    >
  >({});

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchNomeOptions = async (idMatricula: string) => {
    const data = await ofetch<{ ok: boolean; opcoes: any[] }>(
      "/api/declaracoes/opcoes-nome-impressao",
      { params: { id_matricula: idMatricula } },
    );
    return data.opcoes || [];
  };

  const getEffectiveToken = (item: any) =>
    tokenOverrides.value[item.id_declaracao]?.token ||
    item.token_publico ||
    null;

  const getEffectiveValidationToken = (item: any) =>
    tokenOverrides.value[item.id_declaracao]?.tokenValidacao ||
    item.token_validacao_publica ||
    null;

  const refreshPublicToken = async (item: any) => {
    const data = await ofetch<{
      ok: boolean;
      token_publico: string;
      token_publico_expira_em: string | null;
      token_validacao_publica: string | null;
    }>("/api/declaracao/renovar-token", {
      method: "POST",
      body: { id_declaracao: item.id_declaracao },
    });

    tokenOverrides.value[item.id_declaracao] = {
      token: data.token_publico,
      expiraEm: data.token_publico_expira_em,
      tokenValidacao: data.token_validacao_publica,
    };

    item.token_publico = data.token_publico;
    item.token_publico_expira_em = data.token_publico_expira_em;
    item.token_validacao_publica = data.token_validacao_publica;

    return data;
  };

  const getPublicDeclarationPath = (
    item: any,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    const token = getEffectiveToken(item);
    if (!token) return null;
    const query =
      nomeExibicao !== "registro"
        ? `?nome=${encodeURIComponent(nomeExibicao)}`
        : "";
    return `/declaracao/publica/${token}${query}`;
  };

  const getPublicDeclarationUrl = (
    item: any,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    const path = getPublicDeclarationPath(item, nomeExibicao);
    if (!path || !import.meta.client) return null;
    return `${window.location.origin}${path}`;
  };

  const getValidationDeclarationUrl = (
    item: any,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    if (!import.meta.client) return null;
    const tokenValidacao = getEffectiveValidationToken(item);
    if (!tokenValidacao) return null;
    const query =
      nomeExibicao !== "registro"
        ? `?nome=${encodeURIComponent(nomeExibicao)}`
        : "";
    return `${window.location.origin}/declaracao/validar/${tokenValidacao}${query}`;
  };

  const getPublicQrcodeUrl = (
    item: any,
    nomeExibicao: NomeExibicaoModo = "registro",
    size = 420,
  ) => {
    const tokenValidacao = getEffectiveValidationToken(item);
    if (!tokenValidacao) return null;
    const params = new URLSearchParams();
    if (nomeExibicao !== "registro") params.set("nome", nomeExibicao);
    params.set("size", String(size));
    return `/api/declaracao/validacao/${tokenValidacao}/qrcode?${params.toString()}`;
  };

  const openPublicDeclaration = async (
    item: any,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    if (!import.meta.client) return;

    try {
      await refreshPublicToken(item);
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível renovar o link público desta declaração.");
      return;
    }

    const path = getPublicDeclarationPath(item, nomeExibicao);
    if (!path) {
      window.alert("Página pública ainda indisponível para esta declaração.");
      return;
    }

    window.open(path, "_blank", "noopener,noreferrer");
  };

  // --- Print / HTML generation ---
  const generateStyles = () => `
        * { box-sizing: border-box; font-family: 'Roboto', Arial, sans-serif; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
            top: 33.9%;
            left: 15%;
            right: 15%;
            text-align: justify;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            font-family: 'Roboto', sans-serif;
        }
        .data-local { text-align: right; margin-bottom: 0; }
        .top-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
        }
        .validacao-box {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .validacao-texto {
            max-width: 260px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .validacao-texto h4 {
            margin: 0;
            font-size: 11px;
            white-space: nowrap;
        }
        .validacao-texto p {
            margin: 0;
            font-size: 8px;
        }
        .validacao-url {
            word-break: break-all;
            overflow-wrap: anywhere;
            word-break: break-word;
        }
        .validacao-qr {
            width: 72px;
            height: 72px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        strong { font-weight: 700; }
    `;

  const generateBody = (
    item: any,
    nomeAlunoOverride?: string | null,
    validationUrl?: string | null,
    qrCodeUrl?: string | null,
  ) => {
    const nomeAluno = nomeAlunoOverride || item.nome_aluno || "Nome Sobrenome";
    const cpfAluno = item.cpf_aluno || "000.000.000-00";
    const curso = item.nome_curso || "Nome do curso";
    const turno = item.turno || "turno";
    const dataDeclaracao =
      formatDate(item.criado_em || new Date().toISOString()) || "--";

    const rawQtdSemestres = item.qtd_semestres;
    const qtdSemestres =
      rawQtdSemestres !== undefined && rawQtdSemestres !== null
        ? rawQtdSemestres
        : "0";
    const rawMinutos = item.carga_horaria_minutos || 0;
    const cargaHorariaHoras = Math.floor(rawMinutos / 60);
    const numSemestreAtual = item.num_semestre_atual || 0;

    const semestreText = Number(qtdSemestres) === 1 ? "semestre" : "semestres";
    const horaText = cargaHorariaHoras === 1 ? "hora" : "horas";

    const dataMatriculaFormatada = formatDate(item.dt_matricula) || "--";

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
                    ${
                      validationUrl && qrCodeUrl
                        ? `
                    <div class="top-row">
                        <div class="validacao-box">
                            <img class="validacao-qr" src="${qrCodeUrl}" alt="QR de validação" />
                            <div class="validacao-texto">
                                <h4>Validação Institucional</h4>
                                <p>Valide pelo QR ou URL:</p>
                                <p class="validacao-url"><strong>${validationUrl}</strong></p>
                            </div>
                        </div>
                        <div class="data-local">
                            São Paulo, ${dataDeclaracao}
                        </div>
                    </div>
                    `
                        : ""
                    }

                    ${
                      !validationUrl || !qrCodeUrl
                        ? `
                    <div class="data-local">
                        São Paulo, ${dataDeclaracao}
                    </div>
                    `
                        : ""
                    }

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

  const generateFullHTML = (
    item: any,
    nomeAlunoOverride?: string | null,
    validationUrl?: string | null,
    qrCodeUrl?: string | null,
  ) => {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <style>${generateStyles()}</style>
            </head>
            <body>
                ${generateBody(item, nomeAlunoOverride, validationUrl, qrCodeUrl)}
            </body>
            </html>
        `;
  };

  const openDeclaration = async (
    item: any,
    nomeAlunoOverride?: string | null,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    try {
      await refreshPublicToken(item);
    } catch (error) {
      console.error(error);
      window.alert(
        "Não foi possível renovar o link público da declaração para validação.",
      );
      return;
    }

    const validationUrl = getValidationDeclarationUrl(item, nomeExibicao);
    const qrCodeUrl = getPublicQrcodeUrl(item, nomeExibicao, 900);

    const htmlContent = generateFullHTML(
      item,
      nomeAlunoOverride,
      validationUrl,
      qrCodeUrl,
    );

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

    iframe.onload = () => {
      setTimeout(() => printNow(iframe), 500);
    };
  };

  const printNow = (iframe: HTMLIFrameElement) => {
    if ((iframe as any)._hasPrinted) return;
    (iframe as any)._hasPrinted = true;
    if (!iframe.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  };

  return {
    tokenOverrides,
    formatDate,
    fetchNomeOptions,
    getEffectiveToken,
    getEffectiveValidationToken,
    refreshPublicToken,
    getPublicDeclarationPath,
    getPublicDeclarationUrl,
    getValidationDeclarationUrl,
    getPublicQrcodeUrl,
    openPublicDeclaration,
    openDeclaration,
  };
}
