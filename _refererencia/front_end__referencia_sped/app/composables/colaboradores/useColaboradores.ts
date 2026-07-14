import { $fetch as ofetch } from "ofetch";
import { ref, computed } from "vue";
import { useAppStore } from "~/stores/app";
import { useToast } from "../../../composables/useToast";

export function useColaboradores() {
  const store = useAppStore();
  const { showToast } = useToast();
  const hashBase = computed(() => store.hash_base || "");

  // ── State ────────────────────────────────────────────────────
  const colaboradores = ref<any[]>([]);
  const isLoading = ref(false);
  const pagination = ref({
    pagina_atual: 1,
    qtd_paginas: 0,
    qtd_total: 0,
  });
  const limit = 20;

  const filters = ref({
    busca: "",
  });

  // ── Modais ────────────────────────────────────────────────────
  const showStatusModal = ref(false);
  const showConviteModal = ref(false);
  const showDadosModal = ref(false);
  const showTrocaPapelModal = ref(false);
  const modalMode = ref<"dados" | "documentos">("dados");
  const selectedColaborador = ref<any>(null);
  const selectedDadosColaborador = ref<any>(null);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchColaboradores = async (page = 1) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch("/api/colaboradores", {
        params: {
          busca: filters.value.busca || null,
          page,
          limit,
        },
      });

      colaboradores.value = data.colaboradores || [];

      if (data.pages !== undefined) {
        pagination.value = {
          pagina_atual: data.page,
          qtd_paginas: data.pages,
          qtd_total: data.total,
        };
      } else {
        pagination.value = {
          pagina_atual: page,
          qtd_paginas: Math.ceil(
            (data.total || colaboradores.value.length) / limit,
          ),
          qtd_total: data.total || colaboradores.value.length,
        };
      }
    } catch (e) {
      console.error("Erro ao buscar colaboradores:", e);
      showToast("Erro ao buscar lista de colaboradores", { type: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  // ── Paginação ─────────────────────────────────────────────────
  const previousPage = async () => {
    if (pagination.value.pagina_atual > 1) {
      await store.refreshHash();
      fetchColaboradores(pagination.value.pagina_atual - 1);
    }
  };

  const nextPage = async () => {
    if (pagination.value.pagina_atual < pagination.value.qtd_paginas) {
      await store.refreshHash();
      fetchColaboradores(pagination.value.pagina_atual + 1);
    }
  };

  // ── Handlers de modais ────────────────────────────────────────
  const openStatusModal = (colab: any) => {
    selectedColaborador.value = colab;
    showStatusModal.value = true;
  };

  const openTrocaPapelModal = (colab: any) => {
    selectedColaborador.value = colab;
    showTrocaPapelModal.value = true;
  };

  const openDadosModal = (colab: any) => {
    selectedDadosColaborador.value = {
      ...colab,
      id_user_expandido: colab.id,
      nome_completo: `${colab.nome} ${colab.sobrenome}`,
    };
    modalMode.value = "dados";
    showDadosModal.value = true;
  };

  const openPhotoModal = (colab: any) => {
    selectedDadosColaborador.value = {
      ...colab,
      id_user_expandido: colab.id,
      nome_completo: `${colab.nome} ${colab.sobrenome}`,
    };
    modalMode.value = "documentos";
    showDadosModal.value = true;
  };

  const handleStatusUpdated = () => {
    fetchColaboradores(pagination.value.pagina_atual);
  };

  const handleRoleUpdated = () => {
    fetchColaboradores(pagination.value.pagina_atual);
  };

  const handleCandidateUpdate = (data: any) => {
    if (!selectedDadosColaborador.value) return;
    const index = colaboradores.value.findIndex(
      (c) => c.id === selectedDadosColaborador.value.id,
    );
    if (index !== -1) {
      colaboradores.value[index] = { ...colaboradores.value[index], ...data };
    }
  };

  return {
    // Data
    colaboradores,
    isLoading,
    pagination,
    limit,
    filters,
    hashBase,
    // Modais
    showStatusModal,
    showConviteModal,
    showDadosModal,
    showTrocaPapelModal,
    modalMode,
    selectedColaborador,
    selectedDadosColaborador,
    // Actions
    fetchColaboradores,
    previousPage,
    nextPage,
    openStatusModal,
    openTrocaPapelModal,
    openDadosModal,
    openPhotoModal,
    handleStatusUpdated,
    handleRoleUpdated,
    handleCandidateUpdate,
  };
}
