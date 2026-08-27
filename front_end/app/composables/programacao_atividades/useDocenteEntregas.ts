/**
 * useDocenteEntregas
 *
 * Composable do Portal Docente — Atividades e Entregas.
 * Fluxo: conteúdos com entregas → alunos (entregas) → correção (nota + comentário).
 * Corrigível: conteúdo criado pelo docente. Somente leitura: do programa que leciona.
 */

import { ref, computed } from "vue";
import { useAppStore } from "~~/stores/app";

export interface ConteudoEntrega {
  id_conteudo: string;
  titulo: string;
  tipo: string; // atividade | avaliacao
  criado_por: string | null;
  eh_meu: boolean; // corrigível
  qtd_total: number;
  qtd_pendentes: number;
  qtd_corrigidas: number;
}

export interface EntregaAluno {
  id_submissao: string;
  tipo_submissao: string; // atividade | avaliacao
  id_matricula: string;
  aluno_nome: string;
  status: string;
  nota: number | null;
  comentario: string | null;
  data_envio: string | null;
  tentativa: number;
  status_corrigido: boolean;
}

export function useDocenteEntregas(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (msg: string, opts?: { type?: "info" | "error" | "success" }) => void;
  };
}) {
  const store = useAppStore();

  // ── Conteúdos com entregas ──────────────────────
  const conteudos = ref<ConteudoEntrega[]>([]);
  const loadingConteudos = ref(false);
  const conteudoSelecionado = ref<ConteudoEntrega | null>(null);

  // Filtros da lista de conteúdos
  const busca = ref("");
  const filtroTipo = ref<string | null>(null); // atividade | avaliacao
  const soPendentes = ref(false);

  // ── Entregas de um conteúdo ─────────────────────
  const entregas = ref<EntregaAluno[]>([]);
  const loadingEntregas = ref(false);
  const entregaSelecionada = ref<EntregaAluno | null>(null);

  // Filtros da lista de entregas
  const buscaAluno = ref("");
  const soPendentesEntregas = ref(false);

  // ── Detalhe / correção ──────────────────────────
  const detalhe = ref<any>(null);
  const loadingDetalhe = ref(false);
  const savingCorrecao = ref(false);
  const notaCorrecao = ref<string>("");
  const comentarioCorrecao = ref("");

  const conteudosExibidos = computed(() => {
    return conteudos.value.filter((c) => {
      if (busca.value) {
        const q = busca.value.toLowerCase();
        if (!c.titulo.toLowerCase().includes(q)) return false;
      }
      if (filtroTipo.value && c.tipo !== filtroTipo.value) return false;
      if (soPendentes.value && c.qtd_pendentes === 0) return false;
      return true;
    });
  });

  const entregasExibidas = computed(() => {
    return entregas.value.filter((e) => {
      if (buscaAluno.value) {
        const q = buscaAluno.value.toLowerCase();
        if (!e.aluno_nome.toLowerCase().includes(q)) return false;
      }
      if (soPendentesEntregas.value && e.status_corrigido) return false;
      return true;
    });
  });

  const resumo = computed(() => {
    return {
      conteudos: conteudos.value.length,
      pendentes: conteudos.value.reduce((acc, c) => acc + c.qtd_pendentes, 0),
      corrigidas: conteudos.value.reduce((acc, c) => acc + c.qtd_corrigidas, 0),
    };
  });

  // ── Fetch conteúdos ─────────────────────────────
  async function fetchConteudos() {
    loadingConteudos.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/docente/conteudos", {
        params: { id_entidade, id_usuario: store.user_expandido_id },
      })) as any;
      conteudos.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar conteúdos", { type: "error" });
    } finally {
      loadingConteudos.value = false;
    }
  }

  // ── Selecionar conteúdo → lista de entregas ─────
  async function selecionarConteudo(c: ConteudoEntrega) {
    conteudoSelecionado.value = c;
    entregaSelecionada.value = null;
    detalhe.value = null;
    entregas.value = [];
    buscaAluno.value = "";
    soPendentesEntregas.value = false;
    await fetchEntregas(c.id_conteudo);
  }

  async function fetchEntregas(idConteudo: string) {
    loadingEntregas.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/docente/entregas", {
        params: { id_conteudo: idConteudo, id_entidade, id_usuario: store.user_expandido_id },
      })) as any;
      entregas.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar entregas", { type: "error" });
    } finally {
      loadingEntregas.value = false;
    }
  }

  // ── Selecionar entrega → detalhe ────────────────
  async function selecionarEntrega(e: EntregaAluno) {
    entregaSelecionada.value = e;
    detalhe.value = null;
    loadingDetalhe.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/docente/entrega", {
        params: {
          id_submissao: e.id_submissao,
          tipo: e.tipo_submissao,
          id_entidade,
          id_usuario: store.user_expandido_id,
        },
      })) as any;
      detalhe.value = res;
      notaCorrecao.value = res?.nota !== null && res?.nota !== undefined ? String(res.nota) : "";
      comentarioCorrecao.value = res?.comentario || "";
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar entrega", { type: "error" });
    } finally {
      loadingDetalhe.value = false;
    }
  }

  // ── Salvar correção ─────────────────────────────
  async function salvarCorrecao() {
    if (!entregaSelecionada.value || !detalhe.value) return;
    const notaStr = String(notaCorrecao.value ?? "").trim();
    if (notaStr === "") {
      deps.toast.showToast("Informe a nota", { type: "error" });
      return;
    }
    savingCorrecao.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/docente/correcao", {
        method: "POST",
        body: {
          tipo: entregaSelecionada.value.tipo_submissao,
          id_submissao: entregaSelecionada.value.id_submissao,
          nota: Number(notaStr.replace(",", ".")),
          comentario: comentarioCorrecao.value || null,
          id_entidade,
          id_usuario: store.user_expandido_id,
        },
      })) as any;

      if (res?.success) {
        deps.toast.showToast("Correção salva!", { type: "success" });
        detalhe.value.nota = Number(notaStr.replace(",", "."));
        detalhe.value.comentario = comentarioCorrecao.value || null;
        // Feedback imediato de auditoria (quem/quando) sem refetch do detalhe
        detalhe.value.corrigido_em = new Date().toISOString();
        detalhe.value.corrigido_por_nome =
          [store.nome, store.sobrenome].filter(Boolean).join(" ") || null;

        // Recarrega entregas e re-liga a seleção ao objeto novo (contadores frescos)
        if (conteudoSelecionado.value) {
          await fetchEntregas(conteudoSelecionado.value.id_conteudo);
          if (entregaSelecionada.value) {
            const nova = entregas.value.find(
              (e) => e.id_submissao === entregaSelecionada.value?.id_submissao
            );
            if (nova) entregaSelecionada.value = nova;
          }
        }
        await fetchConteudos();
        if (conteudoSelecionado.value) {
          const novo = conteudos.value.find(
            (c) => c.id_conteudo === conteudoSelecionado.value?.id_conteudo
          );
          if (novo) conteudoSelecionado.value = novo;
        }
      }
    } catch (e: any) {
      deps.toast.showToast(e?.statusMessage || e?.message || "Erro ao salvar", { type: "error" });
    } finally {
      savingCorrecao.value = false;
    }
  }

  function voltarParaConteudos() {
    conteudoSelecionado.value = null;
    entregaSelecionada.value = null;
    detalhe.value = null;
    entregas.value = [];
  }

  function voltarParaEntregas() {
    entregaSelecionada.value = null;
    detalhe.value = null;
  }

  return {
    // Conteúdos
    conteudos, conteudosExibidos, loadingConteudos,
    conteudoSelecionado, fetchConteudos, selecionarConteudo,
    busca, filtroTipo, soPendentes,

    // Entregas
    entregas, entregasExibidas, loadingEntregas,
    entregaSelecionada, selecionarEntrega,
    buscaAluno, soPendentesEntregas,

    // Detalhe / correção
    detalhe, loadingDetalhe, savingCorrecao,
    notaCorrecao, comentarioCorrecao,
    salvarCorrecao,

    // Navegação
    voltarParaConteudos, voltarParaEntregas,

    // Resumo (sidebar)
    resumo,
  };
}
