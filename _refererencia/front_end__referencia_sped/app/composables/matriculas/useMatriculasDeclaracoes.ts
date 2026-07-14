import { $fetch as ofetch } from "ofetch";
import { formatInTimeZone } from "date-fns-tz";
import { formatDate as formatDateSP } from "~/utils/date";
import { useToast } from "../../../composables/useToast";

type NomeExibicaoModo = "registro" | "social" | "artistico";
type NomeExibicaoAcao = "print" | "public";

const DECLARATION_TIMEZONE = "America/Sao_Paulo";

export function useMatriculasDeclaracoes() {
  const { showToast } = useToast();

  // Data
  const declaracoes = ref<any[]>([]);
  const isLoading = ref(false);

  // Status modal
  const modalStatusOpen = ref(false);
  const selectedDeclaration = ref<any>(null);

  // Name choice modal
  const showPrintNameModal = ref(false);
  const printTargetDeclaration = ref<any | null>(null);
  const printNameOptions = ref<any[]>([]);
  const printNameLoading = ref(false);
  const nameAction = ref<NomeExibicaoAcao>("print");

  // Token overrides
  const tokenOverrides = ref<
    Record<
      string,
      { token: string; expiraEm: string | null; tokenValidacao: string | null }
    >
  >({});

  // Date editing
  const editingDateId = ref<string | null>(null);
  const savingDateId = ref<string | null>(null);
  const dateDrafts = reactive<Record<string, string>>({});

  // --- Fetch ---
  const fetchDeclaracoes = async (
    anoSemestre: string,
    filters: {
      area: string;
      curso: string;
      turno: string;
      status_declaracao: string;
      busca: string;
    },
  ) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch("/api/aluno/historico-declaracoes", {
        params: {
          ano_semestre: anoSemestre,
          area: filters.area || null,
          id_turma: filters.curso || null,
          turno: filters.turno || null,
          status: filters.status_declaracao || null,
          busca: filters.busca || null,
        },
      });
      declaracoes.value = data || [];
    } catch (e) {
      console.error("Erro ao buscar declarações:", e);
    } finally {
      isLoading.value = false;
    }
  };

  // --- Status Modal ---
  const openStatusModal = (item: any) => {
    selectedDeclaration.value = item;
    modalStatusOpen.value = true;
  };

  const saveDeclarationStatus = async (aprovado: boolean | null) => {
    if (!selectedDeclaration.value) return;
    try {
      await ofetch("/api/matriculas/declaracao-status", {
        method: "POST",
        body: {
          id_declaracao: selectedDeclaration.value.id_declaracao,
          aprovado,
        },
      });
      const statusText =
        aprovado === true
          ? "aprovada"
          : aprovado === false
            ? "reprovada"
            : "definida como pendente";
      showToast(`Declaração ${statusText} com sucesso!`, { type: "success" });
      modalStatusOpen.value = false;
      await fetchDeclaracoes("", {} as any); // will be called with real params from page
    } catch (e: any) {
      console.error("Erro ao atualizar declaração:", e);
      showToast("Erro ao atualizar status da declaração.", { type: "error" });
    }
  };

  // --- Name Choice Modal ---
  const closePrintNameModal = () => {
    showPrintNameModal.value = false;
    printTargetDeclaration.value = null;
    printNameOptions.value = [];
    printNameLoading.value = false;
  };

  const openNameChoiceModal = async (item: any, action: NomeExibicaoAcao) => {
    if (action === "public" && item.aprovado !== true) {
      showToast(
        "Página pública disponível apenas para declarações aprovadas.",
        { type: "error" },
      );
      return;
    }
    printTargetDeclaration.value = item;
    showPrintNameModal.value = true;
    printNameLoading.value = true;
    printNameOptions.value = [];
    nameAction.value = action;
    try {
      const data = (await ofetch("/api/declaracoes/opcoes-nome-impressao", {
        params: { id_matricula: item.id_matricula },
      })) as { ok: boolean; opcoes: any[] };
      printNameOptions.value = data.opcoes || [];
    } catch (error) {
      console.error(error);
      showToast("Não foi possível carregar as opções de nome para impressão.", {
        type: "error",
      });
      closePrintNameModal();
    } finally {
      printNameLoading.value = false;
    }
  };

  const confirmNameChoice = async (opcao: any) => {
    if (!printTargetDeclaration.value || !opcao.disponivel || !opcao.valor)
      return;
    const item = printTargetDeclaration.value;
    const action = nameAction.value;
    closePrintNameModal();
    if (action === "public") {
      await openPublicDeclaration(item, opcao.tipo || "registro");
    } else {
      await openDeclaration(item, opcao.valor, opcao.tipo || "registro");
    }
  };

  // --- Tokens & URLs ---
  const getEffectiveToken = (item: any) =>
    tokenOverrides.value[item.id_declaracao]?.token ||
    item.token_publico ||
    null;
  const getEffectiveValidationToken = (item: any) =>
    tokenOverrides.value[item.id_declaracao]?.tokenValidacao ||
    item.token_validacao_publica ||
    null;

  const refreshPublicToken = async (item: any) => {
    const data = (await ofetch("/api/declaracao/renovar-token", {
      method: "POST",
      body: { id_declaracao: item.id_declaracao },
    })) as {
      ok: boolean;
      token_publico: string;
      token_publico_expira_em: string | null;
      token_validacao_publica: string | null;
    };
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

  const getPublicPath = (
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

  const getPublicUrl = (
    item: any,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    const path = getPublicPath(item, nomeExibicao);
    if (!path || !import.meta.client) return null;
    return `${window.location.origin}${path}`;
  };

  const getValidationUrl = (
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

  const getQrcodeUrl = (
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
      showToast("Não foi possível renovar o link público desta declaração.", {
        type: "error",
      });
      return;
    }
    const path = getPublicPath(item, nomeExibicao);
    if (!path) {
      showToast("Página pública ainda indisponível para esta declaração.", {
        type: "error",
      });
      return;
    }
    window.open(path, "_blank", "noopener,noreferrer");
  };

  // --- Date Editor ---
  const getDateInputValue = (dateString?: string | null) => {
    if (!dateString) return "";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return "";
    return formatInTimeZone(parsedDate, DECLARATION_TIMEZONE, "yyyy-MM-dd");
  };

  const openDateEditor = (item: any) => {
    editingDateId.value = item.id_declaracao;
    dateDrafts[item.id_declaracao] = getDateInputValue(item.dt_matricula);
  };

  const cancelDateEdit = (idDeclaracao: string) => {
    if (editingDateId.value === idDeclaracao) editingDateId.value = null;
    delete dateDrafts[idDeclaracao];
  };

  const saveMatriculaDate = async (item: any) => {
    const draftDate = dateDrafts[item.id_declaracao];
    if (!draftDate) {
      showToast("Informe uma data de matrícula válida.", { type: "error" });
      return;
    }
    try {
      savingDateId.value = item.id_declaracao;
      await ofetch("/api/matriculas/declaracao-data-matricula", {
        method: "POST",
        body: {
          id_declaracao: item.id_declaracao,
          data_matricula: draftDate,
          data_matricula_modificada: true,
        },
      });
      showToast("Data de matrícula ajustada com sucesso.", { type: "success" });
      cancelDateEdit(item.id_declaracao);
    } catch (e) {
      console.error("Erro ao atualizar data de matrícula:", e);
      showToast("Erro ao atualizar a data de matrícula.", { type: "error" });
    } finally {
      savingDateId.value = null;
    }
  };

  const restoreMatriculaDate = async (item: any) => {
    try {
      savingDateId.value = item.id_declaracao;
      await ofetch("/api/matriculas/declaracao-data-matricula", {
        method: "POST",
        body: {
          id_declaracao: item.id_declaracao,
          data_matricula: null,
          data_matricula_modificada: false,
        },
      });
      showToast("Data original da matrícula restaurada com sucesso.", {
        type: "success",
      });
      cancelDateEdit(item.id_declaracao);
    } catch (e) {
      console.error("Erro ao restaurar data original:", e);
      showToast("Erro ao restaurar a data original.", { type: "error" });
    } finally {
      savingDateId.value = null;
    }
  };

  // --- PDF Generation ---
  const generateStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        * { box-sizing: border-box; font-family: 'Roboto', Arial, sans-serif; }
        body { margin: 0; padding: 0; }
        @page { size: A4; margin: 0; }
        .pagina { width: 210mm; height: 297mm; background-image: url('https://spedppull.b-cdn.net/site/nova_declaracao_eleitoral.png'); background-size: cover; background-position: center; background-repeat: no-repeat; position: relative; }
        .conteudo { position: absolute; top: 32.9%; left: 15%; right: 15%; text-align: justify; font-size: 14px; line-height: 1.6; color: #000; font-family: 'Roboto', sans-serif; }
        .data-local { text-align: right; margin-bottom: 0; }
        .top-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; margin-bottom: 8px; }
        .validacao-box { margin: 0; padding: 8px; border: 1px solid #d9d9d9; border-radius: 8px; background: rgba(255,255,255,0.92); display: flex; align-items: center; gap: 8px; width: 62%; max-width: 300px; transform: translateY(-5px); }
        .validacao-qr { width: 72px; height: 72px; border: 1px solid #d9d9d9; border-radius: 6px; padding: 3px; background: #fff; object-fit: contain; }
        .validacao-texto h4 { margin: 0 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .validacao-texto p { margin: 0; font-size: 10px; line-height: 1.45; }
        .validacao-url { overflow-wrap: anywhere; word-break: break-word; }
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
      formatDateSP(item.criado_em || new Date().toISOString()) || "--";
    const qtdSemestres =
      item.qtd_semestres !== undefined && item.qtd_semestres !== null
        ? item.qtd_semestres
        : "0";
    const cargaHorariaHoras = Math.floor(
      (item.carga_horaria_minutos || 0) / 60,
    );
    const numSemestreAtual = item.num_semestre_atual || 0;
    const semestreText = Number(qtdSemestres) === 1 ? "semestre" : "semestres";
    const horaText = cargaHorariaHoras === 1 ? "hora" : "horas";
    const dataMatriculaFormatada = formatDateSP(item.dt_matricula) || "--";
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
    return `<div class="pagina"><img src="https://spedppull.b-cdn.net/site/nova_declaracao_eleitoral.png" style="display:none;" /><div class="conteudo">${validationUrl && qrCodeUrl ? `<div class="top-row"><div class="validacao-box"><img class="validacao-qr" src="${qrCodeUrl}" alt="QR de validação" /><div class="validacao-texto"><h4>Validação Institucional</h4><p>Valide pelo QR ou URL:</p><p class="validacao-url"><strong>${validationUrl}</strong></p></div></div><div class="data-local">São Paulo, ${dataDeclaracao}</div></div>` : ""}${!validationUrl || !qrCodeUrl ? `<div class="data-local">São Paulo, ${dataDeclaracao}</div>` : ""}<p>Declaramos que o(a) estudante <strong>${nomeAluno}</strong> portador(a) do CPF: <strong>${cpfAluno}</strong>, está devidamente matriculado(a) no curso <strong>${curso}</strong>, turno <strong>${turno}</strong>, tendo o curso duração de <strong>${qtdSemestres}</strong> ${semestreText} com um total de <strong>${cargaHorariaHoras}</strong> ${horaText}. O(a) estudante foi matriculado(a) em <strong>${dataMatriculaFormatada}</strong> e está no <strong>${getOrdinalSemestre(numSemestreAtual)}</strong>. Ficamos à disposição para quaisquer esclarecimentos.</p></div></div>`;
  };

  const generateFullHTML = (
    item: any,
    nomeAlunoOverride?: string | null,
    validationUrl?: string | null,
    qrCodeUrl?: string | null,
  ) => {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Declaração de Matrícula</title><style>${generateStyles()}</style></head><body>${generateBody(item, nomeAlunoOverride, validationUrl, qrCodeUrl)}</body></html>`;
  };

  const printNow = (iframe: HTMLIFrameElement) => {
    if ((iframe as any)._hasPrinted) return;
    (iframe as any)._hasPrinted = true;
    if (!iframe.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 5000);
  };

  const openDeclaration = async (
    item: any,
    nomeAlunoOverride?: string | null,
    nomeExibicao: NomeExibicaoModo = "registro",
  ) => {
    let hasValidation = item.aprovado === true;
    try {
      if (hasValidation) await refreshPublicToken(item);
    } catch (error) {
      console.error(error);
      hasValidation = false;
      showToast(
        "Não foi possível gerar validação agora. A impressão será aberta sem bloco de validação.",
        { type: "error" },
      );
    }
    const validationUrl = hasValidation
      ? getValidationUrl(item, nomeExibicao)
      : null;
    const qrCodeUrl = hasValidation
      ? getQrcodeUrl(item, nomeExibicao, 900)
      : null;
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

  return {
    declaracoes,
    isLoading,
    fetchDeclaracoes,
    modalStatusOpen,
    selectedDeclaration,
    openStatusModal,
    saveDeclarationStatus,
    showPrintNameModal,
    printNameOptions,
    printNameLoading,
    nameAction,
    openNameChoiceModal,
    closePrintNameModal,
    confirmNameChoice,
    editingDateId,
    savingDateId,
    dateDrafts,
    openDateEditor,
    cancelDateEdit,
    saveMatriculaDate,
    restoreMatriculaDate,
  };
}
