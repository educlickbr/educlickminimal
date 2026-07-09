import { ref, reactive, computed } from "vue";

export function useProdutosCore(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (
      msg: string,
      opts?: { type?: "info" | "error" | "success" },
    ) => void;
  };
}) {
  const programas = ref<any[]>([]);
  const isLoadingProgramas = ref(false);

  const carregandoProdutos = reactive<Record<string, boolean>>({});
  const produtosPorPrograma = reactive<Record<string, any[]>>({});

  const carregandoOfertas = reactive<Record<string, boolean>>({});
  const ofertasPorProduto = reactive<Record<string, any[]>>({});

  async function fetchProgramas() {
    isLoadingProgramas.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programas", {
        params: { id_entidade, page: 1, limit: 100 },
      })) as any;
      programas.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar programas", {
        type: "error",
      });
    } finally {
      isLoadingProgramas.value = false;
    }
  }

  async function fetchProdutosPorPrograma(programaId: string) {
    if (produtosPorPrograma[programaId] !== undefined) return;

    carregandoProdutos[programaId] = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/comercial/produtos", {
        params: { id_entidade, page: 1, limit: 100, id_programa: programaId },
      })) as any;
      produtosPorPrograma[programaId] = Array.isArray(res?.itens)
        ? res.itens
        : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar produtos", {
        type: "error",
      });
      produtosPorPrograma[programaId] = [];
    } finally {
      carregandoProdutos[programaId] = false;
    }
  }

  async function fetchOfertasPorProduto(produtoId: string) {
    if (ofertasPorProduto[produtoId] !== undefined) return;

    carregandoOfertas[produtoId] = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/comercial/ofertas", {
        params: { id_entidade, id_produto: produtoId, page: 1, limit: 50 },
      })) as any;
      ofertasPorProduto[produtoId] = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao carregar ofertas", {
        type: "error",
      });
      ofertasPorProduto[produtoId] = [];
    } finally {
      carregandoOfertas[produtoId] = false;
    }
  }

  /** Atualiza oferta localmente sem refetch — reativo por ser reactive + computado */
  function upsertOfertaLocal(produtoId: string, ofertaData: any) {
    const arr = ofertasPorProduto[produtoId];
    if (arr) {
      const idx = arr.findIndex((o: any) => o.id === ofertaData.id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...ofertaData };
      } else {
        arr.push(ofertaData);
      }
    }
  }

  const programasComProdutos = computed(() => {
    return programas.value.map((prog: any) => ({
      ...prog,
      produtos: produtosPorPrograma[prog.id] ?? null,
      carregando: carregandoProdutos[prog.id] ?? false,
    }));
  });

  return {
    programas: computed(() => programas.value),
    isLoadingProgramas: computed(() => isLoadingProgramas.value),
    programasComProdutos: computed(() => programasComProdutos.value),
    carregandoOfertas: computed(() => ({ ...carregandoOfertas })),
    ofertasPorProduto: computed(() => ({ ...ofertasPorProduto })),
    fetchProgramas,
    fetchProdutosPorPrograma,
    fetchOfertasPorProduto,
    upsertOfertaLocal,
  };
}
