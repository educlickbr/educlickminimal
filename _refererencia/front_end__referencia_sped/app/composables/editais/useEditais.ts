import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

// Composable: estado e fetch de editais + download de arquivos
export function useEditais() {
  const toast = useToast();
  const isLoading = ref(false);
  const editais = ref<any[]>([]);

  const fetchEditais = async (anoSemestre: string) => {
    isLoading.value = true;
    try {
      const data = await ofetch<any[]>("/api/editais", {
        params: { ano_semestre: anoSemestre },
      });

      editais.value = (data || []).map((edital: any) => {
        let etapas = edital?.etapas;
        if (typeof etapas === "string") {
          try {
            etapas = JSON.parse(etapas);
          } catch {
            etapas = [];
          }
        }
        return { ...edital, etapas: Array.isArray(etapas) ? etapas : [] };
      });
    } catch (e: any) {
      console.error(e);
      toast.showToast("Erro ao carregar editais.", { type: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  const downloadFile = async (item: any) => {
    if (!item.arquivo_url) {
      toast.showToast("Nenhum arquivo anexado.", { type: "info" });
      return;
    }

    try {
      const { hash_base, error } = await ofetch<any>(
        "/api/refresh-hash-editais-externos",
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
      toast.showToast("Erro ao abrir arquivo.", { type: "error" });
    }
  };

  return { editais, isLoading, fetchEditais, downloadFile };
}
