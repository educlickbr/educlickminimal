/**
 * useMinhasAtividades
 *
 * Composable do módulo do ALUNO (consumo de conteúdo).
 * Layout 2 colunas com lazy loading:
 *   Esquerda: árvore acordeon (Programa → Componentes → Módulos/Ciclos → Aulas)
 *   Direita:  conteúdo selecionado (material / atividade / avaliação)
 */

import { ref, computed, watch } from "vue";
import { useAppStore } from "~~/stores/app";

export interface ProgramaAluno {
  id_matricula: string;
  id_programa: string;
  descricao: string;
  curso_nome: string;
  qtd_ciclos: number;
}

export interface ConteudoAluno {
  id_conteudo: string;
  titulo: string;
  tipo: string; // material | atividade | avaliacao
  descricao?: string | null;
  id_arquivo?: string | null;
  url?: string | null;
  status_visibilidade: "disponivel" | "agendado" | "prazo_encerrado";
  data_disponivel?: string | null;
  data_entrega_limite?: string | null;
  duracao_minutos?: number | null;
  tentativas_permitidas?: number | null;
  atividade_status?: string | null; // rascunho | entregue | corrigido
  atividade_nota?: number | null;
  atividade_tentativa?: number | null;
  avaliacao_status?: string | null;
  avaliacao_nota?: number | null;
  avaliacao_tentativa?: number | null;
  concluido: boolean;
}

export interface PerguntaAvaliacao {
  id_pergunta: string;
  tipo: string; // dissertativa | multipla_escolha
  enunciado: string;
  pontuacao: number;
  obrigatoria: boolean;
  ordem: number;
  id_arquivo?: string | null;
  alternativas: { id_resposta_possivel: string; texto: string; ordem: number; id_arquivo?: string | null }[];
}

export interface Resposta {
  id_pergunta: string;
  id_resposta_possivel?: string | null;
  texto_resposta?: string | null;
}

