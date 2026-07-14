import { $fetch as ofetch } from "ofetch";

export function useMatriculasModalUnificarConta() {
  const fetchRegistrosCount = async (params: { id_aluno: string }) => {
    const data: any = await ofetch("/api/matriculas/aluno-registros-count", {
      params,
    });
    return data;
  };

  const checkEmail = async (email: string) => {
    const data: any = await ofetch("/api/auth/check-email", {
      params: { email },
    });
    return data;
  };

  const unificarConta = async (body: {
    id_antigo: string;
    email_novo: string;
  }) => {
    await ofetch("/api/matriculas/unificar-conta", {
      method: "POST",
      body,
    });
  };

  return { fetchRegistrosCount, checkEmail, unificarConta };
}
