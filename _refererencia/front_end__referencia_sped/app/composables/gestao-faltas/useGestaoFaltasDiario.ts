import { $fetch as ofetch } from "ofetch"
import { useAppStore } from "~/stores/app"

export function useGestaoFaltasDiario() {
  const store = useAppStore()

  // State
  const minhasTurmas = ref<any[]>([])
  const loadingTurmas = ref(false)
  const loadingDiario = ref(false)
  const diarioData = ref<any>(null)
  const errorDiario = ref<string | null>(null)
  const selectedMatriculaId = ref<string | null>(null)

  // Computed
  const gridStyle = computed(() => {
    const periodos = diarioData.value?.qtd_periodos || 1
    return {
      display: "grid",
      gridTemplateColumns: `minmax(100px, 1.5fr) repeat(${periodos}, 1fr)`,
    }
  })

  // Pure functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "--"
    if (dateString.length === 10 && dateString.indexOf("-") === 4) {
      const [year, month, day] = dateString.split("-")
      return `${day}/${month}/${year}`
    }
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-500/10 text-gray-500"
    const s = status.toLowerCase()
    if (s === "presente" || s === "p")
      return "bg-green-500/10 text-green-500 border-green-500/20"
    if (s === "falta" || s === "f")
      return "bg-red-500/10 text-red-500 border-red-500/20"
    if (s === "abonada" || s === "abono" || s === "a")
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    if (s === "justificada" || s === "j")
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  const getStatusLabel = (status: string) => {
    if (!status) return "-"
    const s = status.toLowerCase()
    if (s === "presente" || s === "p") return "P"
    if (s === "falta" || s === "f") return "F"
    if (s === "abonada" || s === "abono" || s === "a") return "A"
    if (s === "justificada" || s === "j") return "J"
    return status.charAt(0).toUpperCase()
  }

  // Actions
  const fetchMinhasTurmas = async () => {
    if (!store.user_expandido_id) return
    loadingTurmas.value = true
    try {
      const data = await ofetch("/api/matriculas/minhas-turmas", {
        params: { id_user_expandido: store.user_expandido_id },
      })
      minhasTurmas.value = data || []
    } catch (e) {
      console.error("Erro ao buscar turmas:", e)
    } finally {
      loadingTurmas.value = false
    }
  }

  const fetchDiario = async (idMatricula: string) => {
    if (!store.user_expandido_id) return

    loadingDiario.value = true
    errorDiario.value = null
    diarioData.value = null

    try {
      const data = await ofetch("/api/matriculas/faltas", {
        params: {
          id_matricula: idMatricula,
          id_aluno: null,
          id_turma: null,
        },
      })
      diarioData.value = data
    } catch (e: any) {
      console.error("Erro ao buscar diário:", e)
      errorDiario.value = e.message || "Erro ao carregar dados do diário."
    } finally {
      loadingDiario.value = false
    }
  }

  return {
    // State
    minhasTurmas,
    loadingTurmas,
    loadingDiario,
    diarioData,
    errorDiario,
    selectedMatriculaId,
    // Computed
    gridStyle,
    // Pure functions
    formatDate,
    getStatusColor,
    getStatusLabel,
    // Actions
    fetchMinhasTurmas,
    fetchDiario,
  }
}
