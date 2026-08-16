/**
 * useProgAtividadesRepositorio
 *
 * Composable para gestão do Repositório da Programação de Atividades.
 * Conteúdos (vivem soltos, podem ser associados a blocos)
 * Blocos (organizadores opcionais, N:N com conteúdos)
 */

import { ref, watch } from "vue";
import { useAppStore } from "~~/stores/app";

// ── Interfaces ─────────────────────────────────────────

export interface Conteudo {
  id: string;
  tipo: "material" | "atividade" | "avaliacao";
  titulo: string;
  descricao?: string | null;
  id_arquivo?: string | null;
  url?: string | null;
  ativo: boolean;
  id_entidade: string;
  criado_por?: string | null;
  criado_por_nome?: string | null;
  criado_em: string;
  blocos?: { id: string; titulo: string }[];
}

export interface Bloco {
  id: string;
  titulo: string;
  descricao?: string | null;
  cor_ident?: string | null;
  ativo: boolean;
  id_entidade: string;
  criado_em: string;
  qtd_itens?: number;
}

// ── Composable ─────────────────────────────────────────

export function useProgAtividadesRepositorio(deps: {
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
  const visao = ref<"conteudos" | "blocos">("conteudos");

  // ── Conteúdos ──────────────────────────────────────
  const conteudos = ref<Conteudo[]>([]);
  const loadingConteudos = ref(true);
  const pagina = ref(1);
  const totalRegistros = ref(0);
  const limite = 20;

  // ── Busca e filtros ────────────────────────────────
  const busca = ref("");
  const filtroTipo = ref<string | null>(null);
  const filtroMeus = ref(false);

  // ── Blocos ─────────────────────────────────────────
  const blocos = ref<Bloco[]>([]);
  const loadingBlocos = ref(true);

  // ── Modais ─────────────────────────────────────────
  const showModalConteudo = ref(false);
  const isEditConteudo = ref(false);
  const editConteudoData = ref<Conteudo | null>(null);

  const showModalBloco = ref(false);
  const isEditBloco = ref(false);
  const editBlocoData = ref<Bloco | null>(null);

  const showConfirmDelete = ref(false);
  const deleteTargetId = ref<string | null>(null);
  const deleteTargetType = ref<"conteudo" | "bloco">("conteudo");
  const isDeleting = ref(false);

  const expandedBlocoId = ref<string | null>(null);
  const conteudosDoBloco = ref<any[]>([]);
  const loadingConteudosDoBloco = ref(false);

  const blocosDisponiveis = ref<Bloco[]>([]);
  const blocosSelecionados = ref<string[]>([]);
  const modalAbaAtiva = ref<"geral" | "perguntas" | "blocos">("geral");

  // ── Fetch: Conteúdos ──────────────────────────────
  async function fetchConteudos() {
    loadingConteudos.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const params: any = { id_entidade, page: pagina.value, limit: limite };
      if (busca.value) params.busca = busca.value;
      if (filtroTipo.value) params.tipo = filtroTipo.value;
      if (filtroMeus.value) params.criado_por = store.user_expandido_id;

      const res = (await $fetch("/api/programacao_atividades/conteudos", { params })) as any;
      conteudos.value = Array.isArray(res?.itens) ? res.itens : [];
      totalRegistros.value = res?.qtd_total || 0;
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao buscar conteúdos", { type: "error" });
    } finally {
      loadingConteudos.value = false;
    }
  }

  watch(busca, () => { pagina.value = 1; fetchConteudos(); });
  watch(filtroTipo, () => { pagina.value = 1; fetchConteudos(); });
  watch(filtroMeus, () => { pagina.value = 1; fetchConteudos(); });

  // ── Fetch: Blocos ─────────────────────────────────
  async function fetchBlocos() {
    loadingBlocos.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/blocos", {
        params: { id_entidade, page: 1, limit: 50 },
      })) as any;
      blocos.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao buscar blocos", { type: "error" });
    } finally {
      loadingBlocos.value = false;
    }
  }

  async function fetchBlocosDisponiveis() {
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/blocos", {
        params: { id_entidade, page: 1, limit: 200 },
      })) as any;
      blocosDisponiveis.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch { /* silent */ }
  }

  async function fetchConteudosDoBloco(id_bloco: string) {
    loadingConteudosDoBloco.value = true;
    try {
      const res = (await $fetch("/api/programacao_atividades/bloco_itens", { params: { id_bloco } })) as any;
      conteudosDoBloco.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro", { type: "error" });
    } finally {
      loadingConteudosDoBloco.value = false;
    }
  }

  function toggleExpandir(blocoId: string) {
    if (expandedBlocoId.value === blocoId) {
      expandedBlocoId.value = null;
      conteudosDoBloco.value = [];
    } else {
      expandedBlocoId.value = blocoId;
      fetchConteudosDoBloco(blocoId);
    }
  }

  function alternarVisao(v: "conteudos" | "blocos") {
    visao.value = v;
    if (v === "conteudos" && conteudos.value.length === 0) fetchConteudos();
    if (v === "blocos" && blocos.value.length === 0) fetchBlocos();
  }

  function irParaPagina(p: number) {
    pagina.value = p;
    fetchConteudos();
  }

  const totalPaginas = ref(0);
  watch(totalRegistros, (total) => { totalPaginas.value = Math.ceil(total / limite) || 1; });

  // ── Conteúdo modal ────────────────────────────────
  function openNovoConteudo() {
    isEditConteudo.value = false;
    editConteudoData.value = null;
    blocosSelecionados.value = [];
    modalAbaAtiva.value = "geral";
    fetchBlocosDisponiveis();
    showModalConteudo.value = true;
  }

  function openEditarConteudo(c: Conteudo) {
    isEditConteudo.value = true;
    editConteudoData.value = c;
    blocosSelecionados.value = (c.blocos || []).map((b) => b.id);
    modalAbaAtiva.value = "geral";
    fetchBlocosDisponiveis();
    showModalConteudo.value = true;
  }

  async function handleSaveConteudo(formData: any) {
    if (!formData.titulo?.trim() || !formData.tipo) return false;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/conteudos", {
        method: "POST", body: { ...formData, id_entidade, usuario_id: store.user_expandido_id },
      })) as any;

      if (res?.success) {
        const conteudoId = res.id;

        // Salva perguntas se for avaliação
        if (formData.tipo === "avaliacao" && Array.isArray(formData.perguntas)) {
          await $fetch("/api/programacao_atividades/avaliacao", {
            method: "POST",
            body: {
              id_conteudo: conteudoId,
              id_entidade,
              nome: formData.titulo,
              descricao: formData.descricao || null,
              ordem_perguntas: formData.ordem_perguntas || "fixa",
              perguntas: formData.perguntas,
              usuario_id: store.user_expandido_id,
            },
          }).catch((e: any) => {
            deps.toast.showToast("Conteúdo salvo, mas erro ao salvar perguntas: " + (e?.message || ""), { type: "error" });
          });
        }

        if (blocosSelecionados.value.length > 0 && !formData.id) {
          for (const blocoId of blocosSelecionados.value) {
            await $fetch("/api/programacao_atividades/conteudo_bloco", { method: "POST", body: { id_conteudo: conteudoId, id_bloco: blocoId } }).catch(() => {});
          }
        } else if (formData.id && editConteudoData.value) {
          const antigos = (editConteudoData.value.blocos || []).map((b: any) => b.id);
          const novos = blocosSelecionados.value.filter((id) => !antigos.includes(id));
          const removidos = antigos.filter((id: string) => !blocosSelecionados.value.includes(id));
          for (const id of novos) await $fetch("/api/programacao_atividades/conteudo_bloco", { method: "POST", body: { id_conteudo: conteudoId, id_bloco: id } }).catch(() => {});
          for (const id of removidos) await $fetch("/api/programacao_atividades/conteudo_bloco", { method: "DELETE", body: { id_conteudo: conteudoId, id_bloco: id } }).catch(() => {});
        }
        deps.toast.showToast(formData.id ? "Conteúdo atualizado!" : "Conteúdo criado!", { type: "success" });
        showModalConteudo.value = false;
        await fetchConteudos();
        return true;
      }
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro", { type: "error" });
    }
    return false;
  }

  // ── Bloco modal ────────────────────────────────────
  function openNovoBloco() {
    isEditBloco.value = false;
    editBlocoData.value = null;
    showModalBloco.value = true;
  }

  function openEditarBloco(b: Bloco) {
    isEditBloco.value = true;
    editBlocoData.value = b;
    showModalBloco.value = true;
  }

  async function handleSaveBloco(formData: { id: string | null; titulo: string; descricao: string; cor_ident: string }) {
    if (!formData.titulo.trim()) return false;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programacao_atividades/blocos", { method: "POST", body: { ...formData, id_entidade, usuario_id: store.user_expandido_id } })) as any;
      if (res?.success) {
        deps.toast.showToast(formData.id ? "Bloco atualizado!" : "Bloco criado!", { type: "success" });
        showModalBloco.value = false;
        await fetchBlocos();
        return true;
      }
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro", { type: "error" });
    }
    return false;
  }

  // ── Exclusão ──────────────────────────────────────
  function confirmDelete(id: string, type: "conteudo" | "bloco") {
    deleteTargetId.value = id;
    deleteTargetType.value = type;
    showConfirmDelete.value = true;
  }

  async function handleDelete() {
    if (!deleteTargetId.value) return;
    isDeleting.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const ep = deleteTargetType.value === "conteudo" ? "/api/programacao_atividades/conteudos" : "/api/programacao_atividades/blocos";
      const res = (await $fetch(ep, { method: "DELETE", body: { id: deleteTargetId.value, id_entidade } })) as any;
      if (res?.success === false) throw new Error(res?.message || "Erro");
      deps.toast.showToast("Removido!", { type: "success" });
      if (deleteTargetType.value === "conteudo") await fetchConteudos();
      else await fetchBlocos();
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro", { type: "error" });
    } finally {
      isDeleting.value = false;
      showConfirmDelete.value = false;
      deleteTargetId.value = null;
    }
  }

  return {
    visao, alternarVisao,
    conteudos, loadingConteudos,
    busca, filtroTipo, filtroMeus,
    pagina, totalRegistros, totalPaginas, irParaPagina,
    blocos, loadingBlocos,
    expandedBlocoId, conteudosDoBloco, loadingConteudosDoBloco, toggleExpandir,
    showModalConteudo, isEditConteudo, editConteudoData,
    showModalBloco, isEditBloco, editBlocoData,
    showConfirmDelete, deleteTargetId, deleteTargetType, isDeleting,
    blocosDisponiveis, blocosSelecionados, modalAbaAtiva,
    fetchConteudos, fetchBlocos, fetchBlocosDisponiveis,
    openNovoConteudo, openEditarConteudo, handleSaveConteudo,
    openNovoBloco, openEditarBloco, handleSaveBloco,
    confirmDelete, handleDelete,
  };
}
