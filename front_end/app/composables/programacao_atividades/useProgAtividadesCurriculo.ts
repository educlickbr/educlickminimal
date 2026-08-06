/**
 * useProgAtividadesCurriculo
 *
 * Composable para gestão do Currículo (Programa).
 * Layout 2 colunas com lazy loading:
 *   Esquerda: árvore acordeon (carrega estrutura, depois conteúdos sob demanda)
 *   Direita:  navegador de conteúdos com busca/filtros + toggle ativo
 */

import { ref, computed, watch } from "vue";
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
  id_arquivo?: string;
  url?: string;
  ativo: boolean;
  destaque: boolean;
  herdado: boolean;
  op_id?: string | null;
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
  criado_por_nome?: string | null;
  criado_em?: string;
}

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

  // ── Programa ──────────────────────────────────────────
  const programas = ref<ProgramaOption[]>([]);
  const loadingProgramas = ref(false);
  const programaSelecionado = ref<ProgramaOption | null>(null);

  // ── Estrutura (casca da árvore) ───────────────────────
  const estrutura = ref<any>(null);
  const loadingEstrutura = ref(false);

  // ── Conteúdos por escopo (lazy) ───────────────────────
  // Chave: "area" | "componente:<id>" | "modulo:<id>" | "ciclo:<id>" | "calendario:<id>"
  const conteudosMap = ref<Map<string, ConteudoItem[]>>(new Map());
  const loadingConteudosEscopo = ref<Map<string, boolean>>(new Map());

  // ── Acordeon expandido ────────────────────────────────
  const expandedSections = ref<Set<string>>(new Set());

  function toggleSection(key: string) {
    const s = new Set(expandedSections.value);
    if (s.has(key)) s.delete(key); else s.add(key);
    expandedSections.value = s;

    // Lazy: se está expandindo e não tem conteúdos ainda, busca
    if (s.has(key)) {
      carregarConteudosSeNecessario(key);
    }
  }

  function isExpanded(key: string): boolean {
    return expandedSections.value.has(key);
  }

  // ── Mapeia chave do acordeon → escopo para RPC ──────
  function parseEscopoKey(key: string): Record<string, any> | null {
    if (key === 'programa') return { tipo: 'programa', id: (programaSelecionado.value?.id || '') as string };
    if (key === 'area') return { tipo: 'area', id: (estrutura.value?.area?.id || '') as string };
    if (key.startsWith('componente:')) return { tipo: 'componente', id: key.split(':')[1] as string };
    if (key.startsWith('modulo:')) return { tipo: 'modulo', id: key.split(':')[1] as string };
    if (key.startsWith('ciclo:')) return { tipo: 'ciclo', id: key.split(':')[1] as string };
    if (key.startsWith('calendario:')) return { tipo: 'calendario', id: key.split(':')[1] as string };
    return null;
  }

  async function carregarConteudosSeNecessario(key: string) {
    // Verifica se já carregou
    if (conteudosMap.value.has(key)) return;

    const escopo = parseEscopoKey(key);
    if (!escopo || !escopo.id || !programaSelecionado.value) return;

    const lm = new Map(loadingConteudosEscopo.value);
    lm.set(key, true);
    loadingConteudosEscopo.value = lm;

    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/curriculo/conteudos", {
        params: {
          id_programa: programaSelecionado.value.id,
          id_entidade,
          escopo_tipo: escopo.tipo,
          escopo_id: escopo.id,
        },
      })) as any;

      const itens = Array.isArray(res?.conteudos) ? res.conteudos : [];
      const m = new Map(conteudosMap.value);
      m.set(key, itens);
      conteudosMap.value = m;
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar conteúdos", { type: "error" });
    } finally {
      const lm2 = new Map(loadingConteudosEscopo.value);
      lm2.set(key, false);
      loadingConteudosEscopo.value = lm2;
    }
  }

  function getConteudos(key: string): ConteudoItem[] {
    return conteudosMap.value.get(key) || [];
  }

  function isLoadingConteudos(key: string): boolean {
    return loadingConteudosEscopo.value.get(key) || false;
  }

  // ── Escopo alvo para adicionar conteúdo ───────────────
  // Quando o usuário clica "Adicionar conteúdo" numa seção da árvore,
  // define o escopo alvo para o toggle no painel direito.
  const selectedScopeKey = ref<string | null>(null);

  function definirEscopoAlvo(key: string | null) {
    selectedScopeKey.value = key;
  }

  // Converte escopoKey para parâmetros do POST
  function escopoKeyToParams(key: string): { id_ciclo?: string; id_calendario?: string } {
    if (key.startsWith('ciclo:')) return { id_ciclo: key.split(':')[1] };
    if (key.startsWith('calendario:')) return { id_calendario: key.split(':')[1] };
    return {}; // area, componente, modulo → apenas programa
  }

  // Monta o body do POST respeitando a constraint exclusiva:
  // exatamente UM de (id_programa, id_ciclo, id_calendario) preenchido.
  function montarBodyOperacional(extra: Record<string, any>): Record<string, any> {
    const paramsEscopo = selectedScopeKey.value
      ? escopoKeyToParams(selectedScopeKey.value)
      : {};
    const body: Record<string, any> = {
      id_entidade: extra.id_entidade,
      id_conteudo: extra.id_conteudo,
      ativo: extra.ativo ?? true,
      usuario_id: extra.usuario_id,
    };
    if (extra.destaque !== undefined) body.destaque = extra.destaque;
    if (paramsEscopo.id_ciclo) {
      body.id_ciclo = paramsEscopo.id_ciclo;
    } else if (paramsEscopo.id_calendario) {
      body.id_calendario = paramsEscopo.id_calendario;
    } else {
      body.id_programa = extra.id_programa || programaSelecionado.value?.id;
    }
    return body;
  }

  // ── Painel direito: navegador de conteúdos ─────────────
  const busca = ref("");
  const filtroTipo = ref<string | null>(null);
  const filtroMeus = ref(false);

  const conteudosDisponiveis = ref<ConteudoPanel[]>([]);
  const loadingConteudos = ref(false);

  // Mapa: id_conteudo → { ativo, op_id }
  const ativosMap = ref<Map<string, { ativo: boolean; op_id?: string }>>(new Map());

  // ── Watch ──────────────────────────────────────────────
  watch(busca, () => { if (programaSelecionado.value) fetchConteudosRepositorio(); });
  watch(filtroTipo, () => { if (programaSelecionado.value) fetchConteudosRepositorio(); });
  watch(filtroMeus, () => { if (programaSelecionado.value) fetchConteudosRepositorio(); });

  // ── Fetch programas ────────────────────────────────────
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

  // ── Selecionar programa ────────────────────────────────
  async function selecionarPrograma(prog: ProgramaOption) {
    programaSelecionado.value = prog;
    expandedSections.value = new Set();
    conteudosMap.value = new Map();
    loadingEstrutura.value = true;

    try {
      const id_entidade = await deps.garantirEntidade();

      // Carrega estrutura
      const [estruturaRes, ativosRes] = await Promise.all([
        $fetch("/api/programacao_atividades/curriculo", {
          params: { id_programa: prog.id, id_entidade },
        }) as any,
        $fetch("/api/programacao_atividades/curriculo/ativos", {
          params: { id_programa: prog.id, id_entidade },
        }) as any,
      ]);
      estrutura.value = estruturaRes;

      // Monta mapa de ativos
      const map = new Map<string, { ativo: boolean; op_id?: string }>();
      if (Array.isArray(ativosRes?.itens)) {
        for (const a of ativosRes.itens) {
          map.set(a.id_conteudo, { ativo: a.ativo, op_id: a.id });
        }
      }
      ativosMap.value = map;

      // Carrega conteúdos do painel direito
      await fetchConteudosRepositorio();
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar currículo", { type: "error" });
    } finally {
      loadingEstrutura.value = false;
    }
  }

  // ── Fetch conteúdos (painel direito) ───────────────────
  async function fetchConteudosRepositorio() {
    loadingConteudos.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const params: any = { id_entidade, page: 1, limit: 200 };
      if (busca.value) params.busca = busca.value;
      if (filtroTipo.value) params.tipo = filtroTipo.value;
      if (filtroMeus.value) params.criado_por = store.user_expandido_id;

      const res = (await $fetch("/api/programacao_atividades/conteudos", { params })) as any;
      const itens = Array.isArray(res?.itens) ? res.itens : [];

      conteudosDisponiveis.value = itens.map((c: any) => {
        const at = ativosMap.value.get(c.id);
        return {
          id: c.id,
          titulo: c.titulo,
          tipo: c.tipo,
          descricao: c.descricao,
          blocos: c.blocos,
          ativo: at?.ativo ?? false,
          op_id: at?.op_id ?? null,
          criado_por_nome: c.criado_por_nome,
          id_arquivo: c.id_arquivo,
          url: c.url,
          criado_em: c.criado_em,
        };
      });
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar conteúdos", { type: "error" });
    } finally {
      loadingConteudos.value = false;
    }
  }

  // ── Toggle ativo (na árvore) ───────────────────────────
  async function toggleAtivo(item: ConteudoItem, escopoKey: string) {
    if (!programaSelecionado.value) return;
    try {
      const id_entidade = await deps.garantirEntidade();
      // Escopo da seção da árvore (usado para ciclo/aula)
      const escopoAntigo = selectedScopeKey.value;
      selectedScopeKey.value = escopoKey;
      try {
        if (item.herdado && item.ativo) {
          const body = montarBodyOperacional({
            id_entidade, id_conteudo: item.id_conteudo,
            ativo: false, usuario_id: store.user_expandido_id,
          });
          await $fetch("/api/programacao_atividades/curriculo", {
            method: "POST", body,
          });
        } else if (!item.herdado && !item.ativo) {
          const body = montarBodyOperacional({
            id_entidade, id_conteudo: item.id_conteudo,
            ativo: true, usuario_id: store.user_expandido_id,
          });
          await $fetch("/api/programacao_atividades/curriculo", {
            method: "POST", body,
          });
        } else if (!item.herdado && item.op_id) {
          await $fetch("/api/programacao_atividades/curriculo", {
            method: "DELETE",
            body: { id: item.op_id, id_entidade },
          });
        }
      } finally {
        selectedScopeKey.value = escopoAntigo;
      }
      // Recarrega conteúdos deste escopo
      conteudosMap.value.delete(escopoKey);
      await carregarConteudosSeNecessario(escopoKey);
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao alterar", { type: "error" });
    }
  }

  // ── Toggle ativo (no painel direito) ────────────────────
  async function toggleAtivoPainel(conteudo: ConteudoPanel) {
    if (!programaSelecionado.value) return;
    try {
      const id_entidade = await deps.garantirEntidade();

      if (conteudo.ativo && conteudo.op_id) {
        await $fetch("/api/programacao_atividades/curriculo", {
          method: "DELETE",
          body: { id: conteudo.op_id, id_entidade },
        });
        conteudo.ativo = false;
        conteudo.op_id = null;
        ativosMap.value.delete(conteudo.id);
      } else if (!conteudo.ativo) {
        // Constraint exclusiva: ciclo/aula substituem o programa (soma = 1)
        const body = montarBodyOperacional({
          id_entidade, id_conteudo: conteudo.id,
          ativo: true, usuario_id: store.user_expandido_id,
        });

        const res = (await $fetch("/api/programacao_atividades/curriculo", {
          method: "POST",
          body,
        })) as any;
        conteudo.ativo = true;
        conteudo.op_id = res?.id;
        if (res?.id) ativosMap.value.set(conteudo.id, { ativo: true, op_id: res.id });

        // Limpa escopo alvo depois de associar
        selectedScopeKey.value = null;
      }
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao alterar", { type: "error" });
    }
  }

  // ── Toggle destaque ────────────────────────────────────
  async function toggleDestaque(item: ConteudoItem, escopoKey: string) {
    if (!programaSelecionado.value) return;
    try {
      const id_entidade = await deps.garantirEntidade();
      await $fetch("/api/programacao_atividades/curriculo", {
        method: "POST",
        body: {
          id_entidade, id_conteudo: item.id_conteudo,
          id_programa: programaSelecionado.value.id,
          destaque: !item.destaque, ativo: item.ativo,
          usuario_id: store.user_expandido_id,
        },
      });
      // Recarrega
      conteudosMap.value.delete(escopoKey);
      await carregarConteudosSeNecessario(escopoKey);
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro ao destacar", { type: "error" });
    }
  }

  // ── Conteúdos filtrados (painel direito) ──────────────
  const conteudosExibidos = computed(() => {
    return conteudosDisponiveis.value.filter((c) => {
      if (busca.value) {
        const q = busca.value.toLowerCase();
        if (!c.titulo.toLowerCase().includes(q) && !(c.descricao || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  });

  // ── Helpers para o template ────────────────────────────
  function aulasDoCiclo(idCiclo: string): any[] {
    if (!estrutura.value?.aulas) return [];
    return estrutura.value.aulas.filter((a: any) => a.id_ciclo === idCiclo);
  }

  function aulasDoModulo(idModulo: string): any[] {
    if (!estrutura.value?.ciclos || !estrutura.value?.aulas) return [];
    const ciclosDoMod = estrutura.value.ciclos.filter((c: any) => c.id_modulo === idModulo);
    const idsCiclos = new Set(ciclosDoMod.map((c: any) => c.id));
    return estrutura.value.aulas.filter((a: any) => idsCiclos.has(a.id_ciclo));
  }

  function ciclosDoModulo(idModulo: string): any[] {
    if (!estrutura.value?.ciclos) return [];
    return estrutura.value.ciclos.filter((c: any) => c.id_modulo === idModulo);
  }

  return {
    // Programa
    programas, loadingProgramas, programaSelecionado,
    fetchProgramas, selecionarPrograma,

    // Estrutura
    estrutura, loadingEstrutura,

    // Lazy contents
    toggleSection, isExpanded,
    getConteudos, isLoadingConteudos,
    carregarConteudosSeNecessario,

    // Toggles (árvore)
    toggleAtivo, toggleDestaque,

    // Escopo alvo
    selectedScopeKey, definirEscopoAlvo,

    // Painel direito
    busca, filtroTipo, filtroMeus,
    conteudosDisponiveis, conteudosExibidos, loadingConteudos,
    fetchConteudosRepositorio, toggleAtivoPainel,

    // Helpers
    aulasDoCiclo, aulasDoModulo, ciclosDoModulo,
  };
}
