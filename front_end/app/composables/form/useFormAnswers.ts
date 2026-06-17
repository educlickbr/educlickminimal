/**
 * useFormAnswers
 *
 * Composable reutilizável para qualquer formulário de perguntas/respostas.
 * Gerencia o estado das respostas, salvamento individual e carregamento.
 *
 * Dependências injetadas:
 * - idEntidade, userExpandidoId → para chamadas de API
 * - onAnswersLoaded → callback chamado após loadUserAnswers (ex: unlock CEP)
 */

import { ref } from "vue"
import { $fetch } from "ofetch"

const BRAZIL_TIME_ZONE = "America/Sao_Paulo"

function formatTime(dateStr: string) {
  if (!dateStr) return ""

  if (/^\d{2}:\d{2}$/.test(dateStr)) {
    return dateStr
  }

  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) {
    return dateStr
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
}

export function isDateQuestion(tipo?: string) {
  return tipo === "data" || tipo === "date"
}

export function normalizeDateAnswer(value: unknown) {
  if (typeof value !== "string") return value

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.split("T")[0]
  }

  const brDateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brDateMatch) {
    const [, day, month, year] = brDateMatch
    return `${year}-${month}-${day}`
  }

  return value
}

export function useFormAnswers(deps: {
  idEntidade: () => string
  userExpandidoId: () => string | null
  onAnswersLoaded?: () => void
}) {
  const answers = ref<Record<string, any>>({})
  const saveStatus = ref<Record<string, string>>({})

  async function saveAnswer(perguntaId: string, tipo_pergunta?: string) {
    const value = answers.value[perguntaId]
    if (value === undefined || value === "") return

    if (tipo_pergunta === "cep" && String(value).replace(/\D/g, "").length !== 8) {
      saveStatus.value[perguntaId] = "CEP inválido"
      return
    }

    saveStatus.value[perguntaId] = "Salvando..."

    try {
      const res = (await $fetch("/api/form/save", {
        method: "POST",
        body: {
          id_entidade: deps.idEntidade(),
          id_user_expandido: deps.userExpandidoId(),
          id_pergunta: perguntaId,
          resposta: value,
        },
      })) as any

      if (res.success) {
        saveStatus.value[perguntaId] = `Salvo às ${formatTime(res.salvo_em)}`
      } else {
        saveStatus.value[perguntaId] = "Erro ao salvar"
        console.error("Erro detalhado do backend:", res)
      }
    } catch (e) {
      saveStatus.value[perguntaId] = "Erro de conexão"
      console.error("Erro de conexão:", e)
    }
  }

  async function saveMultipleAnswers(perguntaIds: string[]) {
    await Promise.all(perguntaIds.map((perguntaId) => saveAnswer(perguntaId)))
  }

  async function loadUserAnswers(perguntaIds: string[], blocos: any[]) {
    try {
      const respRes = (await $fetch("/api/form/respostas", {
        params: {
          user_expandido_id: deps.userExpandidoId(),
          pergunta_ids: perguntaIds,
        },
      })) as any

      if (!respRes.success) return

      const perguntaMap = new Map<string, any>(
        blocos.flatMap((b) =>
          b.perguntas.map((p: any) => [p.pergunta_id, p])
        )
      )

      const loadedAnswers: Record<string, any> = {}

      Object.keys(respRes.respostas).forEach((id) => {
        const pergunta = perguntaMap.get(id)
        const tipoPergunta = pergunta?.tipo_pergunta ?? ""
        const resposta = respRes.respostas[id].resposta

        if (isDateQuestion(tipoPergunta)) {
          loadedAnswers[id] = normalizeDateAnswer(resposta)
        } else {
          loadedAnswers[id] = resposta
        }

        saveStatus.value[id] = `Carregado (${formatTime(respRes.respostas[id].modificado_em)})`
      })

      answers.value = {
        ...answers.value,
        ...loadedAnswers,
      }

      deps.onAnswersLoaded?.()
    } catch (e) {
      console.error("Erro ao carregar respostas:", e)
    }
  }

  return {
    answers,
    saveStatus,
    saveAnswer,
    saveMultipleAnswers,
    loadUserAnswers,
    formatTime,
  }
}
