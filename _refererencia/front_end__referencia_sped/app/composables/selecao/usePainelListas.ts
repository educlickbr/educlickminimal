import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

export function usePainelListas() {
  const { showToast } = useToast();
  const isListLoading = ref(false);
  const listasCache = ref<any[] | null>(null);
  const listasCacheKey = ref("");

  // ── Fetch com cache ──────────────────────────────────────
  const getCacheKey = (area: string, anoSemestre: string, dataInicio: string) =>
    JSON.stringify({ area, anoSemestre, dataInicio: dataInicio || null });

  const fetchListData = async (
    area: string,
    anoSemestre: string,
    dataInicio: string,
  ) => {
    const cacheKey = getCacheKey(area, anoSemestre, dataInicio);
    if (listasCache.value && listasCacheKey.value === cacheKey) {
      return listasCache.value;
    }

    isListLoading.value = true;
    try {
      const data = await ofetch("/api/selecao/listas-presenca", {
        params: {
          area,
          anoSemestre,
          dataInicio: dataInicio || undefined,
        },
      });

      const normalized = Array.isArray(data) ? data : [];
      listasCache.value = normalized;
      listasCacheKey.value = cacheKey;
      return normalized;
    } catch (e) {
      console.error("Error fetching listas:", e);
      showToast("Erro ao buscar listas.", { type: "error" });
      return [];
    } finally {
      isListLoading.value = false;
    }
  };

  const clearCache = () => {
    listasCache.value = null;
    listasCacheKey.value = "";
  };

  // ── Print infrastructure ─────────────────────────────────
  const openPrintDocument = (htmlContent: string) => {
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
    setTimeout(() => waitForImages(), 500);
  };

  // ── Styles (apenas lista) ────────────────────────────────
  const listStyles = () => `
        * { box-sizing: border-box; font-family: 'Poppins', Arial, sans-serif; color: #222; font-size: 12.5px; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .pagina { width: 100%; padding: 10mm 6mm 10mm 10mm; }
        .pagina + .pagina { page-break-before: always; }

        .lista-presenca-pagina,
        .lista-numerica-pagina { width: calc(100% - 6mm); margin: 0 auto; padding: 0; }
        .lista-cabecalho { text-align: center; margin-bottom: 8mm; }
        .lista-logo { margin-bottom: 5mm; }
        .lista-logo img { width: 110px; max-width: 100%; display: block; margin: 0 auto; }
        .lista-linha-processo { font-size: 15px; font-weight: 700; margin-bottom: 2mm; }
        .lista-linha-escola { font-size: 12.5px; font-weight: 500; margin-bottom: 2.5mm; }
        .lista-linha-turma { font-size: 16px; font-weight: 700; margin-bottom: 1mm; }
        .lista-linha-turno { font-size: 12.5px; font-weight: 600; margin-bottom: 3mm; }
        .lista-titulo { font-size: 18px; font-weight: 800; letter-spacing: 0.8px; margin-bottom: 0; }
        .lista-tabela { width: 98%; margin: 0 auto; border-collapse: collapse; table-layout: fixed; }
        .lista-tabela th, .lista-tabela td { border: 0.8px solid #555; padding: 7px 8px; vertical-align: middle; }
        .lista-tabela th { font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: left; }
        .lista-tabela td { font-size: 11.5px; height: 13mm; }
        .col-numero { width: 18mm; text-align: center; }
        .col-cpf { width: 38mm; }
        .col-assinatura { width: 50mm; }
        .col-nome-numerica { width: auto; }

        @page { size: A4; margin: 14mm 16mm 14mm 10mm; }
        html, body { width: auto; }
    `;

  // ── Helpers ──────────────────────────────────────────────
  const fmt = (v: any) => (v ? v : "");
  const upper = (v: any) => (v ? String(v).toUpperCase() : "");

  // ── Body generators ──────────────────────────────────────
  const generateListaPresencaBody = (items: any[], tituloProcesso: string) =>
    items
      .map((turma: any) => {
        if (!Array.isArray(turma.alunos) || turma.alunos.length === 0)
          return "";

        const rows = turma.alunos
          .map((aluno: any) => {
            const classificacao = String(aluno.classificacao || "").padStart(
              3,
              "0",
            );

            return `
                <tr>
                    <td class="col-numero">${classificacao}</td>
                    <td>${upper(aluno.nome)}</td>
                    <td class="col-cpf">${fmt(aluno.cpf)}</td>
                    <td class="col-assinatura"></td>
                </tr>
            `;
          })
          .join("");

        return `
            <div class="pagina lista-presenca-pagina">
                <div class="lista-cabecalho">
                    <div class="lista-logo">
                        <img src="https://spedppull.b-cdn.net/site/sped_logo_total%20(1).png" alt="Logo SPED">
                    </div>
                    <div class="lista-linha-processo">${tituloProcesso}</div>
                    <div class="lista-linha-escola">São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas</div>
                    <div class="lista-linha-turma">${fmt(turma.nome_turma)}</div>
                    <div class="lista-linha-turno">${fmt(turma.turno)}</div>
                    <div class="lista-titulo">LISTA DE PRESENÇA</div>
                </div>

                <table class="lista-tabela">
                    <thead>
                        <tr>
                            <th class="col-numero">Nº</th>
                            <th>Nome</th>
                            <th class="col-cpf">CPF</th>
                            <th class="col-assinatura">Assinatura</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
      })
      .join("");

  const generateListaNumericaBody = (items: any[], tituloProcesso: string) =>
    items
      .map((turma: any) => {
        if (!Array.isArray(turma.alunos) || turma.alunos.length === 0)
          return "";

        const rows = turma.alunos
          .map((aluno: any) => {
            const classificacao = String(aluno.classificacao || "").padStart(
              3,
              "0",
            );

            return `
                <tr>
                    <td class="col-numero">${classificacao}</td>
                    <td class="col-nome-numerica">${upper(aluno.nome)}</td>
                </tr>
            `;
          })
          .join("");

        return `
            <div class="pagina lista-numerica-pagina">
                <div class="lista-cabecalho">
                    <div class="lista-logo">
                        <img src="https://spedppull.b-cdn.net/site/sped_logo_total%20(1).png" alt="Logo SPED">
                    </div>
                    <div class="lista-linha-processo">${tituloProcesso}</div>
                    <div class="lista-linha-escola">São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas</div>
                    <div class="lista-linha-turma">${fmt(turma.nome_turma)}</div>
                    <div class="lista-linha-turno">${fmt(turma.turno)}</div>
                    <div class="lista-titulo">LISTA NUMÉRICA</div>
                </div>

                <table class="lista-tabela">
                    <thead>
                        <tr>
                            <th class="col-numero">Nº</th>
                            <th class="col-nome-numerica">Nome</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
      })
      .join("");

  // ── HTML wrappers ────────────────────────────────────────
  const wrapListHTML = (body: string, title: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          ${listStyles()}
        </style>
      </head>
      <body>
        ${body}
      </body>
    </html>
    `;

  // ── Print functions ──────────────────────────────────────
  const printListaPresenca = async (
    tituloProcesso: string,
    specificTurmas?: any[],
  ) => {
    const turmasToPrint =
      specificTurmas && specificTurmas.length > 0
        ? specificTurmas
        : listasCache.value || [];
    if (!turmasToPrint.length) {
      showToast("Nenhuma lista de presença encontrada.", {
        type: "info",
      });
      return;
    }
    const body = generateListaPresencaBody(turmasToPrint, tituloProcesso);
    openPrintDocument(wrapListHTML(body, "Listas de Presença"));
  };

  const printListaNumerica = async (
    tituloProcesso: string,
    specificTurmas?: any[],
  ) => {
    const turmasToPrint =
      specificTurmas && specificTurmas.length > 0
        ? specificTurmas
        : listasCache.value || [];
    if (!turmasToPrint.length) {
      showToast("Nenhuma lista numérica encontrada.", {
        type: "info",
      });
      return;
    }
    const body = generateListaNumericaBody(turmasToPrint, tituloProcesso);
    openPrintDocument(wrapListHTML(body, "Listas Numéricas"));
  };

  const printClassListaPresenca = async (
    turma: any,
    tituloProcesso: string,
    area: string,
    anoSemestre: string,
    dataInicio: string,
  ) => {
    const allTurmas = await fetchListData(area, anoSemestre, dataInicio);
    const turmaParaImprimir = allTurmas.find(
      (item: any) => item.id_turma === turma.id_turma,
    );
    if (!turmaParaImprimir) {
      showToast("Nenhuma lista encontrada para esta turma.", {
        type: "info",
      });
      return;
    }
    await printListaPresenca(tituloProcesso, [turmaParaImprimir]);
  };

  const printClassListaNumerica = async (
    turma: any,
    tituloProcesso: string,
    area: string,
    anoSemestre: string,
    dataInicio: string,
  ) => {
    const allTurmas = await fetchListData(area, anoSemestre, dataInicio);
    const turmaParaImprimir = allTurmas.find(
      (item: any) => item.id_turma === turma.id_turma,
    );
    if (!turmaParaImprimir) {
      showToast("Nenhuma lista numérica encontrada para esta turma.", {
        type: "info",
      });
      return;
    }
    await printListaNumerica(tituloProcesso, [turmaParaImprimir]);
  };

  return {
    isListLoading,
    fetchListData,
    clearCache,
    openPrintDocument,
    printListaPresenca,
    printListaNumerica,
    printClassListaPresenca,
    printClassListaNumerica,
  };
}
