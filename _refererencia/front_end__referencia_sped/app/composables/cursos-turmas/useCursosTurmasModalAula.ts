import { $fetch as ofetch } from "ofetch";

export function useCursosTurmasModalAula() {
  const saveEvento = async (payload: Record<string, any>) => {
    return await ofetch("/api/cursos-turmas/calendario/evento", {
      method: "POST",
      body: payload,
    });
  };

  const deleteEvento = async (id: string) => {
    return await ofetch("/api/cursos-turmas/calendario/evento", {
      method: "DELETE",
      body: { id },
    });
  };

  return {
    saveEvento,
    deleteEvento,
  };
}
