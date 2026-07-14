import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useEstoqueProdutos() {
  const produtos = ref<any[]>([]);
  const isLoading = ref(false);
  const pagination = ref({ pagina_atual: 1, qtd_paginas: 1, qtd_itens: 0 });

  const categorias = ref<any[]>([]);
  const unidades = ref<any[]>([]);
  const tipos = ref<any[]>([]);

  const fetchProdutos = async (page: number = 1, busca?: string) => {
    isLoading.value = true;
    try {
      const data = await ofetch("/api/producao/estoque/produtos", {
        params: {
          page,
          limit: 12,
          busca: busca || undefined,
        },
      });

      if (data) {
        produtos.value = (data.itens || []).map((p: any) => ({
          ...p,
          quantidade_a_adicionar: 0,
        }));

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

  const loadAuxiliaries = async () => {
    if (categorias.value.length > 0) return;

    isLoading.value = true;
    try {
      const [cats, units, types] = await Promise.all([
        ofetch("/api/producao/estoque/categorias"),
        ofetch("/api/producao/estoque/unidades"),
        ofetch("/api/producao/estoque/tipos"),
      ]);
      categorias.value = cats || [];
      unidades.value = units || [];
      tipos.value = types || [];
    } finally {
      isLoading.value = false;
    }
  };

  const addStock = async (id_produto: string, quantidade: number, valor_inicial?: number) => {
    await ofetch("/api/producao/estoque/adicionar-lote", {
      method: "POST",
      body: { id_produto, quantidade, valor_inicial },
    });
  };

  const saveProduto = async (formData: any, editingId: string | null) => {
    if (editingId) {
      const data: any = await ofetch("/api/producao/estoque/produto", {
        method: "PUT",
        body: {
          id: editingId,
          nome: formData.nome,
          id_categoria_produto: formData.id_categoria,
          id_tipo_produto: formData.id_tipo,
          id_unidade: formData.id_unidade,
          treshold: formData.treshold,
          valor_inicial: formData.valor_inicial,
          codigo_barras: formData.codigo_barras,
          observacoes: formData.observacoes,
        },
      });
      if (!data.success) throw new Error(data.message);
      return data;
    } else {
      const data: any = await ofetch("/api/producao/estoque/produto", {
        method: "POST",
        body: formData,
      });
      if (!data.success) throw new Error(data.message);
      return data;
    }
  };

  const deleteProduto = async (id: string) => {
    await ofetch("/api/producao/estoque/produto", {
      method: "DELETE",
      body: { id },
    });
  };

  return {
    produtos,
    isLoading,
    pagination,
    categorias,
    unidades,
    tipos,
    fetchProdutos,
    loadAuxiliaries,
    addStock,
    saveProduto,
    deleteProduto,
  };
}
