import { $fetch as ofetch } from "ofetch"
import { useAppStore } from "~/stores/app"

export function useGestaoFaltasJustificativas() {
  const store = useAppStore()

  // State
  const justificativasData = ref<any[]>([])
  const loadingJustificativas = ref(false)

  // Computed
  const justificativasList = computed(() =>
    justificativasData.value.filter((j) => j.escopo === "justificativa"),
  )
  const atestadosList = computed(() =>
    justificativasData.value.filter((j) => j.escopo === "atestado"),
  )

  // Pure functions
  const getStatusBadge = (status: string) => {
    const normalized = (status || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

    if (normalized === "aprovado")
      return "bg-green-500/10 text-green-500 border-green-500/20"
    if (normalized === "reprovado")
      return "bg-red-500/10 text-red-500 border-red-500/20"
    if (normalized === "em analise" || normalized === "em_analise")
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "--"
    if (dateString.length === 10 && dateString.indexOf("-") === 4) {
      const [year, month, day] = dateString.split("-")
      return `${day}/${month}/${year}`
    }
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  // Actions
  const fetchJustificativas = async () => {
    if (!store.user_expandido_id) return
    loadingJustificativas.value = true
    try {
      const data = await ofetch("/api/matriculas/justificativas/minhas", {
        params: { id_user_expandido: store.user_expandido_id },
      })
      justificativasData.value = data || []
    } catch (e) {
      console.error("Erro ao buscar justificativas", e)
    } finally {
      loadingJustificativas.value = false
    }
  }

  const deleteJustificativa = async (id: string, status?: string) => {
    if (status && status !== "Aguardando") {
      alert("A solicitação só pode ser cancelada quando estiver em Aguardando.")
      return
    }

    if (!confirm("Tem certeza que deseja cancelar esta solicitação?")) return
    try {
      await ofetch(`/api/matriculas/justificativas/${id}`, {
        method: "DELETE",
      })
      fetchJustificativas() // Refresh list
    } catch (e: any) {
      alert(e?.data?.statusMessage || "Erro ao cancelar solicitação.")
      console.error(e)
    }
  }

  const openAttachment = async (path: string) => {
    if (!path) return

    const cleanPath = path.replace(/^secretaria\//, "").replace(/^\//, "")

    try {
      const data = await ofetch("/api/refresh-hash-secretaria")
      const hash_base = data?.hash_base || null
      if (!hash_base) {
        alert("Erro ao gerar link de acesso ao arquivo.")
        return
      }

      const finalUrl = `${hash_base}${cleanPath}`
      window.open(finalUrl, "_blank")
    } catch (e) {
      console.error("Erro ao abrir arquivo:", e)
      alert("Erro ao abrir o arquivo.")
    }
  }

  return {
    // State
    justificativasData,
    loadingJustificativas,
    // Computed
    justificativasList,
    atestadosList,
    // Pure functions
    getStatusBadge,
    formatDate,
    // Actions
    fetchJustificativas,
    deleteJustificativa,
    openAttachment,
  }
}
