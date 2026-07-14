import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";
import { decorateStudentNames } from "../../../utils/student_name";

export function useAvaliacaoGestaoAtividadesTab() {
  // ── Turmas ──
  const turmas = ref<any[]>([]);
  const turmaAtiva = ref<string>("");
  const loadingTurmas = ref(false);

  const fetchTurmas = async (anoSemestre?: string) => {
    loadingTurmas.value = true;
    turmaAtiva.value = "";
    try {
      const params: Record<string, any> = { limite: 200, area: "Regulares" };
      if (anoSemestre) params.ano_semestre = anoSemestre;
      const data: any = await ofetch("/api/cursos-turmas/turmas", { params });
      turmas.value = data?.itens || [];
      if (turmas.value.length) turmaAtiva.value = turmas.value[0].id;
    } catch (e) {
      console.error(e);
      turmas.value = [];
    } finally {
      loadingTurmas.value = false;
    }
  };

  // ── Turmas (Matrículas) ──
  const fetchTurmasMatriculas = async (anoSemestre: string) => {
    const data: any = await ofetch("/api/matriculas/turmas", {
      params: { ano_semestre: anoSemestre, area: "Regulares", limite: 200 },
    });
    return data?.turmas || [];
  };

  // ── Avaliação por Turma ──
  const avaliacaoTurma = ref<any>(null);
  const loadingAvTurma = ref(false);

  const fetchAvaliacaoPorTurma = async (turmaId: string, etapa: string) => {
    if (!turmaId) return;
    loadingAvTurma.value = true;
    avaliacaoTurma.value = null;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao/por-turma", {
        params: { id_turma: turmaId, etapa },
      });
      avaliacaoTurma.value = data ?? null;
    } catch (e) {
      console.error(e);
    } finally {
      loadingAvTurma.value = false;
    }
  };

  // ── Atividades ──
  const atividades = ref<any[]>([]);
  const loadingAtividades = ref(false);

  const fetchAtividades = async () => {
    loadingAtividades.value = true;
    try {
      const data: any = await ofetch("/api/avaliacao-gestao/atividades");
      atividades.value = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(error);
      atividades.value = [];
    } finally {
      loadingAtividades.value = false;
    }
  };

  // ── Associar Atividades ──
  const associarAlunos = ref<any[]>([]);
  const associarAvaliacao = ref<any | null>(null);
  const loadingAssociarAlunos = ref(false);

  const fetchAlunosAssociarAtividades = async (
    turmaId: string | null,
    etapa: string,
    anoSemestre: string,
  ) => {
    if (!turmaId) {
      associarAlunos.value = [];
      associarAvaliacao.value = null;
      return;
    }
    loadingAssociarAlunos.value = true;
    try {
      const data: any = await ofetch(
        "/api/avaliacao-gestao/associar-atividade-alunos",
        {
          params: {
            id_turma: turmaId,
            etapa,
            ano_semestre: anoSemestre,
          },
        },
      );
      associarAvaliacao.value = data?.avaliacao || null;
      associarAlunos.value = decorateStudentNames(data?.alunos || []);
    } catch (error) {
      console.error(error);
      associarAvaliacao.value = null;
      associarAlunos.value = [];
    } finally {
      loadingAssociarAlunos.value = false;
    }
  };

  const deleteAssociacaoAtividade = async (idEntrega: string) => {
    await ofetch("/api/avaliacao-gestao/atividades-associacao", {
      method: "DELETE",
      body: { id_entrega: idEntrega },
    });
  };

  const fetchAtividadesAssociacao = async (params: Record<string, any>) => {
    return await ofetch("/api/avaliacao-gestao/atividades-associacao", {
      params,
    });
  };

  const associarAtividade = async (body: {
    id_avaliacao: string;
    id_aluno: string;
    id_atividade: string;
  }) => {
    return await ofetch("/api/avaliacao-gestao/atividades-associacao", {
      method: "POST",
      body,
    });
  };

  // ── Entregas ──
  const entregas = ref<any[]>([]);
  const loadingEntregas = ref(false);

  const fetchEntregas = async (
    idAvaliacao: string | null,
    status?: string | null,
    dataInicio?: string | null,
    dataFim?: string | null,
  ) => {
    if (!idAvaliacao) {
      entregas.value = [];
      return [];
    }
    loadingEntregas.value = true;
    try {
      const data: any = await ofetch(
        "/api/avaliacao-gestao/entregas-atividades",
        {
          params: {
            id_avaliacao: idAvaliacao,
            status: status || null,
            data_inicio: dataInicio || null,
            data_fim: dataFim || null,
          },
        },
      );
      entregas.value = Array.isArray(data) ? data : [];
      return entregas.value;
    } catch (err) {
      console.error(err);
      entregas.value = [];
      return [];
    } finally {
      loadingEntregas.value = false;
    }
  };

  const uploadArquivoAtividade = async (
    fileBase64: string,
    fileName: string,
    originalName: string,
  ) => {
    return await ofetch("/api/avaliacao-gestao/atividades/upload", {
      method: "POST",
      body: { fileBase64, fileName, originalName },
    });
  };

  const deleteArquivoAtividade = async (id: string, filePath: string) => {
    await ofetch("/api/avaliacao-gestao/atividades/delete-file", {
      method: "POST",
      body: { id, filePath },
    });
  };

  const saveAtividade = async (body: any, isEdit: boolean) => {
    const method = isEdit ? "PUT" : "POST";
    await ofetch("/api/avaliacao-gestao/atividades", { method, body });
  };

  const avaliarEntrega = async (
    idEntrega: string,
    status: "Aprovado" | "Reprovado",
    feedback: string | null,
  ) => {
    await ofetch("/api/avaliacao-gestao/avaliar-entrega-atividade", {
      method: "POST",
      body: { id_entrega: idEntrega, status, feedback },
    });
  };

  // ── Hash ──
  const hashEntregas = ref<string | null>(null);

  const refreshHashAtividades = async () => {
    try {
      const { hash_base } = await ofetch("/api/refresh-hash-atividades");
      hashEntregas.value = hash_base || null;
    } catch {
      hashEntregas.value = null;
    }
  };

  return {
    turmas,
    turmaAtiva,
    loadingTurmas,
    fetchTurmas,
    fetchTurmasMatriculas,
    avaliacaoTurma,
    loadingAvTurma,
    fetchAvaliacaoPorTurma,
    atividades,
    loadingAtividades,
    fetchAtividades,
    associarAlunos,
    associarAvaliacao,
    loadingAssociarAlunos,
    fetchAlunosAssociarAtividades,
    deleteAssociacaoAtividade,
    fetchAtividadesAssociacao,
    associarAtividade,
    uploadArquivoAtividade,
    deleteArquivoAtividade,
    saveAtividade,
    entregas,
    loadingEntregas,
    fetchEntregas,
    avaliarEntrega,
    hashEntregas,
    refreshHashAtividades,
  };
}
