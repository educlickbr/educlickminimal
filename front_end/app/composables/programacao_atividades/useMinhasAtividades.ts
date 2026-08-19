/**
 * useMinhasAtividades
 *
 * Composable do módulo do ALUNO (consumo de conteúdo).
 * Layout 2 colunas com lazy loading:
 *   Esquerda: árvore acordeon (Programa → Componentes → Módulos/Ciclos → Aulas)
 *   Direita:  conteúdo selecionado (material / atividade / avaliação)
 */

import { ref, reactive, computed, watch } from "vue";
import { useAppStore } from "~~/stores/app";

export interface ProgramaAluno {
  id_matricula: string;
  id_programa: string;
  descricao: string;
  nome_curso: string;
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
  atividade_texto?: string | null;
  atividade_arquivo?: string | null;
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
  id_arquivo_envio?: string | null;
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
  const flagsAvaliacao = ref<{ ambiente_seguro: boolean; autoavaliacao: boolean } | null>(null);

  // ── Atividade em edição ────────────────────────────
  const textoAtividade = ref("");
  const arquivoAtividade = ref<string | null>(null);
  const savingAtividade = ref(false);

  // ── Dashboard: filtros e resumo ────────────────────
  const filtroTipo = ref<string | null>(null); // material | atividade | avaliacao
  const filtroStatus = ref<string | null>(null); // concluidos | pendentes | prazos | rascunhos
  const todosCarregados = ref(false);

  // Pastas da árvore (compartilhadas entre página e sidebar)
  const pastaAberta = reactive({
    componentes: false,
    modulos: false,
  });

  function togglePasta(pasta: "componentes" | "modulos") {
    pastaAberta[pasta] = !pastaAberta[pasta];
  }

  function expandir(chave: string) {
    if (!isExpanded(chave)) toggleSection(chave);
  }

  function irParaEscopo(chave: string) {
    if (chave.startsWith("componente:")) {
      pastaAberta.componentes = true;
      expandir(chave);
    } else if (chave.startsWith("modulo:")) {
      pastaAberta.modulos = true;
      expandir(chave);
    } else if (chave.startsWith("calendario:")) {
      pastaAberta.modulos = true;
      const idAula = chave.split(":")[1];
      const aula = (estrutura.value?.aulas || []).find((a: any) => a.id === idAula);
      const ciclo = (estrutura.value?.ciclos || []).find((c: any) => c.id === aula?.id_ciclo);
      if (ciclo) expandir("modulo:" + ciclo.id_modulo);
      expandir(chave);
    }
  }

  function toggleFiltroTipo(tipo: string) {
    filtroTipo.value = filtroTipo.value === tipo ? null : tipo;
  }

  function toggleFiltroStatus(status: string) {
    filtroStatus.value = filtroStatus.value === status ? null : status;
  }

  // Pré-carrega todos os escopos (volume pequeno por matrícula) para
  // o dashboard ter contadores corretos; a árvore abre instantânea depois.
  async function carregarTodosConteudos() {
    if (todosCarregados.value || !estrutura.value) return;
    todosCarregados.value = true;
    const chaves: string[] = ["programa"];
    for (const comp of estrutura.value.componentes || []) chaves.push("componente:" + comp.id);
    for (const mod of estrutura.value.modulos || []) chaves.push("modulo:" + mod.id);
    for (const aula of estrutura.value.aulas || []) chaves.push("calendario:" + aula.id);
    await Promise.allSettled(chaves.map((k) => carregarConteudosSeNecessario(k)));
  }

  // ── Visão lista vs. detalhe (painel direito) ───────
  const visaoLista = ref(true);

  // Visão central quando nada selecionado: 'resumo' (lista) | 'menu' (árvore)
  const visaoCentral = ref<"resumo" | "menu">("menu");

  function toggleVisaoCentral() {
    visaoCentral.value = visaoCentral.value === "resumo" ? "menu" : "resumo";
  }

  function voltarParaLista() {
    // Volta ao menu central (limpa a seleção, como no currículo)
    conteudoAtivo.value = null;
    visaoLista.value = true;
  }

  // Prioridade de exibição dentro de cada seção (pendências primeiro)
  function pesoStatus(c: ConteudoAluno): number {
    if (c.atividade_status === "rascunho") return 0;
    if (c.status_visibilidade === "disponivel" && !c.concluido) return 1;
    if (c.status_visibilidade === "agendado") return 2;
    if (c.status_visibilidade === "prazo_encerrado") return 3;
    return 4; // concluído
  }

