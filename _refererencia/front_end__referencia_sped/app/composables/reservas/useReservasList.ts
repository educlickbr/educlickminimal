import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useReservasList() {
  const reservas = ref<any[]>([]);
  const isLoading = ref(false);
  const pagination = ref({ pagina_atual: 1, qtd_paginas: 1, qtd_itens: 0 });

  // Expansion
  const expandedItems = ref<Record<string, any[]>>({});
  const loadingDetails = ref<Record<string, boolean>>({});
  const expandedReservas = ref<Set<string>>(new Set());

  const fetchReservas = async (page: number = 1, busca?: string) => {
    isLoading.value = true;
    try {
      const data = await ofetch("/api/producao/estoque/reservas", {
        params: {
          page,
          limit: 12,
          busca: busca || undefined,
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

  const updateStatus = async (ids: string[], status: string) => {
    await ofetch("/api/producao/estoque/reserva-status", {
      method: "PUT",
      body: { ids, status },
    });
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

  const searchUsers = async (busca: string) => {
    return await ofetch("/api/producao/estoque/users-reserva", {
      params: { busca },
    });
  };

  const searchProdutos = async (params: {
    busca?: string;
    data_retirada?: string;
    data_devolucao?: string;
  }) => {
    return await ofetch("/api/producao/estoque/produtos-disponiveis", {
      params,
    });
  };

  const createReserva = async (payload: {
    id_usuario: string;
    id_produto: string;
    quantidade: number;
    data_retirada: string;
    data_devolucao: string;
  }) => {
    await ofetch("/api/producao/estoque/reserva", {
      method: "POST",
      body: payload,
    });
  };

  return {
    reservas,
    isLoading,
    pagination,
    expandedItems,
    loadingDetails,
    expandedReservas,
    fetchReservas,
    updateStatus,
    deleteReserva,
    fetchDetails,
    searchUsers,
    searchProdutos,
    createReserva,
  };
}
