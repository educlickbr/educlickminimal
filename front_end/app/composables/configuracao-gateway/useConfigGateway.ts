import { ref, computed } from "vue"
import { useAppStore } from "~~/stores/app"

export function useConfigGateway(deps: {
  garantirEntidade: () => Promise<string>
  toast: { showToast: (msg: string, opts?: { type?: "success" | "error" }) => void }
}) {
  const store = useAppStore()
  const config = ref<any>(null)
  const isLoading = ref(true)
  const conectando = ref(false)

  async function fetchConfig() {
    isLoading.value = true
    try {
      const id_entidade = await deps.garantirEntidade()
      const res = await $fetch("/api/comercial/config-gateway", {
        params: { id_entidade },
      }) as any
      config.value = res?.data || null
    } catch {
      config.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function conectarStripe() {
    conectando.value = true
    try {
      const id_entidade = await deps.garantirEntidade()
      const res = await $fetch("/api/comercial/stripe-connect", {
        params: { id_entidade },
      }) as any
      if (res?.url) {
        window.location.href = res.url
      } else {
        throw new Error("URL de conexão não gerada")
      }
    } catch (e: any) {
      deps.toast.showToast(e?.message || "Erro ao conectar Stripe", { type: "error" })
      conectando.value = false
    }
  }

  const stripeConectado = computed(() => !!config.value?.stripe_account_id)
  const ambiente = computed(() => config.value?.is_sandbox ? "testes" : "produção")
  const contaId = computed(() => config.value?.stripe_account_id || null)

  return {
    config: computed(() => config.value),
    isLoading: computed(() => isLoading.value),
    conectando: computed(() => conectando.value),
    stripeConectado,
    ambiente,
    contaId,
    fetchConfig,
    conectarStripe,
  }
}
