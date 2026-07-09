import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "~~/stores/app";

export function useCheckout(slug: string) {
  const store = useAppStore();
  const user = useSupabaseUser();
  const route = useRoute();
  const oferta = ref<any>(null);
  const isLoading = ref(true);
  const pedidoStatus = ref<string | null>(null);
  const pedidoId = ref<string | null>(null);
  const erro = ref<string | null>(null);
  const processando = ref(false);

  const isLogado = computed(() => !!user.value?.id);

  async function fetchOferta() {
    isLoading.value = true;
    erro.value = null;
    try {
      const id_oferta = route.query.id_oferta as string | undefined;

      let res: any;

      if (id_oferta) {
        // Busca por UUID (seguro, independente de slug + entidade)
        res = await $fetch("/api/public/ofertas/uuid", {
          params: { id_oferta },
        });
      } else {
        // Fallback: busca por slug + entidade
        const id_entidade =
          store.entidades?.find(
            (e: any) =>
              Array.isArray(e.produtos) &&
              e.produtos.some((p: any) => p.slug === "academico"),
          )?.id ||
          store.entidades?.[0]?.id ||
          (store as any).company?.id;

        const params = id_entidade ? { id_entidade } : {};
        res = await $fetch(`/api/public/ofertas/${slug}`, { params });
      }

      if (res?.success && res.oferta) {
        oferta.value = res.oferta;
      } else {
        erro.value = res?.message || "Oferta não encontrada";
      }
    } catch (e: any) {
      erro.value = e?.message || "Erro ao carregar oferta";
    } finally {
      isLoading.value = false;
    }
  }

  async function confirmarMatricula() {
    if (!oferta.value || !user.value) return;
    processando.value = true;
    erro.value = null;
    try {
      const res = (await $fetch("/api/comercial/checkout/criar", {
        method: "POST",
        body: { id_oferta: oferta.value.id },
      })) as any;
      if (res?.success) {
        if (res.redirect) {
          window.location.href = res.redirect;
          return;
        }
        pedidoStatus.value = res.status;
        pedidoId.value = res.id;
      } else {
        erro.value = res?.message || "Erro ao criar pedido";
      }
    } catch (e: any) {
      erro.value = e?.message || "Erro ao processar matrícula";
    } finally {
      processando.value = false;
    }
  }

  const isGratuito = computed(() => oferta.value?.valor_centavos === 0);
  const valorFormatado = computed(() => {
    if (!oferta.value) return "";
    const v = oferta.value.valor_centavos;
    if (v <= 0) return "Grátis";
    return `R$ ${(v / 100).toFixed(2).replace(".", ",")}`;
  });

  return {
    oferta: computed(() => oferta.value),
    isLoading: computed(() => isLoading.value),
    pedidoStatus: computed(() => pedidoStatus.value),
    pedidoId: computed(() => pedidoId.value),
    erro: computed(() => erro.value),
    processando: computed(() => processando.value),
    isGratuito,
    isLogado,
    valorFormatado,
    fetchOferta,
    confirmarMatricula,
  };
}
