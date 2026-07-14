import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useAppStore } from "~/stores/app";
import type {
  AvaliacaoAluno,
  Avaliador,
  PessoaNome,
} from "./useAvaliacoesAlunosLista";

export interface OpcaoNomeImpressao {
  tipo: "registro" | "social" | "artistico";
  label: string;
  valor: string | null;
  disponivel: boolean;
}

type NomeExibicaoModo = "registro" | "social" | "artistico";

interface PublicAvaliacaoNomes {
  avaliador_1_nome?: string | null;
  avaliador_2_nome?: string | null;
  coordenador_nome?: string | null;
  pedagogo_nome?: string | null;
}

const ORDEM_ETAPAS: Record<string, number> = {
  "O que nos Une": 1,
  "Mundo do Trabalho": 2,
  Criacao: 3,
  "Relatorio Final": 4,
};

export function useAvaliacoesAlunosNome() {
  const store = useAppStore();
  const tokenOverrides = ref<
    Record<string, { token: string; expiraEm: string | null; ativo: boolean }>
  >({});

  // Pure functions
  const getNomeCompleto = (pessoa?: PessoaNome | null) => {
    const nome = [pessoa?.nome, pessoa?.sobrenome]
      .filter(Boolean)
      .join(" ")
      .trim();
    return nome || "Nao informado";
  };

  const getNomeAvaliador = (avaliador?: Avaliador | null) => {
    const nome = [avaliador?.nome, avaliador?.sobrenome]
      .filter(Boolean)
      .join(" ")
      .trim();
    return nome || "Nao informado";
  };

  const getEffectiveToken = (avl: AvaliacaoAluno) => {
    return (
      tokenOverrides.value[avl.id_avaliacao]?.token || avl.token_publico || null
    );
  };

  const getPublicAvaliacaoPath = (
    avl: AvaliacaoAluno,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    const token = getEffectiveToken(avl);
    if (!token) return null;
    const query =
      nomeExibicao !== "registro"
        ? `?nome=${encodeURIComponent(nomeExibicao)}`
        : "";
    return `/avaliacao/publica/${token}${query}`;
  };

  const getPublicAvaliacaoUrl = (
    avl: AvaliacaoAluno,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    const path = getPublicAvaliacaoPath(avl, nomeExibicao);
    if (!path || !import.meta.client) return null;
    return `${window.location.origin}${path}`;
  };

  const getPublicQrcodeUrl = (
    avl: AvaliacaoAluno,
    nomeExibicao: NomeExibicaoModo = "registro",
    size = 420,
  ) => {
    if (!avl.token_validacao_publica) return null;
    const params = new URLSearchParams();
    if (nomeExibicao !== "registro") params.set("nome", nomeExibicao);
    params.set("size", String(size));
    return `/api/avaliacao-publica/validacao/${avl.token_validacao_publica}/qrcode?${params.toString()}`;
  };

  // Async actions
  const fetchNomeOptions = async () => {
    const data = await ofetch<{ ok: boolean; opcoes: OpcaoNomeImpressao[] }>(
      "/api/avaliacao-gestao/opcoes-nome-impressao",
    );
    return data.opcoes || [];
  };

  const refreshPublicToken = async (avl: AvaliacaoAluno) => {
    const data = await ofetch<{
      ok: boolean;
      token_publico: string;
      token_publico_expira_em: string | null;
      acesso_publico_ativo: boolean;
      token_validacao_publica?: string | null;
    }>("/api/avaliacao-gestao/renovar-token", {
      method: "POST",
      body: { id_avaliacao: avl.id_avaliacao },
    });

    tokenOverrides.value[avl.id_avaliacao] = {
      token: data.token_publico,
      expiraEm: data.token_publico_expira_em,
      ativo: data.acesso_publico_ativo,
    };

    avl.token_publico = data.token_publico;
    avl.token_publico_expira_em = data.token_publico_expira_em;
    avl.acesso_publico_ativo = data.acesso_publico_ativo;
    avl.token_validacao_publica =
      data.token_validacao_publica || avl.token_validacao_publica;

    return data.token_publico;
  };

  const openPublicAvaliacao = async (
    avl: AvaliacaoAluno,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    if (!import.meta.client) return;

    try {
      await refreshPublicToken(avl);
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel renovar o link publico desta avaliacao.");
      return;
    }

    const path = getPublicAvaliacaoPath(avl, nomeExibicao);
    if (!path) {
      window.alert(
        "Pagina publica ainda indisponivel para esta avaliacao. Atualize a publicacao para gerar o link.",
      );
      return;
    }
    window.open(path, "_blank", "noopener,noreferrer");
  };

  // ── CSS compartilhado para todas as paginas ──────────────────
  const SHARED_CSS = `
        * { box-sizing: border-box; font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; }
        @page { size: A4; margin: 0; }
        body, html { width: 210mm; min-height: 297mm; margin: 0; padding: 0; background: transparent; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { position: relative; width: 210mm; min-height: 297mm; overflow: hidden; page-break-after: always; background: white; }
        .page:last-child { page-break-after: auto; }
        .page-bg { position: absolute; top: 0; left: 0; width: 210mm; height: 297mm; z-index: 0; object-fit: fill; }
        .content { position: relative; z-index: 10; padding: 38mm 18mm 18mm 18mm; min-height: 297mm; display: flex; flex-direction: column; }

        /* Cover */
        .cover-content { justify-content: center; align-items: flex-start; padding-left: 28mm; padding-right: 28mm; }
        .cover-title { font-size: 52px; font-weight: 950; color: #0d0d1a; text-transform: uppercase; letter-spacing: 0.06em; line-height: 1; margin-bottom: 32mm; }
        .cover-info { margin-bottom: 18mm; }
        .cover-name { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
        .cover-email { font-size: 13px; color: #444; margin-bottom: 14mm; }
        .cover-box { border: 2px solid #1a1a2e; border-radius: 8px; padding: 14px 20px; display: inline-block; background: rgba(255,255,255,0.85); }
        .cover-box-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 4px; }
        .cover-box-value { font-size: 16px; font-weight: 700; color: #1a1a2e; }

        /* Avaliacao page */
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .header-info { margin-bottom: 0; flex: 1; min-width: 0; }
        .header-title { font-size: 16px; font-weight: 800; margin-bottom: 8px; color: #000; text-transform: uppercase; max-width: 110mm; }
        .header-info div { font-size: 12px; margin-bottom: 3px; color: #333; }
        .meta-inline { margin-top: 8px; font-size: 11px; line-height: 1.35; color: #333; max-width: 115mm; }
        .meta-inline div { margin-bottom: 2px; }
        .etapa-badge { display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 4px; margin-bottom: 6px; }
        .etapa-badge.anterior { background: #f0f0f0; color: #666; border: 1px solid #ddd; }
        .etapa-badge.atual { background: #1a1a2e; color: #fff; }

        .criterios-list { margin-top: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
        .criterio-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding: 8px 0; page-break-inside: avoid; }
        .crit-text { font-size: 12px; font-weight: 500; width: 75%; padding-right: 15px; line-height: 1.4; color: #222; }
        .crit-concept { font-size: 11px; font-weight: 800; width: 25%; text-align: right; text-transform: uppercase; color: #000; display: flex; align-items: center; justify-content: flex-end; }

        .conceito-geral-section { margin-top: 18px; text-align: right; page-break-inside: avoid; }
        .conceito-geral-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; letter-spacing: 0.1em; }
        .conceito-geral-value { font-size: 16px; font-weight: 900; margin-top: 4px; text-transform: uppercase; }

        .comentario-section { margin-top: 18px; flex-grow: 1; display: flex; flex-direction: column; page-break-inside: avoid; }
        .comentario-title { font-size: 10px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.1em; }
        .comentario-body { flex-grow: 1; min-height: 58mm; font-size: 12px; line-height: 1.55; text-align: justify; color: #333; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: rgba(255, 255, 255, 0.76); }
        .side-stack { width: 210px; display: flex; flex-direction: column; gap: 8px; }
        .info-card { border: 1px solid #d8d8d8; border-radius: 10px; padding: 8px; page-break-inside: avoid; background: rgba(255,255,255,0.92); }
        .validacao-section { display: flex; align-items: center; gap: 8px; }
        .aluno-section { min-height: 52px; display: flex; flex-direction: column; justify-content: center; }
        .aluno-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin-bottom: 2px; }
        .aluno-nome { font-size: 11px; font-weight: 700; color: #111; line-height: 1.3; }
        .validacao-qr { width: 72px; height: 72px; object-fit: contain; border: 1px solid #ddd; padding: 4px; background: #fff; flex-shrink: 0; image-rendering: crisp-edges; }
        .validacao-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin-bottom: 4px; }
        .validacao-text { font-size: 9px; color: #222; line-height: 1.3; }
    `;

  // ── Helper: build a single evaluation page ──────────────────
  const buildEvaluationPageHtml = (
    avl: AvaliacaoAluno,
    nomeAlunoImpressao: string,
    isAtual: boolean,
    qrCodeUrl: string | null,
    publicAvaliacaoUrl: string | null,
    avaliadoresRows: string,
    validadoresRows: string,
  ) => {
    const formatConceito = (c: string | null) => {
      if (!c) return "EM AVALIACAO";
      return c;
    };

    const etapaLabel = isAtual ? "atual" : "anterior";
    const etapaText = isAtual ? "Etapa Atual" : "Etapa Anterior";

    const criteriaRows = (avl.criterios || [])
      .map(
        (c) => `
            <div class="criterio-row">
                <div class="crit-text">${c.criterio}</div>
                <div class="crit-concept">${formatConceito(c.conceito)}</div>
            </div>
        `,
      )
      .join("");

    const sideStack =
      isAtual && publicAvaliacaoUrl && qrCodeUrl
        ? `
          <div class="side-stack">
              <div class="info-card aluno-section">
                  <div class="aluno-title">Aluno(a)</div>
                  <div class="aluno-nome">${nomeAlunoImpressao}</div>
              </div>
              <div class="info-card validacao-section">
                  <img src="${qrCodeUrl}" class="validacao-qr" />
                  <div>
                     <div class="validacao-title">Validacao</div>
                      <div class="validacao-text">Documento oficial SPED Digital.</div>
                  </div>
              </div>
          </div>
          `
        : `
          <div class="side-stack">
              <div class="info-card aluno-section">
                  <div class="aluno-title">Aluno(a)</div>
                  <div class="aluno-nome">${nomeAlunoImpressao}</div>
              </div>
          </div>
          `;

    return `
            <div class="page">
               <img src="https://spedppull.b-cdn.net/site/fundo_avaliacao.png" class="page-bg" />
               <div class="content">
                      <div class="header-top">
                          <div class="header-info">
                              <span class="etapa-badge ${etapaLabel}">${etapaText}: ${avl.etapa}</span>
                              <div class="header-title">${avl.curso_nome}</div>
                              <div><strong>Turma:</strong> ${avl.turma_nome}</div>
                              <div><strong>Ano/Semestre:</strong> ${avl.ano_semestre}</div>
                              <div class="meta-inline">
                                  ${avaliadoresRows}
                                  ${validadoresRows}
                              </div>
                          </div>
                          ${sideStack}
                      </div>

                  <div class="criterios-list">
                     ${criteriaRows}
                  </div>

                  ${
                    avl.conceito_geral
                      ? `
                  <div class="conceito-geral-section">
                      <div class="conceito-geral-title">Conceito Geral</div>
                      <div class="conceito-geral-value">${formatConceito(avl.conceito_geral)}</div>
                  </div>
                  `
                      : ""
                  }

                  ${
                    avl.comentario
                      ? `
                  <div class="comentario-section">
                      <div class="comentario-title">Comentario</div>
                      <div class="comentario-body">${avl.comentario.replace(/\n/g, "<br>")}</div>
                  </div>
                  `
                      : ""
                  }
               </div>
            </div>
        `;
  };

  // ── Helper: build cover page ────────────────────────────────
  const buildCoverPageHtml = (
    nomeAluno: string,
    emailAluno: string,
    cursoNome: string,
    turmaNome: string,
  ) => {
    return `
            <div class="page">
               <img src="https://spedppull.b-cdn.net/site/fundo_avaliacao.png" class="page-bg" />
               <div class="content cover-content">
                  <div class="cover-title">RELATÓRIO FINAL</div>
                  <div class="cover-info">
                      <div class="cover-name">${nomeAluno}</div>
                      <div class="cover-email">${emailAluno}</div>
                  </div>
                  <div class="cover-box">
                      <div class="cover-box-label">Curso / Turno</div>
                      <div class="cover-box-value">${cursoNome} &mdash; ${turmaNome}</div>
                  </div>
               </div>
            </div>
        `;
  };

  const printAvaliacao = async (
    avl: AvaliacaoAluno,
    nomeAlunoImpressao: string,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    const formatConceito = (c: string | null) => {
      if (!c) return "EM AVALIACAO";
      return c;
    };

    // ── Relatorio Final: buscar todas as avaliacoes do contexto ──
    const isRelatorioFinal = avl.etapa === "Relatório Final";
    let todasAvaliacoes: AvaliacaoAluno[] = [avl];

    if (isRelatorioFinal) {
      try {
        const data = await ofetch<AvaliacaoAluno[]>(
          "/api/avaliacao-alunos/avaliacoes-relatorio-final",
          { params: { id_avaliacao: avl.id_avaliacao } },
        );
        if (Array.isArray(data) && data.length) {
          todasAvaliacoes = data;
        }
      } catch (e) {
        console.error("Erro ao buscar avaliacoes para relatorio final:", e);
      }
    }

    // ── Preparar dados da avaliacao principal (QR code, etc) ──
    let publicAvaliacaoData: PublicAvaliacaoNomes | null = null;

    try {
      await refreshPublicToken(avl);
    } catch (error) {
      console.error(error);
    }

    const publicAvaliacaoUrl = getPublicAvaliacaoUrl(avl, nomeExibicao);
    const qrCodeUrl = getPublicQrcodeUrl(avl, nomeExibicao, 900);

    try {
      const token = getEffectiveToken(avl);
      if (token) {
        const response = await ofetch<{
          ok: boolean;
          avaliacao: PublicAvaliacaoNomes | null;
        }>(`/api/avaliacao-publica/${token}`);
        publicAvaliacaoData = response?.avaliacao || null;
      }
    } catch (error) {
      console.error(error);
    }

    // Só bloqueia se for avaliacao unica sem QR code
    if (!isRelatorioFinal && (!publicAvaliacaoUrl || !qrCodeUrl)) {
      window.alert(
        "Nao foi possivel gerar QR Code publico para esta impressao.",
      );
      return;
    }

    const avaliadoresRows = `
            <div><strong>Avaliador(a) 1:</strong> ${publicAvaliacaoData?.avaliador_1_nome || getNomeAvaliador(avl.avaliadores?.[0])}</div>
            <div><strong>Avaliador(a) 2:</strong> ${publicAvaliacaoData?.avaliador_2_nome || getNomeAvaliador(avl.avaliadores?.[1])}</div>
        `;

    const validadoresRows = `
            <div><strong>Coordenador(a):</strong> ${publicAvaliacaoData?.coordenador_nome || getNomeCompleto(avl.validadores?.coordenador)}</div>
            <div><strong>Pedagogo(a):</strong> ${publicAvaliacaoData?.pedagogo_nome || getNomeCompleto(avl.validadores?.pedagogo)}</div>
        `;

    // ── Montar HTML com multiplas paginas ──────────────────
    let pagesHtml = "";

    if (isRelatorioFinal) {
      // Capa
      const emailAluno = store.user?.email || "";
      pagesHtml += buildCoverPageHtml(
        nomeAlunoImpressao,
        emailAluno,
        avl.curso_nome,
        avl.turma_nome,
      );

      // Relatorio Final primeiro, depois as anteriores
      const anteriores = todasAvaliacoes.filter(
        (e: any) => e.id_avaliacao !== avl.id_avaliacao,
      );
      pagesHtml += buildEvaluationPageHtml(
        avl,
        nomeAlunoImpressao,
        true,
        qrCodeUrl,
        publicAvaliacaoUrl,
        avaliadoresRows,
        validadoresRows,
      );
      for (const evalItem of anteriores) {
        pagesHtml += buildEvaluationPageHtml(
          evalItem,
          nomeAlunoImpressao,
          false,
          null,
          null,
          avaliadoresRows,
          validadoresRows,
        );
      }
    } else {
      // Avaliacao unica (comportamento original)
      pagesHtml += buildEvaluationPageHtml(
        avl,
        nomeAlunoImpressao,
        true,
        qrCodeUrl,
        publicAvaliacaoUrl,
        avaliadoresRows,
        validadoresRows,
      );
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Avaliacao - ${avl.etapa}</title>
            <style>${SHARED_CSS}</style>
          </head>
          <body>
            ${pagesHtml}
          </body>
        </html>
        `;

    // Criar Iframe
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

    const printNow = () => {
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

    const waitForImages = () => {
      const images = doc.images;
      if (!images.length) {
        printNow();
        return;
      }

      let loadedCount = 0;
      const checkComplete = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          printNow();
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

    iframe.onload = () => waitForImages();
    setTimeout(() => waitForImages(), 500); // Seguranca
  };

  return {
    tokenOverrides,
    getNomeCompleto,
    getNomeAvaliador,
    getEffectiveToken,
    getPublicAvaliacaoPath,
    getPublicAvaliacaoUrl,
    getPublicQrcodeUrl,
    fetchNomeOptions,
    refreshPublicToken,
    openPublicAvaliacao,
    printAvaliacao,
  };
}
