import { $fetch as ofetch } from "ofetch";
import { decorateStudentNames } from "~~/utils/student_name";
import { useAppStore } from "~/stores/app";

export function useMatriculasAlunos() {
  const store = useAppStore();
  const alunos = ref<any[]>([]);
  const isLoading = ref(false);
  const limit = 20;
  const pagination = ref({
    pagina_atual: 1,
    qtd_paginas: 0,
    qtd_total: 0,
  });

  const enrichComBolsaStatus = async (
    listaAlunos: any[],
    anoSemestre: string,
    idTurma: string | null,
  ) => {
    if (!Array.isArray(listaAlunos) || listaAlunos.length === 0) return [];

    const idsMatricula = listaAlunos
      .map((aluno) => aluno?.id_matricula)
      .filter((id) => typeof id === "string" && id.length > 0);

    if (idsMatricula.length === 0) {
      return listaAlunos.map((aluno) => ({ ...aluno, tem_bolsa_ativa: false }));
    }

    try {
      const payload = await ofetch("/api/bolsas/atribuicoes/status", {
        method: "POST",
        body: {
          id_matriculas: idsMatricula,
          ano_semestre: anoSemestre,
          id_turma: idTurma,
        },
      });
      const statusByMatricula = payload?.statusByMatricula || {};
      return listaAlunos.map((aluno) => ({
        ...aluno,
        tem_bolsa_ativa: Boolean(statusByMatricula[aluno?.id_matricula]),
      }));
    } catch (error) {
      console.error("Erro ao carregar status de bolsas:", error);
      return listaAlunos.map((aluno) => ({ ...aluno, tem_bolsa_ativa: false }));
    }
  };

  const fetchAlunos = async (
    anoSemestre: string,
    filters: {
      curso: string;
      area: string;
      turno: string;
      busca: string;
      status: string;
      bolsista: string;
    },
    page = 1,
  ) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch("/api/matriculas/alunos", {
        params: {
          ano_semestre: anoSemestre,
          id_turma: filters.curso || null,
          area: !filters.curso ? filters.area || null : null,
          turno: !filters.curso ? filters.turno || null : null,
          busca: filters.busca || null,
          status: filters.status || null,
          bolsista: filters.bolsista || null,
          page,
          limit,
        },
      });

      const alunosDecorados = decorateStudentNames(data.alunos || []);
      alunos.value = await enrichComBolsaStatus(
        alunosDecorados,
        anoSemestre,
        filters.curso || null,
      );

      if (data.paginacao) {
        pagination.value = {
          pagina_atual: data.paginacao.pagina_atual,
          qtd_paginas: data.paginacao.qtd_paginas,
          qtd_total: data.paginacao.qtd_total,
        };
      } else {
        pagination.value = {
          pagina_atual: page,
          qtd_paginas: Math.ceil((data.total || alunos.value.length) / limit),
          qtd_total: data.total || alunos.value.length,
        };
      }
    } catch (e) {
      console.error("Erro ao buscar alunos:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const previousPage = async () => {
    if (pagination.value.pagina_atual > 1) {
      await store.refreshHash();
      // Caller must pass the fetch function with current params
    }
  };

  const nextPage = async () => {
    if (pagination.value.pagina_atual < pagination.value.qtd_paginas) {
      await store.refreshHash();
    }
  };

  return {
    alunos,
    isLoading,
    pagination,
    limit,
    fetchAlunos,
    previousPage,
    nextPage,
  };
}
