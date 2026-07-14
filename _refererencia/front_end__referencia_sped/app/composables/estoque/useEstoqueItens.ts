import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useEstoqueItens() {
  const itens = ref<any[]>([]);
  const isLoading = ref(false);
  const pagination = ref({ pagina_atual: 1, qtd_paginas: 1, qtd_itens: 0 });

  const fetchItens = async (page: number = 1, busca?: string) => {
    isLoading.value = true;
    try {
      const data = await ofetch("/api/producao/estoque/itens", {
        params: {
          page,
          limit: 12,
          busca: busca || undefined,
        },
      });

      if (data) {
        itens.value = data.itens || [];
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

  const deleteItem = async (id: string) => {
    await ofetch("/api/producao/estoque/item", {
      method: "DELETE",
      body: { id },
    });
  };

  const associarKit = async (idItem: string, idKit: string | null) => {
    await ofetch("/api/producao/estoque/associate", {
      method: "PUT",
      body: { id_item: idItem, id_kit: idKit },
    });
  };

  const hasActiveAvaria = (avarias: any[]) => {
    if (!avarias || avarias.length === 0) return false;
    return avarias.some(
      (a: any) =>
        !["Reparado", "Não se Aplica", "Descartado"].includes(a.status_reparo)
    );
  };

  const getAvariaSummary = (avarias: any[]) => {
    if (!avarias || avarias.length === 0) return "Sem avarias";
    const active = avarias.filter(
      (a: any) =>
        !["Reparado", "Não se Aplica", "Descartado"].includes(a.status_reparo)
    );
    if (active.length > 0) return `${active.length} Pendente(s)`;
    return "Avarias Resolvidas";
  };

  const getActiveAvariaStatus = (item: any) => {
    if (!item.avarias || !Array.isArray(item.avarias)) return "AVARIA";
    const active = item.avarias.find((a: any) =>
      ["Pendente", "Em Reparo", "Descartado"].includes(a.status_reparo)
    );
    return active ? active.status_reparo : "AVARIA";
  };

  return {
    itens,
    isLoading,
    pagination,
    fetchItens,
    deleteItem,
    associarKit,
    hasActiveAvaria,
    getAvariaSummary,
    getActiveAvariaStatus,
  };
}
