import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

// Composable: estado e fetch de atribuições + ações (atribuir, encerrar, promover, etc.)
export function useBolsasAtribuicoes() {
  const toast = useToast();

  const atribuicoes = ref<any[]>([]);
  const isLoadingAtribuicoes = ref(false);
  const turmasAtribuicao = ref<any[]>([]);
  const isLoadingTurmasAtribuicao = ref(false);

  const paginationAtribuicoes = ref({
    pagina_atual: 1,
    qtd_paginas: 0,
    qtd_total: 0,
  });
  const limitAtribuicoes = 20;
  const atribuicaoStatusOptions = [
    "Todos",
    "Inscrito Edital",
    "Atribuídos",
    "Suplentes",
    "Encerrados",
  ];
  const filtersAtribuicao = ref({
    id_turma: "",
    status: "Todos",
    busca: "",
  });
  let searchAtribuicaoTimeout: any = null;

  const fetchTurmasAtribuicao = async (anoSemestre: string) => {
    isLoadingTurmasAtribuicao.value = true;
    try {
      const data: any = await ofetch("/api/matriculas/turmas", {
        query: {
          ano_semestre: anoSemestre,
          area: "Regulares",
        },
      });
      turmasAtribuicao.value = data.turmas || [];
    } catch (e) {
      console.error("Erro ao buscar turmas para atribuição:", e);
    } finally {
      isLoadingTurmasAtribuicao.value = false;
    }
  };

  const fetchAtribuicoes = async (anoSemestre: string, page = 1) => {
    isLoadingAtribuicoes.value = true;
    try {
      const res = (await ofetch("/api/bolsas/atribuicoes", {
        query: {
          ano_semestre: anoSemestre,
          id_turma: filtersAtribuicao.value.id_turma || null,
          busca: filtersAtribuicao.value.busca || null,
          status: filtersAtribuicao.value.status || null,
          page,
          limit: limitAtribuicoes,
        },
      })) as any;

      atribuicoes.value = res.alunos || [];
      paginationAtribuicoes.value = {
        pagina_atual: res.page || page,
        qtd_paginas: res.pages || 1,
        qtd_total: res.total || 0,
      };
    } catch (e: any) {
      console.error(e);
      toast.showToast("Erro ao carregar atribuições.", { type: "error" });
    } finally {
      isLoadingAtribuicoes.value = false;
    }
  };

  const handleAtribuicaoFilterChange = (anoSemestre: string) => {
    paginationAtribuicoes.value.pagina_atual = 1;
    fetchAtribuicoes(anoSemestre, 1);
  };

  const debouncedSearchAtribuicao = (anoSemestre: string) => {
    if (searchAtribuicaoTimeout) clearTimeout(searchAtribuicaoTimeout);
    searchAtribuicaoTimeout = setTimeout(() => {
      paginationAtribuicoes.value.pagina_atual = 1;
      fetchAtribuicoes(anoSemestre, 1);
    }, 500);
  };

  const changeAtribuicaoPage = (newPage: number, anoSemestre: string) => {
    paginationAtribuicoes.value.pagina_atual = newPage;
    fetchAtribuicoes(anoSemestre, newPage);
  };

  const handlePromoverBolsa = async (
    aluno: any,
    anoSemestre: string,
    paginaAtual: number,
  ) => {
    const idAtribuicao = aluno?.id_atribuicao_suplente || aluno?.id_atribuicao;
    if (!idAtribuicao) {
      toast.showToast(
        "Não foi possível identificar a suplência para promover.",
        { type: "error" },
      );
      return;
    }
    if (!confirm("Deseja promover este suplente agora?")) return;

    try {
      await ofetch("/api/bolsas/atribuicoes/promover", {
        method: "POST",
        body: { id_atribuicao: idAtribuicao },
      });
      toast.showToast("Suplente promovido com sucesso!", {
        type: "success",
      });
      fetchAtribuicoes(anoSemestre, paginaAtual);
    } catch (e: any) {
      console.error("Erro ao promover suplente:", e);
      toast.showToast(
        e?.data?.message || e?.message || "Erro ao promover suplente.",
        { type: "error" },
      );
    }
  };

  const handleReativarBolsa = async (
    aluno: any,
    anoSemestre: string,
    paginaAtual: number,
  ) => {
    const idAtribuicao = aluno?.id_atribuicao_enc || aluno?.id_atribuicao;
    if (!idAtribuicao) {
      toast.showToast(
        "Não foi possível identificar a atribuição encerrada para reativar.",
        { type: "error" },
      );
      return;
    }
    if (!confirm("Deseja desfazer o encerramento desta bolsa?")) return;

    try {
      await ofetch("/api/bolsas/atribuicoes/reativar", {
        method: "POST",
        body: { id_atribuicao: idAtribuicao },
      });
      toast.showToast("Encerramento desfeito com sucesso!", {
        type: "success",
      });
      fetchAtribuicoes(anoSemestre, paginaAtual);
    } catch (e: any) {
      console.error("Erro ao reativar bolsa:", e);
      toast.showToast(
        e?.data?.message || e?.message || "Erro ao desfazer encerramento.",
        { type: "error" },
      );
    }
  };

  return {
    atribuicoes,
    isLoadingAtribuicoes,
    turmasAtribuicao,
    isLoadingTurmasAtribuicao,
    paginationAtribuicoes,
    atribuicaoStatusOptions,
    filtersAtribuicao,
    fetchAtribuicoes,
    fetchTurmasAtribuicao,
    handleAtribuicaoFilterChange,
    debouncedSearchAtribuicao,
    changeAtribuicaoPage,
    handlePromoverBolsa,
    handleReativarBolsa,
  };
}