  // Lista de todos os conteúdos agrupada por seção (ordem da árvore),
  // com dedupe (primeira seção onde aparece) e respeitando os filtros
  // do dashboard — sem duplicar UI de filtros.
  const secoesLista = computed(() => {
    const e = estrutura.value;
    if (!e) return [];
    const secoes: { chave: string; nome: string; itens: ConteudoAluno[] }[] = [];
    const vistos = new Set<string>();

    const montar = (chave: string, nome: string) => {
      const lista = (conteudosMap.value.get(chave) || [])
        .filter((c) => !vistos.has(c.id_conteudo) && passaFiltros(c))
        .sort((a, b) => pesoStatus(a) - pesoStatus(b) || a.titulo.localeCompare(b.titulo));
      if (lista.length === 0) return;
      for (const c of lista) vistos.add(c.id_conteudo);
      secoes.push({ chave, nome, itens: lista });
    };

    montar("programa", "Programa");
    for (const comp of e.componentes || []) montar("componente:" + comp.id, comp.nome);
    for (const mod of e.modulos || []) montar("modulo:" + mod.id, mod.nome);
    for (const aula of e.aulas || []) montar("calendario:" + aula.id, aula.nome);
    return secoes;
  });

  // Resumo do dashboard (dedupe por conteúdo — pode estar em mais de um escopo)
  const resumo = computed(() => {
    const unicos = new Map<string, ConteudoAluno>();
    for (const lista of conteudosMap.value.values()) {
      for (const c of lista) if (!unicos.has(c.id_conteudo)) unicos.set(c.id_conteudo, c);
    }
    const itens = [...unicos.values()];
    const em7dias = (d?: string | null) => {
      if (!d) return false;
      const dias = (new Date(d).getTime() - Date.now()) / 86400000;
      return dias >= 0 && dias <= 7;
    };
    const por_tipo = {
      material: itens.filter((c) => c.tipo === "material").length,
      atividade: itens.filter((c) => c.tipo === "atividade").length,
      avaliacao: itens.filter((c) => c.tipo === "avaliacao").length,
    };
    const por_status = {
      concluidos: itens.filter((c) => c.concluido).length,
      pendentes: itens.filter((c) => !c.concluido && c.status_visibilidade === "disponivel").length,
      agendados: itens.filter((c) => c.status_visibilidade === "agendado").length,
      encerrados: itens.filter((c) => c.status_visibilidade === "prazo_encerrado").length,
      prazos: itens.filter((c) => em7dias(c.data_entrega_limite)).length,
      rascunhos: itens.filter((c) => c.atividade_status === "rascunho").length,
    };
    const por_escopo: { chave: string; nome: string; total: number }[] = [];
    const e = estrutura.value;
    if (e) {
      for (const comp of e.componentes || []) {
        por_escopo.push({ chave: "componente:" + comp.id, nome: comp.nome, total: (conteudosMap.value.get("componente:" + comp.id) || []).length });
      }
      for (const mod of e.modulos || []) {
        por_escopo.push({ chave: "modulo:" + mod.id, nome: mod.nome, total: (conteudosMap.value.get("modulo:" + mod.id) || []).length });
      }
      for (const aula of e.aulas || []) {
        por_escopo.push({ chave: "calendario:" + aula.id, nome: aula.nome, total: (conteudosMap.value.get("calendario:" + aula.id) || []).length });
      }
    }
    return { por_tipo, por_status, por_escopo };
  });

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

  // Filtros do dashboard (sidebar) — aplicados à árvore e à lista
  function passaFiltros(c: ConteudoAluno): boolean {
    if (filtroTipo.value && c.tipo !== filtroTipo.value) return false;
    if (filtroStatus.value) {
      switch (filtroStatus.value) {
        case "concluidos":
          if (!c.concluido) return false;
          break;
        case "pendentes":
          if (c.concluido || c.status_visibilidade !== "disponivel") return false;
          break;
        case "prazos": {
          if (!c.data_entrega_limite) return false;
          const dias = (new Date(c.data_entrega_limite).getTime() - Date.now()) / 86400000;
          if (dias > 7 || dias < 0) return false;
          break;
        }
        case "rascunhos":
          if (c.atividade_status !== "rascunho") return false;
          break;
      }
    }
    return true;
  }

