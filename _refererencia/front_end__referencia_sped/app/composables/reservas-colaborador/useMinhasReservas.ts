import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useMinhasReservas(userId: string) {
  const reservas = ref<any[]>([]);
  const isLoading = ref(false);
  const pagination = ref({ pagina_atual: 1, qtd_paginas: 1, qtd_itens: 0 });

  const expandedItems = ref<Record<string, any[]>>({});
  const loadingDetails = ref<Record<string, boolean>>({});
  const expandedReservas = ref<Set<string>>(new Set());

  const fetchReservas = async (
    page: number = 1,
    busca?: string,
    status?: string
  ) => {
    isLoading.value = true;
    try {
      const data = await ofetch("/api/producao/estoque/reservas", {
        params: {
          page,
          limit: 12,
          busca: busca || undefined,
          status: status || undefined,
          userId,
        },
      });
      if (data) {
        reservas.value = data.itens || [];
        pagination.value = {
          pagina_atual: data.pagina_atual,
          qtd_paginas: data.qtd_paginas,
          qtd_itens: data.qtd_itens,
        };
      }
    } finally {
      isLoading.value = false;
    }
  };

  const deleteReserva = async (ids: string[]) => {
    await ofetch("/api/producao/estoque/reserva", {
      method: "DELETE",
      params: { ids: ids.join(",") },
    });
  };

  const fetchDetails = async (ids: string[]) => {
    const id = ids[0];
    if (!id) return;
    loadingDetails.value[id] = true;
    try {
      const details = await ofetch("/api/producao/estoque/reserva-itens", {
        method: "POST",
        body: { ids },
      });
      expandedItems.value[id] = details;
    } finally {
      loadingDetails.value[id] = false;
    }
  };

  return {
    reservas,
    isLoading,
    pagination,
    expandedItems,
    loadingDetails,
    expandedReservas,
    fetchReservas,
    deleteReserva,
    fetchDetails,
  };
}
