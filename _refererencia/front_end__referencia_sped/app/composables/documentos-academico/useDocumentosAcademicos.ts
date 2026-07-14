import { $fetch as ofetch } from "ofetch";

export function useDocumentosAcademicos() {
  const fetchHashBase = async () => {
    const res: any = await ofetch("/api/refresh-hash-documentos-cursos");
    return res?.hash_base || null;
  };

  const fetchDocumentos = async (params: {
    busca: string | null;
    pagina: number;
    limite: number;
  }) => {
    const data: any = await ofetch("/api/common/documentos-meus", {
      params,
    });
    return data;
  };

  return {
    fetchHashBase,
    fetchDocumentos,
  };
}
