import { $fetch as ofetch } from "ofetch";

export function useMatriculasModalTrocaTurno() {
  const fetchDisponiveis = async (params: { id_turma: string }) => {
    const response: any = await ofetch(
      "/api/matriculas/troca-turno/disponiveis",
      { params },
    );
    return response;
  };

  const efetivarTroca = async (body: {
    id_matricula: string;
    id_aluno: string;
    id_turma_nova: string;
  }) => {
    const response: any = await ofetch("/api/matriculas/troca-turno/efetivar", {
      method: "POST",
      body,
    });
    return response;
  };

  return { fetchDisponiveis, efetivarTroca };
}
