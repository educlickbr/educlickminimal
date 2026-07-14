import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

// Composable: estado e fetch de reuniões + presença
export function useBolsasReunioes() {
  const toast = useToast();

  const reunioes = ref<any[]>([]);
  const isLoadingReunioes = ref(false);
  const paginationReunioes = ref({
    pagina_atual: 1,
    qtd_paginas: 0,
    qtd_total: 0,
  });
  const limitReunioes = 10;

  const fetchReunioes = async (anoSemestre: string, page = 1) => {
    isLoadingReunioes.value = true;
    try {
      const res = (await ofetch("/api/bolsas/reunioes/detalhes", {
        query: {
          ano_semestre: anoSemestre,
          page,
          limit: limitReunioes,
        },
      })) as any;

      reunioes.value = res.reunioes || [];
      paginationReunioes.value = {
        pagina_atual: res.page || page,
        qtd_paginas: res.pages || 1,
        qtd_total: res.total || 0,
      };
    } catch (e: any) {
      console.error(e);
      toast.showToast("Erro ao carregar reuniões.", { type: "error" });
    } finally {
      isLoadingReunioes.value = false;
    }
  };

  const changeReuniaoPage = (newPage: number, anoSemestre: string) => {
    paginationReunioes.value.pagina_atual = newPage;
    fetchReunioes(anoSemestre, newPage);
  };

  const handlePresencaChange = async (
    idReuniao: string,
    idAtribuicao: string,
    presenca: "presente" | "falta" | "abonada" | "justificada" | null,
    observacoes: string,
    anoSemestre: string,
    paginaAtual: number,
  ) => {
    // Atualização otimista local
    const reuniao = reunioes.value.find((r: any) => r.id === idReuniao);
    if (reuniao && Array.isArray(reuniao.alunos)) {
      const aluno = reuniao.alunos.find(
        (a: any) => a.id_atribuicao === idAtribuicao,
      );
      if (aluno) {
        aluno.presenca = presenca;
        aluno.observacoes = observacoes;
      }
    }

    try {
      await ofetch("/api/bolsas/reunioes/presenca", {
        method: "POST",
        body: {
          id_reuniao: idReuniao,
          id_atribuicao: idAtribuicao,
          presenca,
          observacoes,
        },
      });
      toast.showToast("Status da reunião atualizado com sucesso!", {
        type: "success",
      });
    } catch (e: any) {
      console.error("Erro ao atualizar presença:", e);
      toast.showToast("Erro ao atualizar status da reunião", {
        type: "error",
      });
      fetchReunioes(anoSemestre, paginaAtual);
    }
  };

  return {
    reunioes,
    isLoadingReunioes,
    paginationReunioes,
    fetchReunioes,
    changeReuniaoPage,
    handlePresencaChange,
  };
}
