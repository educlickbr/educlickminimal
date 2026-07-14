import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

export function useProcessoSeletivoJnpta() {
  const { showToast } = useToast();
  const user = useSupabaseUser();
  const redirectCookie = useCookie<any>("redirect_after_login");

  const editaisJnpta = ref<any[]>([]);
  const loadingEditais = ref(false);
  const loadingElegibilidadeJnpta = ref(false);
  const elegibilidadeJnptaByEdital = ref<
    Record<
      string,
      {
        has_enviada: boolean;
        id_candidatura_enviada: string | null;
        has_rascunho: boolean;
        id_candidatura_rascunho: string | null;
      }
    >
  >({});

  const getJnptaElegibilidade = (idEdital?: string | null) => {
    if (!idEdital) return null;
    return elegibilidadeJnptaByEdital.value[idEdital] || null;
  };

  const isJnptaBlockedByEnviada = (edital?: any) => {
    const elegibilidade = getJnptaElegibilidade(edital?.id_edital);
    return !!elegibilidade?.has_enviada;
  };

  const hasJnptaDraft = (edital?: any) => {
    const elegibilidade = getJnptaElegibilidade(edital?.id_edital);
    return !!elegibilidade?.has_rascunho;
  };

  const fetchEditaisJnpta = async () => {
    loadingEditais.value = true;
    try {
      const url: string = "/api/jnpta/editais/publicos";
      const result = await ofetch<{ ok: boolean; editais: any[] }>(url);
      editaisJnpta.value = result.editais || [];
    } catch (e) {
      console.error("Erro ao buscar editais JNPTA:", e);
      editaisJnpta.value = [];
    } finally {
      loadingEditais.value = false;
    }
  };

  const fetchElegibilidadeJnpta = async () => {
    if (!user.value) {
      elegibilidadeJnptaByEdital.value = {};
      return;
    }

    loadingElegibilidadeJnpta.value = true;
    try {
      const url: string = "/api/jnpta/editais/elegibilidade";
      const result = await ofetch<any>(url);
      elegibilidadeJnptaByEdital.value = result?.editais || {};
    } catch (e) {
      console.error("Erro ao buscar elegibilidade JNPTA:", e);
      elegibilidadeJnptaByEdital.value = {};
    } finally {
      loadingElegibilidadeJnpta.value = false;
    }
  };

  const handleInscricaoJnpta = async (edital: any) => {
    if (!edital?.id_edital) {
      showToast("Edital inválido para inscrição.", { type: "error" });
      return;
    }

    if (isJnptaBlockedByEnviada(edital)) {
      showToast(
        "Você já possui uma inscrição enviada para este edital da Jornada Paulista.",
        { type: "info" },
      );
      return;
    }

    const targetPath =
      edital.qual_tempo === "primeiro_tempo"
        ? `/inscricao/jornadas/primeiro-tempo/${edital.id_edital}`
        : `/inscricao/jornadas/${edital.id_edital}`;

    const supabase = useSupabaseClient();
    const { data: authData } = await supabase.auth.getUser();
    const isAuthenticated = !!(authData?.user || user.value);

    if (isAuthenticated) {
      navigateTo(targetPath);
    } else {
      redirectCookie.value = {
        path: targetPath,
        query: {},
        procedencia_form: true,
      };
      navigateTo("/login");
    }
  };

  const handleOpenEditalJnpta = async (arquivoEdital: string) => {
    if (!arquivoEdital) {
      showToast("Arquivo do edital não encontrado.", { type: "info" });
      return;
    }

    const fallbackUrl = `https://br.storage.bunnycdn.com/sped/jnpta_editais/${arquivoEdital}`;

    try {
      const url: string = "/api/refresh-hash-jnpta-editais";
      const { hash_base, error } = await ofetch<any>(url);

      if (error || !hash_base) {
        window.open(fallbackUrl, "_blank");
        return;
      }

      let finalUrl = "";
      const fileName = arquivoEdital.split("/").pop() || arquivoEdital;

      if (hash_base.includes("?")) {
        const [baseUrl, queryParams] = hash_base.split("?");
        const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
        finalUrl = `${cleanBase}${fileName}?${queryParams}`;
      } else {
        finalUrl = `${hash_base}${fileName}`;
      }

      window.open(finalUrl, "_blank");
    } catch (e) {
      console.error("Erro ao abrir edital JNPTA:", e);
      window.open(fallbackUrl, "_blank");
    }
  };

  return {
    editaisJnpta,
    loadingEditais,
    loadingElegibilidadeJnpta,
    elegibilidadeJnptaByEdital,
    getJnptaElegibilidade,
    isJnptaBlockedByEnviada,
    hasJnptaDraft,
    fetchEditaisJnpta,
    fetchElegibilidadeJnpta,
    handleInscricaoJnpta,
    handleOpenEditalJnpta,
  };
}
