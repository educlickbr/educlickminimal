/**
 * Gestão do Currículo operacional de um programa.
 *
 * A estrutura da árvore é leve; os conteúdos são buscados apenas ao abrir
 * um escopo. Ao clicar em "Adicionar", a mesma consulta do escopo também
 * devolve o catálogo com o estado daquele escopo específico.
 */

import { ref, reactive, computed } from "vue";
import { useAppStore } from "~~/stores/app";

export interface ProgramaOption {
  id: string;
  descricao: string;
  curso_nome: string;
  area_nome?: string;
  qtd_ciclos: number;
}

export interface ConteudoItem {
  id_conteudo: string;
  titulo: string;
  tipo: string;
  id_arquivo?: string | null;
  url?: string | null;
  ativo: boolean;
  destaque: boolean;
  herdado: boolean;
  op_id?: string | null;
  data_disponivel?: string | null;
  data_entrega_limite?: string | null;
  duracao_minutos?: number | null;
  tentativas_permitidas?: number | null;
  pontuacao_maxima?: number | null;
}

export interface ConteudoPanel {
  id: string;
  titulo: string;
  tipo: string;
  descricao?: string | null;
  blocos?: { id: string; titulo: string }[];
  ativo: boolean;
  op_id?: string | null;
  id_arquivo?: string | null;
  url?: string | null;
  data_disponivel?: string | null;
  data_entrega_limite?: string | null;
  duracao_minutos?: number | null;
  tentativas_permitidas?: number | null;
  pontuacao_maxima?: number | null;
  criado_por?: string | null;
  criado_por_nome?: string | null;
  criado_em?: string;
}

type EscopoOperacional = {
  id_area?: string;
  id_componente?: string;
  id_modulo?: string;
  id_ciclo?: string;
  id_calendario?: string;
};

