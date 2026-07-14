import { $fetch as ofetch } from "ofetch";

export function useMatriculasModalListaAlunos() {
  const fetchAlunos = async (params: {
    ano_semestre: string;
    id_turma?: string | null;
    turno?: string | null;
    area?: string | null;
    busca?: string | null;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const data: any = await ofetch("/api/matriculas/alunos", { params });
    return data;
  };

  return { fetchAlunos };
}
