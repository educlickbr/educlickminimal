import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

export function useOportunidadesAbertas() {
  const { showToast } = useToast();
  const isLoading = ref(false);
  const oportunidades = ref<any[]>([]);

  const fetchOportunidades = async (anoSemestre: string) => {
    isLoading.value = true;
    try {
      const data = await ofetch<any[]>("/api/bolsas/oportunidades", {
        params: {
          ano_semestre: anoSemestre,
          public_view: true,
        },
      });

      oportunidades.value = data || [];
    } catch (e: any) {
      console.error(e);
      showToast("Erro ao carregar oportunidades.", { type: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const downloadFile = async (item: any) => {
    if (!item.arquivo_url) {
      showToast("Nenhum arquivo anexado.", { type: "info" });
      return;
    }

    try {
      const { hash_base, error } = await ofetch<any>(
        "/api/refresh-hash-oportunidades",
      );

      if (error || !hash_base) {
        throw new Error(error || "Falha ao gerar token de acesso.");
      }

      let finalUrl = "";
      const fileName = item.arquivo_url.split("/").pop();

      if (hash_base.includes("?")) {
        const [baseUrl, queryParams] = hash_base.split("?");
        const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
        finalUrl = `${cleanBase}${fileName}?${queryParams}`;
      } else {
        finalUrl = `${hash_base}${fileName}`;
      }

      window.open(finalUrl, "_blank");
    } catch (e: any) {
      console.error(e);
      showToast("Erro ao abrir arquivo.", { type: "error" });
    }
  };

  return {
    oportunidades,
    isLoading,
    fetchOportunidades,
    downloadFile,
  };
}