export function useProgAtividadesCurriculo(deps: {
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

  // ── Programa e casca da árvore ───────────────────────
  const programas = ref<ProgramaOption[]>([]);
  const loadingProgramas = ref(false);
  const programaSelecionado = ref<ProgramaOption | null>(null);
  const estrutura = ref<any>(null);
  const loadingEstrutura = ref(false);

  // ── Conteúdos lazy por escopo ─────────────────────────
  const conteudosMap = ref<Map<string, ConteudoItem[]>>(new Map());
  const loadingConteudosEscopo = ref<Map<string, boolean>>(new Map());
  const expandedSections = ref<Set<string>>(new Set());

  function isExpanded(key: string): boolean {
    return expandedSections.value.has(key);
  }

  function parseEscopoKey(key: string): { tipo: string; id: string } | null {
    if (key === "programa") {
      return { tipo: "programa", id: programaSelecionado.value?.id || "" };
    }
    if (key === "area") return { tipo: "area", id: estrutura.value?.area?.id || "" };
    if (key.startsWith("componente:")) return { tipo: "componente", id: key.split(":")[1] || "" };
    if (key.startsWith("modulo:")) return { tipo: "modulo", id: key.split(":")[1] || "" };
    if (key.startsWith("ciclo:")) return { tipo: "ciclo", id: key.split(":")[1] || "" };
    if (key.startsWith("calendario:")) return { tipo: "calendario", id: key.split(":")[1] || "" };
    return null;
  }

  async function carregarConteudos(
    key: string,
    incluirCatalogo = false,
    forcar = false,
  ) {
    if (!forcar && !incluirCatalogo && conteudosMap.value.has(key)) return;

    const escopo = parseEscopoKey(key);
    const programa = programaSelecionado.value;
    if (!escopo?.id || !programa) return;

    const loadingPorEscopo = new Map(loadingConteudosEscopo.value);
    loadingPorEscopo.set(key, true);
    loadingConteudosEscopo.value = loadingPorEscopo;
    if (incluirCatalogo) loadingConteudos.value = true;

    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/curriculo/conteudos", {
        params: {
          id_programa: programa.id,
          id_entidade,
          escopo_tipo: escopo.tipo,
          escopo_id: escopo.id,
          incluir_catalogo: incluirCatalogo,
        },
      })) as any;

      const conteudos = Array.isArray(res?.conteudos) ? res.conteudos : [];
      const mapa = new Map(conteudosMap.value);
      mapa.set(key, conteudos);
      conteudosMap.value = mapa;

      // Não deixa uma resposta de escopo anterior substituir o navegador atual.
      if (incluirCatalogo && selectedScopeKey.value === key) {
        conteudosDisponiveis.value = Array.isArray(res?.catalogo) ? res.catalogo : [];
      }
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar conteúdos", { type: "error" });
    } finally {
      const loadingFinal = new Map(loadingConteudosEscopo.value);
      loadingFinal.set(key, false);
      loadingConteudosEscopo.value = loadingFinal;
      if (incluirCatalogo && selectedScopeKey.value === key) loadingConteudos.value = false;
    }
  }

  function toggleSection(key: string) {
    const secoes = new Set(expandedSections.value);
    if (secoes.has(key)) secoes.delete(key);
    else secoes.add(key);
    expandedSections.value = secoes;

    if (secoes.has(key)) void carregarConteudos(key);
  }

  function carregarConteudosSeNecessario(key: string) {
    return carregarConteudos(key);
  }

  function getConteudos(key: string): ConteudoItem[] {
    return conteudosMap.value.get(key) || [];
  }

  function isLoadingConteudos(key: string): boolean {
    return loadingConteudosEscopo.value.get(key) || false;
  }

  async function recarregarArvoreDoEscopo(key: string) {
    // Atualiza a lista da árvore sem pedir novamente o catálogo do navegador.
    return carregarConteudos(key, false, true);
  }

  // ── Escopo alvo ───────────────────────────────────────
  const selectedScopeKey = ref<string | null>(null);

  async function definirEscopoAlvo(key: string | null) {
    if (!key || key === selectedScopeKey.value) {
      selectedScopeKey.value = null;
      conteudosDisponiveis.value = [];
      return;
    }

    selectedScopeKey.value = key;
    conteudosDisponiveis.value = [];
    await carregarConteudos(key, true, true);
  }

  function escopoKeyToParams(key: string): EscopoOperacional {
    if (key === "area") return { id_area: estrutura.value?.area?.id };
    if (key.startsWith("componente:")) return { id_componente: key.split(":")[1] };
    if (key.startsWith("modulo:")) return { id_modulo: key.split(":")[1] };
    if (key.startsWith("ciclo:")) return { id_ciclo: key.split(":")[1] };
    if (key.startsWith("calendario:")) return { id_calendario: key.split(":")[1] };
    return {};
  }

  /**
   * Todo registro operacional pertence ao programa; o campo opcional abaixo
   * identifica o nível específico em que o conteúdo foi associado.
   */
  function montarBodyOperacional(
    extra: Record<string, any>,
    scopeKey = selectedScopeKey.value,
  ): Record<string, any> {
    if (!programaSelecionado.value) throw new Error("Selecione um programa primeiro");

    const body: Record<string, any> = {
      id_entidade: extra.id_entidade,
      id_conteudo: extra.id_conteudo,
      id_programa: programaSelecionado.value.id,
      ativo: extra.ativo ?? true,
      usuario_id: extra.usuario_id,
      ...(scopeKey ? escopoKeyToParams(scopeKey) : {}),
    };
    if (extra.destaque !== undefined) body.destaque = extra.destaque;
    return body;
  }

  // ── Navegador do escopo ativo ─────────────────────────
  const busca = ref("");
  const filtroTipo = ref<string | null>(null);
  const filtroMeus = ref(false);
  const filtroEstado = ref<string | null>(null);
  const conteudosDisponiveis = ref<ConteudoPanel[]>([]);
  const loadingConteudos = ref(false);

  const pastaAberta = reactive({ componentes: false, modulos: false });

  function togglePasta(pasta: "componentes" | "modulos") {
    pastaAberta[pasta] = !pastaAberta[pasta];
  }

  function irParaPasta(pasta: "componentes" | "modulos") {
    if (!pastaAberta[pasta]) pastaAberta[pasta] = true;
  }

  function atualizarConteudoNoPainel(id: string, patch: Partial<ConteudoPanel>) {
    conteudosDisponiveis.value = conteudosDisponiveis.value.map((conteudo) =>
      conteudo.id === id ? { ...conteudo, ...patch } : conteudo,
    );
  }

  // ── Modal de timing ───────────────────────────────────
  const showModalTiming = ref(false);
  const timingAlvo = ref<ConteudoPanel | null>(null);
  const formTiming = reactive({
    data_disponivel: "" as string,
    data_entrega_limite: "" as string,
    duracao_minutos: null as number | null,
    tentativas_permitidas: null as number | null,
    pontuacao_maxima: null as number | null,
  });
  const savingTiming = ref(false);

  function toLocalInput(iso: string): string {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
  }

  function abrirConfigTiming(conteudo: ConteudoPanel) {
    timingAlvo.value = conteudo;
    formTiming.data_disponivel = conteudo.data_disponivel ? toLocalInput(conteudo.data_disponivel) : "";
    formTiming.data_entrega_limite = conteudo.data_entrega_limite ? toLocalInput(conteudo.data_entrega_limite) : "";
    formTiming.duracao_minutos = conteudo.duracao_minutos ?? null;
    formTiming.tentativas_permitidas = conteudo.tentativas_permitidas ?? null;
    formTiming.pontuacao_maxima = conteudo.pontuacao_maxima ?? null;
    showModalTiming.value = true;
  }

  function limparTiming() {
    formTiming.data_disponivel = "";
    formTiming.data_entrega_limite = "";
    formTiming.duracao_minutos = null;
    formTiming.tentativas_permitidas = null;
    formTiming.pontuacao_maxima = null;
  }

  async function salvarTiming() {
    const conteudo = timingAlvo.value;
    const scopeKey = selectedScopeKey.value;
    if (!conteudo || !scopeKey) return;

    savingTiming.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const body = montarBodyOperacional({
        id_entidade,
        id_conteudo: conteudo.id,
        ativo: conteudo.ativo,
        usuario_id: store.user_expandido_id,
      }, scopeKey);
      body.data_disponivel = formTiming.data_disponivel ? new Date(formTiming.data_disponivel).toISOString() : null;
      body.data_entrega_limite = formTiming.data_entrega_limite ? new Date(formTiming.data_entrega_limite).toISOString() : null;
      body.duracao_minutos = formTiming.duracao_minutos || null;
      body.tentativas_permitidas = formTiming.tentativas_permitidas || null;
      body.pontuacao_maxima = formTiming.pontuacao_maxima || null;

      const res = (await $fetch("/api/programacao_atividades/curriculo", {
        method: "POST", body,
      })) as any;
      if (!res?.id) throw new Error(res?.message || "Não foi possível salvar a configuração");

      const patch = {
        op_id: conteudo.op_id || res.id,
        data_disponivel: body.data_disponivel,
        data_entrega_limite: body.data_entrega_limite,
        duracao_minutos: body.duracao_minutos,
        tentativas_permitidas: body.tentativas_permitidas,
        pontuacao_maxima: body.pontuacao_maxima,
      };
      atualizarConteudoNoPainel(conteudo.id, patch);
      timingAlvo.value = { ...conteudo, ...patch };
      await recarregarArvoreDoEscopo(scopeKey);
      deps.toast.showToast("Configuração salva!", { type: "success" });
      showModalTiming.value = false;
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao salvar", { type: "error" });
    } finally {
      savingTiming.value = false;
    }
  }

  // ── Programa ──────────────────────────────────────────
  async function fetchProgramas() {
    loadingProgramas.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/curriculo/programas", {
        params: { id_entidade },
      })) as any;
      programas.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar programas", { type: "error" });
    } finally {
      loadingProgramas.value = false;
    }
  }

  async function selecionarPrograma(prog: ProgramaOption) {
    programaSelecionado.value = prog;
    estrutura.value = null;
    expandedSections.value = new Set();
    conteudosMap.value = new Map();
    loadingConteudosEscopo.value = new Map();
    selectedScopeKey.value = null;
    conteudosDisponiveis.value = [];
    busca.value = "";
    filtroTipo.value = null;
    filtroMeus.value = false;
    filtroEstado.value = null;
    pastaAberta.componentes = false;
    pastaAberta.modulos = false;
    loadingEstrutura.value = true;

    try {
      const id_entidade = await deps.garantirEntidade();
      estrutura.value = await $fetch("/api/programacao_atividades/curriculo", {
        params: { id_programa: prog.id, id_entidade },
      });
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar currículo", { type: "error" });
    } finally {
      loadingEstrutura.value = false;
    }
  }

  // ── Mutação na árvore ─────────────────────────────────
  async function toggleAtivo(item: ConteudoItem, escopoKey: string) {
    if (!programaSelecionado.value) return;
    try {
      const id_entidade = await deps.garantirEntidade();
      let painelPatch: Partial<ConteudoPanel> | null = null;

      if (item.herdado && item.ativo) {
        const res = (await $fetch("/api/programacao_atividades/curriculo", {
          method: "POST",
          body: montarBodyOperacional({
            id_entidade, id_conteudo: item.id_conteudo, ativo: false,
            usuario_id: store.user_expandido_id,
          }, escopoKey),
        })) as any;
        if (!res?.id) throw new Error(res?.message || "Não foi possível ocultar o conteúdo");
        painelPatch = { op_id: res.id, ativo: false };
      } else if (!item.herdado && !item.ativo) {
        const res = (await $fetch("/api/programacao_atividades/curriculo", {
          method: "POST",
          body: montarBodyOperacional({
            id_entidade, id_conteudo: item.id_conteudo, ativo: true,
            usuario_id: store.user_expandido_id,
          }, escopoKey),
        })) as any;
        if (!res?.id) throw new Error(res?.message || "Não foi possível mostrar o conteúdo");
        painelPatch = { op_id: res.id, ativo: true };
      } else if (!item.herdado && item.op_id) {
        await $fetch("/api/programacao_atividades/curriculo", {
          method: "DELETE", body: { id: item.op_id, id_entidade },
        });
        painelPatch = { op_id: null, ativo: true };
      }

      if (painelPatch && selectedScopeKey.value === escopoKey) {
        atualizarConteudoNoPainel(item.id_conteudo, painelPatch);
      }
      await recarregarArvoreDoEscopo(escopoKey);
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao alterar", { type: "error" });
    }
  }

  async function toggleDestaque(item: ConteudoItem, escopoKey: string) {
    if (!programaSelecionado.value) return;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/curriculo", {
        method: "POST",
        body: montarBodyOperacional({
          id_entidade,
          id_conteudo: item.id_conteudo,
          destaque: !item.destaque,
          ativo: item.ativo,
          usuario_id: store.user_expandido_id,
        }, escopoKey),
      })) as any;
      if (!res?.id) throw new Error(res?.message || "Não foi possível alterar o destaque");

      if (selectedScopeKey.value === escopoKey) {
        atualizarConteudoNoPainel(item.id_conteudo, { op_id: res.id });
      }
      await recarregarArvoreDoEscopo(escopoKey);
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao destacar", { type: "error" });
    }
  }

  // ── Mutação no navegador ──────────────────────────────
  async function toggleAssociacaoPainel(conteudo: ConteudoPanel) {
    const scopeKey = selectedScopeKey.value;
    if (!scopeKey || !programaSelecionado.value) {
      deps.toast.showToast("Selecione primeiro o escopo — botão 'Adicionar' na árvore", { type: "error" });
      return;
    }

    try {
      const id_entidade = await deps.garantirEntidade();
      if (conteudo.op_id) {
        await $fetch("/api/programacao_atividades/curriculo", {
          method: "DELETE", body: { id: conteudo.op_id, id_entidade },
        });
        atualizarConteudoNoPainel(conteudo.id, { op_id: null, ativo: true });
        deps.toast.showToast("Associação removida", { type: "success" });
      } else {
        const res = (await $fetch("/api/programacao_atividades/curriculo", {
          method: "POST",
          body: montarBodyOperacional({
            id_entidade, id_conteudo: conteudo.id, ativo: true,
            usuario_id: store.user_expandido_id,
          }, scopeKey),
        })) as any;
        if (!res?.id) throw new Error(res?.message || "Não foi possível associar o conteúdo");
        atualizarConteudoNoPainel(conteudo.id, { op_id: res.id, ativo: true });
        deps.toast.showToast("Conteúdo associado!", { type: "success" });
      }

      // O painel conserva o catálogo em memória; só a lista curta da árvore é recarregada.
      await recarregarArvoreDoEscopo(scopeKey);
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao alterar", { type: "error" });
    }
  }

  async function toggleAtivoPainel(conteudo: ConteudoPanel) {
    const scopeKey = selectedScopeKey.value;
    if (!scopeKey || !programaSelecionado.value) {
      deps.toast.showToast("Selecione primeiro o escopo — botão 'Adicionar' na árvore", { type: "error" });
      return;
    }

    try {
      const id_entidade = await deps.garantirEntidade();
      const proximoAtivo = !conteudo.ativo;
      const res = (await $fetch("/api/programacao_atividades/curriculo", {
        method: "POST",
        body: montarBodyOperacional({
          id_entidade, id_conteudo: conteudo.id, ativo: proximoAtivo,
          usuario_id: store.user_expandido_id,
        }, scopeKey),
      })) as any;
      if (!res?.id) throw new Error(res?.message || "Não foi possível alterar a visibilidade");

      atualizarConteudoNoPainel(conteudo.id, { op_id: res.id, ativo: proximoAtivo });
      await recarregarArvoreDoEscopo(scopeKey);
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao alterar", { type: "error" });
    }
  }

  // ── Filtros locais (sem novas chamadas) ───────────────
  const conteudosExibidos = computed(() => conteudosDisponiveis.value.filter((conteudo) => {
    if (busca.value) {
      const termo = busca.value.toLowerCase();
      if (!conteudo.titulo.toLowerCase().includes(termo)
        && !(conteudo.descricao || "").toLowerCase().includes(termo)) return false;
    }
    if (filtroTipo.value && conteudo.tipo !== filtroTipo.value) return false;
    if (filtroMeus.value && conteudo.criado_por !== store.user_expandido_id) return false;
    if (filtroEstado.value === "associados" && !conteudo.op_id) return false;
    if (filtroEstado.value === "livres" && conteudo.op_id) return false;
    if (filtroEstado.value === "ocultos" && !(conteudo.op_id && !conteudo.ativo)) return false;
    return true;
  }));

  function toggleFiltroEstado(estado: string) {
    filtroEstado.value = filtroEstado.value === estado ? null : estado;
  }

  const resumoCurriculo = computed(() => {
    const repositorio = conteudosDisponiveis.value;
    const associados = repositorio.filter((conteudo) => !!conteudo.op_id).length;
    const ocultos = repositorio.filter((conteudo) => !!conteudo.op_id && !conteudo.ativo).length;
    return {
      escopos: {
        componentes: (estrutura.value?.componentes || []).length,
        modulos: (estrutura.value?.modulos || []).length,
        ciclos: (estrutura.value?.ciclos || []).length,
        aulas: (estrutura.value?.aulas || []).length,
      },
      repositorio: {
        total: repositorio.length,
        associados,
        ocultos,
        livres: repositorio.length - associados,
      },
    };
  });

  function aulasDoCiclo(idCiclo: string): any[] {
    return estrutura.value?.aulas?.filter((aula: any) => aula.id_ciclo === idCiclo) || [];
  }

  function aulasDoModulo(idModulo: string): any[] {
    const ciclos = estrutura.value?.ciclos || [];
    const idsCiclos = new Set(ciclos.filter((ciclo: any) => ciclo.id_modulo === idModulo).map((ciclo: any) => ciclo.id));
    return estrutura.value?.aulas?.filter((aula: any) => idsCiclos.has(aula.id_ciclo)) || [];
  }

  function ciclosDoModulo(idModulo: string): any[] {
    return estrutura.value?.ciclos?.filter((ciclo: any) => ciclo.id_modulo === idModulo) || [];
  }

  return {
    programas, loadingProgramas, programaSelecionado,
    fetchProgramas, selecionarPrograma,
    estrutura, loadingEstrutura,
    toggleSection, isExpanded, getConteudos, isLoadingConteudos,
    carregarConteudosSeNecessario,
    toggleAtivo, toggleDestaque,
    selectedScopeKey, definirEscopoAlvo,
    busca, filtroTipo, filtroMeus, filtroEstado, toggleFiltroEstado,
    conteudosDisponiveis, conteudosExibidos, loadingConteudos,
    toggleAtivoPainel, toggleAssociacaoPainel,
    resumoCurriculo,
    showModalTiming, timingAlvo, formTiming, savingTiming,
    abrirConfigTiming, salvarTiming, limparTiming,
    aulasDoCiclo, aulasDoModulo, ciclosDoModulo,
    pastaAberta, togglePasta, irParaPasta,
  };
}