export function useMinhasAtividades(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
}) {
  const store = useAppStore();

  // ── Programas do aluno ─────────────────────────────
  const programas = ref<ProgramaAluno[]>([]);
  const loadingProgramas = ref(false);
  const programaSelecionado = ref<ProgramaAluno | null>(null);

  // ── Estrutura (casca da árvore) ────────────────────
  const estrutura = ref<any>(null);
  const loadingEstrutura = ref(false);

  // ── Conteúdos por escopo (lazy) ────────────────────
  const conteudosMap = ref<Map<string, ConteudoAluno[]>>(new Map());
  const loadingConteudos = ref<Map<string, boolean>>(new Map());

  // ── Acordeon ───────────────────────────────────────
  const expandedSections = ref<Set<string>>(new Set());

  // ── Conteúdo ativo (coluna direita) ────────────────
  const conteudoAtivo = ref<ConteudoAluno | null>(null);

  // ── Avaliação em andamento ─────────────────────────
  const submissaoAvaliacao = ref<{ id: string; tentativa: number; duracao_minutos: number | null; data_entrega_limite: string | null } | null>(null);
  const perguntasAvaliacao = ref<PerguntaAvaliacao[]>([]);
  const respostasAvaliacao = ref<Resposta[]>([]);
  const loadingAvaliacao = ref(false);
  const savingAvaliacao = ref(false);

  // ── Atividade em edição ────────────────────────────
  const textoAtividade = ref("");
  const arquivoAtividade = ref<string | null>(null);
  const savingAtividade = ref(false);

  function toggleSection(key: string) {
    const s = new Set(expandedSections.value);
    if (s.has(key)) s.delete(key); else s.add(key);
    expandedSections.value = s;
    if (s.has(key)) carregarConteudosSeNecessario(key);
  }

  function isExpanded(key: string): boolean {
    return expandedSections.value.has(key);
  }

  // ── Helpers de escopo ──────────────────────────────
  function escopoKeyToParams(key: string): { escopo_tipo: string; escopo_id: string } | null {
    if (key === "programa") return { escopo_tipo: "programa", escopo_id: programaSelecionado.value?.id_programa || "" };
    if (key.startsWith("componente:")) return { escopo_tipo: "componente", escopo_id: key.split(":")[1] || "" };
    if (key.startsWith("modulo:")) return { escopo_tipo: "modulo", escopo_id: key.split(":")[1] || "" };
    if (key.startsWith("calendario:")) return { escopo_tipo: "calendario", escopo_id: key.split(":")[1] || "" };
    return null;
  }

  async function carregarConteudosSeNecessario(key: string) {
    if (conteudosMap.value.has(key)) return;
    const escopo = escopoKeyToParams(key);
    if (!escopo || !escopo.escopo_id || !programaSelecionado.value) return;

    const lm = new Map(loadingConteudos.value);
    lm.set(key, true);
    loadingConteudos.value = lm;

    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/conteudos", {
        params: {
          id_programa: programaSelecionado.value.id_programa,
          id_entidade,
          id_matricula: programaSelecionado.value.id_matricula,
          escopo_tipo: escopo.escopo_tipo,
          escopo_id: escopo.escopo_id,
        },
      })) as any;

      const itens = Array.isArray(res?.conteudos) ? res.conteudos : [];
      const m = new Map(conteudosMap.value);
      m.set(key, itens);
      conteudosMap.value = m;
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar conteúdos", { type: "error" });
    } finally {
      const lm2 = new Map(loadingConteudos.value);
      lm2.set(key, false);
      loadingConteudos.value = lm2;
    }
  }

  function getConteudos(key: string): ConteudoAluno[] {
    return conteudosMap.value.get(key) || [];
  }

  function isLoadingConteudos(key: string): boolean {
    return loadingConteudos.value.get(key) || false;
  }

  // ── Helpers de árvore ──────────────────────────────
  function aulasDoModulo(idModulo: string): any[] {
    if (!estrutura.value?.ciclos || !estrutura.value?.aulas) return [];
    const ciclosDoMod = estrutura.value.ciclos.filter((c: any) => c.id_modulo === idModulo);
    const idsCiclos = new Set(ciclosDoMod.map((c: any) => c.id));
    return estrutura.value.aulas.filter((a: any) => idsCiclos.has(a.id_ciclo));
  }

  // ── Fetch programas ────────────────────────────────
  async function fetchProgramas() {
    loadingProgramas.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/programas", {
        params: { id_entidade, id_usuario: store.user_expandido_id },
      })) as any;
      programas.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar programas", { type: "error" });
    } finally {
      loadingProgramas.value = false;
    }
  }

  // ── Selecionar programa (entrar no curso) ──────────
  async function selecionarPrograma(prog: ProgramaAluno) {
    programaSelecionado.value = prog;
    estrutura.value = null;
    conteudosMap.value = new Map();
    expandedSections.value = new Set();
    conteudoAtivo.value = null;
    submissaoAvaliacao.value = null;
    perguntasAvaliacao.value = [];
    respostasAvaliacao.value = [];
    textoAtividade.value = "";
    arquivoAtividade.value = null;

    loadingEstrutura.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/estrutura", {
        params: { id_programa: prog.id_programa, id_entidade },
      })) as any;
      estrutura.value = res;
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar curso", { type: "error" });
    } finally {
      loadingEstrutura.value = false;
    }
  }

  function voltarParaCursos() {
    programaSelecionado.value = null;
    estrutura.value = null;
    conteudosMap.value = new Map();
    conteudoAtivo.value = null;
    submissaoAvaliacao.value = null;
    perguntasAvaliacao.value = [];
    respostasAvaliacao.value = [];
    textoAtividade.value = "";
    arquivoAtividade.value = null;
  }

  // ── Selecionar conteúdo (coluna direita) ───────────
  function selecionarConteudo(item: ConteudoAluno) {
    conteudoAtivo.value = item;
    // Pré-preenche rascunho se existir
    if (item.tipo === "atividade" && item.atividade_status === "rascunho") {
      // Rascunho não traz o texto na listagem — busca detalhe? Para v1,
      // o aluno continua de onde parou apenas ao reabrir (draft salvo).
    }
    // Se já entregue, bloqueia edição
  }

  // ── Material: abrir arquivo ─────────────────────────
  async function abrirArquivo(id: string) {
    try {
      const res = (await $fetch("/api/r2/sign", { params: { id } })) as any;
      if (res?.signedUrl) window.open(res.signedUrl, "_blank");
    } catch (e) {
      deps.toast.showToast("Erro ao abrir arquivo", { type: "error" });
    }
  }

  // ── Material: marca como visto/concluído ────────────
  async function marcarMaterialVisto() {
    if (!conteudoAtivo.value || !programaSelecionado.value) return;
    if (conteudoAtivo.value.concluido) return;
    try {
      const id_entidade = await deps.garantirEntidade();
      await $fetch("/api/minhas_atividades/progresso", {
        method: "POST",
        body: {
          id_conteudo: conteudoAtivo.value.id_conteudo,
          id_entidade,
          id_matricula: programaSelecionado.value.id_matricula,
        },
      });
      conteudoAtivo.value.concluido = true;
      atualizarConteudoNaArvore(conteudoAtivo.value);
    } catch (e) {
      // Falha silenciosa — não bloqueia a abertura do material
    }
  }

  // ── Atividade: salvar rascunho / entregar ──────────
  async function salvarAtividade(status: "rascunho" | "entregue") {
    if (!conteudoAtivo.value || !programaSelecionado.value) return;
    if (status === "entregue" && !textoAtividade.value.trim() && !arquivoAtividade.value) {
      deps.toast.showToast("Escreva uma resposta ou anexe um arquivo", { type: "error" });
      return;
    }
    savingAtividade.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/atividade", {
        method: "POST",
        body: {
          id_conteudo: conteudoAtivo.value.id_conteudo,
          id_entidade,
          id_matricula: programaSelecionado.value.id_matricula,
          texto_resposta: textoAtividade.value || null,
          id_arquivo_envio: arquivoAtividade.value || null,
          status,
        },
      })) as any;

      if (res?.success) {
        deps.toast.showToast(status === "entregue" ? "Atividade entregue!" : "Rascunho salvo", { type: "success" });
        conteudoAtivo.value.atividade_status = status;
        conteudoAtivo.value.concluido = status === "entregue";
        if (status === "entregue") {
          conteudoAtivo.value.atividade_tentativa = res.tentativa || 1;
        }
        // Atualiza a lista da árvore
        atualizarConteudoNaArvore(conteudoAtivo.value);
      }
    } catch (e: any) {
      if (e?.statusCode === 409) {
        deps.toast.showToast("Prazo de envio expirado", { type: "error" });
        conteudoAtivo.value.status_visibilidade = "prazo_encerrado";
      } else {
        deps.toast.showToast(e?.statusMessage || e?.message || "Erro ao salvar", { type: "error" });
      }
    } finally {
      savingAtividade.value = false;
    }
  }

  // ── Avaliação: iniciar ─────────────────────────────
  async function iniciarAvaliacao() {
    if (!conteudoAtivo.value || !programaSelecionado.value) return;
    loadingAvaliacao.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/avaliacao/iniciar", {
        method: "POST",
        body: {
          id_conteudo: conteudoAtivo.value.id_conteudo,
          id_entidade,
          id_matricula: programaSelecionado.value.id_matricula,
        },
      })) as any;

      if (res?.success) {
        submissaoAvaliacao.value = {
          id: res.id,
          tentativa: res.tentativa,
          duracao_minutos: res.duracao_minutos,
          data_entrega_limite: res.data_entrega_limite,
        };
        await carregarPerguntasAvaliacao();
        iniciarTimer(res.duracao_minutos, res.data_entrega_limite);
      }
    } catch (e: any) {
      if (e?.statusCode === 409) {
        deps.toast.showToast("Prazo de envio expirado", { type: "error" });
      } else {
        deps.toast.showToast(e?.statusMessage || e?.message || "Erro ao iniciar", { type: "error" });
      }
    } finally {
      loadingAvaliacao.value = false;
    }
  }

  async function carregarPerguntasAvaliacao() {
    if (!conteudoAtivo.value || !programaSelecionado.value) return;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/avaliacao", {
        params: {
          id_conteudo: conteudoAtivo.value.id_conteudo,
          id_entidade,
          id_matricula: programaSelecionado.value.id_matricula,
        },
      })) as any;

      if (res?.success && Array.isArray(res.perguntas)) {
        perguntasAvaliacao.value = res.perguntas;
        respostasAvaliacao.value = res.perguntas.map((p: any) => ({
          id_pergunta: p.id_pergunta,
          id_resposta_possivel: null,
          texto_resposta: null,
        }));
      }
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar avaliação", { type: "error" });
    }
  }

  // ── Avaliação: marcar resposta ─────────────────────
  function marcarAlternativa(idPergunta: string, idResposta: string) {
    const r = respostasAvaliacao.value.find((x) => x.id_pergunta === idPergunta);
    if (r) {
      r.id_resposta_possivel = idResposta;
      r.texto_resposta = null;
    }
  }

  function marcarTexto(idPergunta: string, texto: string) {
    const r = respostasAvaliacao.value.find((x) => x.id_pergunta === idPergunta);
    if (r) {
      r.texto_resposta = texto;
      r.id_resposta_possivel = null;
    }
  }

  // ── Avaliação: finalizar ───────────────────────────
  async function finalizarAvaliacao() {
    if (!submissaoAvaliacao.value) return;
    savingAvaliacao.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/avaliacao/finalizar", {
        method: "POST",
        body: {
          id_submissao: submissaoAvaliacao.value.id,
          id_entidade,
          respostas: respostasAvaliacao.value,
        },
      })) as any;

      if (res?.success) {
        deps.toast.showToast("Avaliação entregue!", { type: "success" });
        if (conteudoAtivo.value) {
          conteudoAtivo.value.avaliacao_status = "entregue";
          conteudoAtivo.value.concluido = true;
          atualizarConteudoNaArvore(conteudoAtivo.value);
        }
        submissaoAvaliacao.value = null;
        perguntasAvaliacao.value = [];
        respostasAvaliacao.value = [];
      }
    } catch (e: any) {
      if (e?.statusCode === 409) {
        deps.toast.showToast("Prazo de envio expirado", { type: "error" });
        pararTimer();
        if (conteudoAtivo.value) {
          conteudoAtivo.value.status_visibilidade = "prazo_encerrado";
          atualizarConteudoNaArvore(conteudoAtivo.value);
        }
        submissaoAvaliacao.value = null;
        perguntasAvaliacao.value = [];
        respostasAvaliacao.value = [];
      } else {
        deps.toast.showToast(e?.statusMessage || e?.message || "Erro ao enviar", { type: "error" });
      }
    } finally {
      savingAvaliacao.value = false;
    }
  }

  // ── Atualiza item na árvore após ação ──────────────
  function atualizarConteudoNaArvore(item: ConteudoAluno) {
    for (const [key, lista] of conteudosMap.value.entries()) {
      const idx = lista.findIndex((c) => c.id_conteudo === item.id_conteudo);
      if (idx >= 0) {
        const nova = [...lista];
        nova[idx] = { ...item };
        const m = new Map(conteudosMap.value);
        m.set(key, nova);
        conteudosMap.value = m;
      }
    }
  }

  // ── Computed ───────────────────────────────────────
  const podeEntregar = computed(() => {
    const c = conteudoAtivo.value;
    if (!c) return false;
    return c.status_visibilidade === "disponivel" && c.atividade_status !== "entregue";
  });

  const podeIniciarAvaliacao = computed(() => {
    const c = conteudoAtivo.value;
    if (!c) return false;
    return c.status_visibilidade === "disponivel" && c.avaliacao_status !== "entregue" && !submissaoAvaliacao.value;
  });

  // ── Timer ──────────────────────────────────────────
  const tempoRestanteSeg = ref(0);
  const timerAtivo = ref(false);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let autoFinalizeDisparado = false;

  function iniciarTimer(duracaoMinutos: number | null, dataEntregaLimite?: string | null) {
    pararTimer();
    autoFinalizeDisparado = false;

    // Prioriza o prazo do currículo (data_entrega_limite do servidor);
    // sem prazo, usa a duração da avaliação a partir de agora.
    let limite: number | null = null;
    if (dataEntregaLimite) {
      const t = new Date(dataEntregaLimite).getTime();
      if (!Number.isNaN(t)) limite = t;
    }
    if (limite === null && duracaoMinutos) {
      limite = Date.now() + duracaoMinutos * 60000;
    }
    if (limite === null) return;

    tempoRestanteSeg.value = Math.max(0, Math.floor((limite - Date.now()) / 1000));
    timerAtivo.value = true;
    timerInterval = setInterval(() => {
      tempoRestanteSeg.value = Math.max(0, Math.floor((limite - Date.now()) / 1000));
      // Dispara o envio automático ~3s antes do fim para não esbarrar
      // no PRAZO_EXPIRADO do servidor (data_entrega_limite < NOW()).
      if (tempoRestanteSeg.value <= 3 && !autoFinalizeDisparado) {
        autoFinalizeDisparado = true;
        finalizarAvaliacao();
      }
      if (tempoRestanteSeg.value <= 0) {
        pararTimer();
      }
    }, 1000);
  }

  function pararTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerAtivo.value = false;
  }

  function tempoFormatado(): string {
    const s = tempoRestanteSeg.value;
    const min = Math.floor(s / 60);
    const seg = s % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  }

  return {
    // Programas
    programas, loadingProgramas, programaSelecionado,
    fetchProgramas, selecionarPrograma, voltarParaCursos,

    // Estrutura
    estrutura, loadingEstrutura,
    toggleSection, isExpanded,
    getConteudos, isLoadingConteudos,
    aulasDoModulo,

    // Conteúdo ativo
    conteudoAtivo, selecionarConteudo,

    // Material
    abrirArquivo, marcarMaterialVisto,

    // Atividade
    textoAtividade, arquivoAtividade, savingAtividade,
    salvarAtividade, podeEntregar,

    // Avaliação
    submissaoAvaliacao, perguntasAvaliacao, respostasAvaliacao,
    loadingAvaliacao, savingAvaliacao,
    iniciarAvaliacao, finalizarAvaliacao,
    marcarAlternativa, marcarTexto, podeIniciarAvaliacao,

    // Timer
    tempoRestanteSeg, timerAtivo, iniciarTimer, pararTimer, tempoFormatado,
  };
}
