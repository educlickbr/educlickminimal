/**
 * useFormMatricula
 *
 * Composable que orquestra o fluxo de matrícula acadêmica:
 * - Verifica se o usuário já possui matrícula (GET)
 * - Cria a matrícula (POST)
 * - Fornece feedback via toast e estados reativos
 *
 * Uso:
 *   const { verificando, enviando, matriculaExistente, verificarMatricula, finalizarMatricula } = useFormMatricula()
 */

import { ref } from "vue"

export interface MatriculaData {
  id: string
  id_programa: string
  id_usuario: string
  id_pedido: string | null
  criado_em: string
}

export function useFormMatricula() {
  const verificando = ref(false)
  const enviando = ref(false)
  const matriculaExistente = ref<MatriculaData | null>(null)
  const matriculaCriada = ref<MatriculaData | null>(null)
  const erro = ref<string | null>(null)

  /**
   * Verifica se o usuário já tem matrícula neste programa.
   */
  async function verificarMatricula(params: {
    id_programa: string
    id_entidade: string
  }): Promise<{ existe: boolean; matricula: MatriculaData | null }> {
    verificando.value = true
    erro.value = null

    try {
      const res = (await $fetch("/api/form/matricula", {
        method: "GET",
        params: {
          id_programa: params.id_programa,
          id_entidade: params.id_entidade,
        },
      })) as any

      if (!res.success) {
        erro.value = res.message || "Erro ao verificar matrícula"
        return { existe: false, matricula: null }
      }

      matriculaExistente.value = res.matricula ?? null

      return {
        existe: !!res.matricula,
        matricula: res.matricula ?? null,
      }
    } catch (e: any) {
      erro.value = e?.message || "Erro de conexão ao verificar matrícula"
      console.error("useFormMatricula.verificarMatricula:", e)
      return { existe: false, matricula: null }
    } finally {
      verificando.value = false
    }
  }

  /**
   * Cria a matrícula no banco.
   */
  async function finalizarMatricula(params: {
    id_entidade: string
    id_programa: string
    id_usuario: string
    toast?: {
      showToast: (msg: string, opts?: { duration?: number; type?: "info" | "error" | "success" }) => void
    }
  }): Promise<{
    sucesso: boolean
    matricula: MatriculaData | null
    jaExistia: boolean
  }> {
    enviando.value = true
    erro.value = null

    try {
      const res = (await $fetch("/api/form/matricula", {
        method: "POST",
        body: {
          id_entidade: params.id_entidade,
          id_programa: params.id_programa,
          id_usuario: params.id_usuario,
        },
      })) as any

      if (!res.success) {
        erro.value = res.message || "Erro ao criar matrícula"
        params.toast?.showToast?.(erro.value!, { type: "error" })
        return { sucesso: false, matricula: null, jaExistia: false }
      }

      const matricula = res.matricula as MatriculaData | null
      const jaExistia = !!matriculaExistente.value

      matriculaCriada.value = matricula
      matriculaExistente.value = matricula

      const msg = jaExistia
        ? "Você já estava matriculado neste programa."
        : "Matrícula realizada com sucesso!"

      params.toast?.showToast?.(msg, { type: "success" })

      return { sucesso: true, matricula, jaExistia }
    } catch (e: any) {
      erro.value = e?.message || "Erro de conexão ao finalizar matrícula"
      console.error("useFormMatricula.finalizarMatricula:", e)
      params.toast?.showToast?.(erro.value!, { type: "error" })
      return { sucesso: false, matricula: null, jaExistia: false }
    } finally {
      enviando.value = false
    }
  }

  function reset() {
    matriculaExistente.value = null
    matriculaCriada.value = null
    erro.value = null
    verificando.value = false
    enviando.value = false
  }

  return {
    verificando,
    enviando,
    matriculaExistente,
    matriculaCriada,
    erro,
    verificarMatricula,
    finalizarMatricula,
    reset,
  }
}
