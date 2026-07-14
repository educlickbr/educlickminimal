import { $fetch as ofetch } from "ofetch";

export function useGestaoCertificadosModalParametrizacao() {
  const fetchPublicCertificadoUrl = async (idCertificadoEmitido: string) => {
    const data = await ofetch<{
      ok: boolean;
      path: string;
      url: string;
    }>(`/api/certificado/validacao/${idCertificadoEmitido}/publico`);
    return data;
  };

  return {
    fetchPublicCertificadoUrl,
  };
}
