/**
 * useProgAtividadesDistribuicao
 *
 * Composable para gestão da Distribuição (Blueprint).
 * Navega por Áreas → Cursos → Módulos → Componentes
 * e associa conteúdos diretamente na tela.
 */

import { ref, watch, computed } from "vue";
import { useAppStore } from "~~/stores/app";

export interface EscopoItem {
  id: string;
  nome: string;
  descricao?: string | null;
}

export interface ConteudoComAssoc {
  id: string;
  titulo: string;
  tipo: string;
  descricao?: string | null;
  blocos?: { id: string; titulo: string }[];
  associado: boolean;
  assoc_id?: string;
  criado_por_nome?: string | null;
  criado_em?: string;
}

export function useProgAtividadesDistribuicao(deps: {
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

  // ── Sub-aba ───────────────────────────────────────
  const escopoAtivo = ref<"area" | "curso" | "modulo" | "componente">("area");

  // ── Lista de itens do escopo ─────────────────────
  const escopos = ref<EscopoItem[]>([]);
  const loadingEscopos = ref(false);

  // ── Item selecionado ──────────────────────────────
  const escopoSelecionado = ref<EscopoItem | null>(null);

  // ── Conteúdos com status de associação ────────────
  const conteudosAssoc = ref<ConteudoComAssoc[]>([]);
  const loadingConteudos = ref(false);

  // ── Busca e filtros ───────────────────────────────
  const busca = ref("");
  const filtroTipo = ref<string | null>(null);
  const filtroMeus = ref(false);
  const mostrarAssociados = ref(true);
  const mostrarDisponiveis = ref(true);

  // ── Associações carregadas ────────────────────────
  const assocMap = ref<Map<string, string>>(new Map());

  // ── Watch ─────────────────────────────────────────
  watch(busca, () => { if (escopoSelecionado.value) carregarConteudos(); });
  watch(filtroTipo, () => { if (escopoSelecionado.value) carregarConteudos(); });
  watch(filtroMeus, () => { if (escopoSelecionado.value) carregarConteudos(); });
  watch(mostrarAssociados, () => { if (escopoSelecionado.value) carregarConteudos(); });
  watch(mostrarDisponiveis, () => { if (escopoSelecionado.value) carregarConteudos(); });

  // ── Fetch: itens do escopo ────────────────────────
  async function fetchEscopos() {
    loadingEscopos.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/distribuicao/escopos", {
        params: { tipo_escopo: escopoAtivo.value, id_entidade },
      })) as any;

      escopos.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar", { type: "error" });
    } finally {
      loadingEscopos.value = false;
    }
  }

  function alternarEscopo(escopo: "area" | "curso" | "modulo" | "componente") {
    escopoAtivo.value = escopo;
    escopoSelecionado.value = null;
    conteudosAssoc.value = [];
    assocMap.value = new Map();
    fetchEscopos();
  }

  // ── Carregar conteúdos + status de associação ────
  async function carregarConteudos() {
    if (!escopoSelecionado.value) return;
    loadingConteudos.value = true;

    try {
      const id_entidade = await deps.garantirEntidade();

      // 1. Busca associações do escopo
      const assocRes = (await $fetch("/api/programacao_atividades/distribuicao", {
        params: { escopo: escopoAtivo.value, escopo_id: escopoSelecionado.value.id },
      })) as any;

      const associacoes = Array.isArray(assocRes?.itens) ? assocRes.itens : [];
      const map = new Map<string, string>();
      for (const a of associacoes) {
        map.set(a.id_conteudo, a.id);
      }
      assocMap.value = map;

      // 2. Busca conteúdos do repositório
      const params: any = { id_entidade, page: 1, limit: 200 };
      if (busca.value) params.busca = busca.value;
      if (filtroTipo.value) params.tipo = filtroTipo.value;
      if (filtroMeus.value) params.criado_por = store.user_expandido_id;

      const conteudosRes = (await $fetch("/api/programacao_atividades/conteudos", { params })) as any;
      const todos = Array.isArray(conteudosRes?.itens) ? conteudosRes.itens : [];

      // 3. Mescla com status de associação
      conteudosAssoc.value = todos.map((c: any) => ({
        id: c.id,
        titulo: c.titulo,
        tipo: c.tipo,
        descricao: c.descricao,
        blocos: c.blocos,
        associado: map.has(c.id),
        assoc_id: map.get(c.id),
        criado_por_nome: c.criado_por_nome,
        criado_em: c.criado_em,
      }));
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar", { type: "error" });
    } finally {
      loadingConteudos.value = false;
    }
  }

  function selecionarItem(item: EscopoItem) {
    escopoSelecionado.value = item;
    carregarConteudos();
  }

  // ── Conteúdos filtrados ──────────────────────────
  const conteudosExibidos = computed(() => {
    return conteudosAssoc.value.filter((c) => {
      if (!mostrarAssociados.value && c.associado) return false;
      if (!mostrarDisponiveis.value && !c.associado) return false;
      return true;
    });
  });

  // ── Toggle associação ─────────────────────────────
  async function toggleAssociacao(conteudo: ConteudoComAssoc) {
    if (!escopoSelecionado.value) return;

    if (conteudo.associado) {
      const assocId = conteudo.assoc_id || assocMap.value.get(conteudo.id);
      if (!assocId) return;

      try {
        const id_entidade = await deps.garantirEntidade();
        const res = (await $fetch("/api/programacao_atividades/distribuicao", {
          method: "DELETE",
          body: { id: assocId, id_entidade },
        })) as any;

        if (res?.success !== false) {
          conteudo.associado = false;
          conteudo.assoc_id = undefined;
          assocMap.value.delete(conteudo.id);
          deps.toast.showToast("Associação removida", { type: "success" });
        }
      } catch (e: any) {
        deps.toast.showToast(e.message || "Erro ao remover", { type: "error" });
      }
    } else {
      try {
        const id_entidade = await deps.garantirEntidade();
        const body: any = {
          id_entidade,
          id_conteudo: conteudo.id,
          usuario_id: store.user_expandido_id,
        };
        body[`id_${escopoAtivo.value}`] = escopoSelecionado.value.id;

        const res = (await $fetch("/api/programacao_atividades/distribuicao", {
          method: "POST",
          body,
        })) as any;

        if (res?.success === false) {
          deps.toast.showToast(res.message || "Erro ao associar", { type: "error" });
        } else {
          conteudo.associado = true;
          conteudo.assoc_id = res?.id;
          if (res?.id) assocMap.value.set(conteudo.id, res.id);
          deps.toast.showToast("Conteúdo associado!", { type: "success" });
        }
      } catch (e: any) {
        deps.toast.showToast(e.message || "Erro ao associar", { type: "error" });
      }
    }
  }

  return {
    escopoAtivo, alternarEscopo,
    escopos, loadingEscopos,
    escopoSelecionado, selecionarItem,
    conteudosAssoc, conteudosExibidos, loadingConteudos,
    busca, filtroTipo, filtroMeus, mostrarAssociados, mostrarDisponiveis,
    toggleAssociacao,
    fetchEscopos,
  };
}