  function getConteudos(key: string): ConteudoAluno[] {
    const lista = conteudosMap.value.get(key) || [];
    if (!filtroTipo.value && !filtroStatus.value) return lista;
    return lista.filter((c) => passaFiltros(c));
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
    flagsAvaliacao.value = null;
    textoAtividade.value = "";
    arquivoAtividade.value = null;
    filtroTipo.value = null;
    filtroStatus.value = null;
    todosCarregados.value = false;
    visaoLista.value = true;
    visaoCentral.value = "menu";

    loadingEstrutura.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/minhas_atividades/estrutura", {
        params: { id_programa: prog.id_programa, id_entidade },
      })) as any;
      estrutura.value = res;
      // Pré-carrega todos os escopos para o dashboard (sem bloquear a árvore)
      carregarTodosConteudos();
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
    flagsAvaliacao.value = null;
    textoAtividade.value = "";
    arquivoAtividade.value = null;
    filtroTipo.value = null;
    filtroStatus.value = null;
    todosCarregados.value = false;
    visaoLista.value = true;
    visaoCentral.value = "menu";
  }

  // ── Selecionar conteúdo (coluna direita) ───────────
  function selecionarConteudo(item: ConteudoAluno) {
    conteudoAtivo.value = item;
    visaoLista.value = false;
    // Pré-preenche o rascunho salvo da atividade (texto + arquivo vêm da RPC)
    if (item.tipo === "atividade" && item.atividade_status === "rascunho") {
      textoAtividade.value = item.atividade_texto || "";
      arquivoAtividade.value = item.atividade_arquivo || null;
    } else if (item.tipo === "atividade") {
      textoAtividade.value = "";
      arquivoAtividade.value = null;
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
        flagsAvaliacao.value = {
          ambiente_seguro: !!res.ambiente_seguro,
          autoavaliacao: !!res.autoavaliacao,
        };
        respostasAvaliacao.value = res.perguntas.map((p: any) => ({
          id_pergunta: p.id_pergunta,
          id_resposta_possivel: null,
          texto_resposta: null,
          id_arquivo_envio: null,
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
      r.id_arquivo_envio = null; // alternativa não aceita anexo
    }
  }

  function marcarTexto(idPergunta: string, texto: string) {
    const r = respostasAvaliacao.value.find((x) => x.id_pergunta === idPergunta);
    if (r) {
      r.texto_resposta = texto;
      r.id_resposta_possivel = null;
    }
  }

  function marcarArquivo(idPergunta: string, idArquivo: string | null) {
    const r = respostasAvaliacao.value.find((x) => x.id_pergunta === idPergunta);
    if (r) {
      r.id_arquivo_envio = idArquivo;
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
          conteudoAtivo.value.avaliacao_tentativa = submissaoAvaliacao.value?.tentativa || 1;
          // Autoavaliação: a RPC calcula e devolve a nota na hora
          if (res.nota_total !== null && res.nota_total !== undefined) {
            conteudoAtivo.value.avaliacao_nota = res.nota_total;
          }
          atualizarConteudoNaArvore(conteudoAtivo.value);
        }
        submissaoAvaliacao.value = null;
        perguntasAvaliacao.value = [];
        respostasAvaliacao.value = [];
        flagsAvaliacao.value = null;
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
    if (c.status_visibilidade !== "disponivel") return false;
    if (submissaoAvaliacao.value) return false;
    if (c.avaliacao_status === "entregue") {
      // Reenvio: libera enquanto houver tentativas permitidas
      if (!c.tentativas_permitidas) return false;
      return (c.avaliacao_tentativa || 1) < c.tentativas_permitidas;
    }
    return true;
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

    // Visão lista vs. detalhe
    visaoLista, voltarParaLista, secoesLista,
    visaoCentral, toggleVisaoCentral,

    // Dashboard
    filtroTipo, filtroStatus, resumo,
    toggleFiltroTipo, toggleFiltroStatus,
    carregarTodosConteudos,
    pastaAberta, togglePasta, irParaEscopo,

    // Conteúdo ativo
    conteudoAtivo, selecionarConteudo,

    // Material
    abrirArquivo, marcarMaterialVisto,

    // Atividade
    textoAtividade, arquivoAtividade, savingAtividade,
    salvarAtividade, podeEntregar,

    // Avaliação
    submissaoAvaliacao, perguntasAvaliacao, respostasAvaliacao,
    loadingAvaliacao, savingAvaliacao, flagsAvaliacao,
    iniciarAvaliacao, finalizarAvaliacao,
    marcarAlternativa, marcarTexto, marcarArquivo, podeIniciarAvaliacao,

    // Timer (countdown local)
    tempoRestanteSeg, timerAtivo, iniciarTimer, pararTimer, tempoFormatado,
  };
}
