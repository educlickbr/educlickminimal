import { ref } from "vue"
import { $fetch as ofetch } from "ofetch"
import { useToast } from "../../../composables/useToast"

export function useBolsasInscricoes() {
  const { showToast } = useToast()
  const isLoading = ref(false)
  const editais = ref<any[]>([])
  const expandedEditalId = ref<string | null>(null)

  const fetchEditais = async () => {
    isLoading.value = true
    try {
      const data = await ofetch<any[]>("/api/bolsas/editais", {
        params: { public_view: true },
      })
      editais.value = data || []
    } catch (e: any) {
      console.error(e)
      showToast("Erro ao carregar editais.", { type: "error" })
    } finally {
      isLoading.value = false
    }
  }

  const toggleExpand = (id: string) => {
    expandedEditalId.value = expandedEditalId.value === id ? null : id
  }

  const getSortedEtapas = (edital: any) => {
    if (!edital.etapas) return []
    return [...edital.etapas].sort(
      (a: any, b: any) => (a.ordem || 0) - (b.ordem || 0),
    )
  }

  const getEtapaStatus = (etapa: any) => {
    const now = new Date()
    const start = new Date(etapa.data_inicio)
    const end = new Date(etapa.data_fim)

    if (now < start)
      return {
        label: "Em Breve",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
      }
    if (now > end)
      return {
        label: "Encerrado",
        color: "text-red-400",
        bg: "bg-red-400/10",
      }
    return { label: "Aberto", color: "text-green-400", bg: "bg-green-400/10" }
  }

  const downloadFile = async (item: any) => {
    if (!item.arquivo_url) {
      showToast("Nenhum arquivo anexado.", { type: "info" })
      return
    }

    try {
      const { hash_base, error } = await ofetch<any>(
        "/api/refresh-hash-editais",
      )

      if (error || !hash_base) {
        throw new Error(error || "Falha ao gerar token de acesso.")
      }

      let finalUrl = ""
      const fileName = item.arquivo_url.split("/").pop()

      if (hash_base.includes("?")) {
        const [baseUrl, queryParams] = hash_base.split("?")
        const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
        finalUrl = `${cleanBase}${fileName}?${queryParams}`
      } else {
        finalUrl = `${hash_base}${fileName}`
      }

      window.open(finalUrl, "_blank")
    } catch (e: any) {
      console.error(e)
      showToast("Erro ao abrir arquivo.", { type: "error" })
    }
  }

  return {
    editais,
    isLoading,
    expandedEditalId,
    fetchEditais,
    toggleExpand,
    getSortedEtapas,
    getEtapaStatus,
    downloadFile,
  }
}
