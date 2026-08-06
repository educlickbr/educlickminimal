import { ref, computed } from 'vue'
import { getAnoSemestreAtual, getAnoSemestreList } from '~/utils/anoSemestre'

export function useAtribuicao(idEntidade: () => string) {
  // ── Estado ──────────────────────────────────────────────
  const loading = ref(false)
  const programas = ref<any[]>([])
  const programaSelecionado = ref<string | null>(null)
  const ciclos = ref<any[]>([])
  const docentes = ref<any[]>([])
  const vinculos = ref<any[]>([]) // { id_docente, id_componente, elegivel } — carregado ao selecionar programa
  const anoSemestreSelecionado = ref<string>(getAnoSemestreAtual())
  const anoSemestres = ref<{ id: string; nome: string }[]>(getAnoSemestreList(4) || [])

  // ── Loading states ──────────────────────────────────────
  const loadingProgramas = ref(false)
  const loadingCiclos = ref(false)
  const savingId = ref<string | null>(null)

  // ── Fetch dados iniciais ───────────────────────────────
  async function fetchDadosIniciais() {
    loadingProgramas.value = true
    loading.value = true
    try {
      const params: Record<string, string> = { id_entidade: idEntidade() }
      if (anoSemestreSelecionado.value) {
        params.ano_semestre = anoSemestreSelecionado.value
      }

      const res = (await $fetch('/api/atribuicao', { params })) as any

      if (res?.success) {
        programas.value = res.programas || []
        docentes.value = res.docentes || []

        // Se o programa selecionado sumiu da lista, limpa
        if (programaSelecionado.value && !programas.value.some((p: any) => p.id === programaSelecionado.value)) {
          programaSelecionado.value = null
        }

        // Auto-select: se só tem 1, seleciona. Se tem vários e nenhum, seleciona o 1º
        if (programas.value.length === 1) {
          programaSelecionado.value = programas.value[0].id
        } else if (programas.value.length > 0 && !programaSelecionado.value) {
          programaSelecionado.value = programas.value[0].id
        }
      } else {
        programas.value = []
        programaSelecionado.value = null
      }
    } catch (e) {
      console.error('Erro ao carregar dados iniciais:', e)
    } finally {
      loadingProgramas.value = false
      loading.value = false
    }
  }

  // ── Filtrar docentes elegíveis para um componente ────────
  function getDocentesElegiveis(idComponente: string | null): any[] {
    if (!idComponente) return docentes.value

    // Docentes que têm vínculo elegível com este componente
    const docentesComVinculo = vinculos.value
      .filter((v: any) => v.id_componente === idComponente && v.elegivel)
      .map((v: any) => v.id_docente)

    // Se não há vínculos definidos para este componente,
    // mostra todos os docentes (fallback)
    if (docentesComVinculo.length === 0) return docentes.value

    return docentes.value.filter((d: any) => docentesComVinculo.includes(d.id))
  }

  // ── Fetch módulos/componentes do programa ──────────────
  async function fetchCiclos() {
    if (!programaSelecionado.value) {
      ciclos.value = []
      vinculos.value = []
      return
    }

    loadingCiclos.value = true
    try {
      const res = (await $fetch('/api/atribuicao/programa', {
        params: {
          id_programa: programaSelecionado.value,
          id_entidade: idEntidade(),
        },
      })) as any

      if (res?.success) {
        ciclos.value = res.itens || []
        vinculos.value = res.vinculos || []
      }
    } catch (e) {
      console.error('Erro ao carregar ciclos:', e)
    } finally {
      loadingCiclos.value = false
    }
  }

  // ── Atribuir docente ──────────────────────────────────────
  async function atribuirDocente(
    idCiclo: string,
    idModuloComponente: string,
    idDocente: string,
    tipo: string = 'titular',
  ): Promise<boolean> {
    savingId.value = `${idCiclo}-${idModuloComponente}`
    try {
      const res = (await $fetch('/api/atribuicao', {
        method: 'POST',
        body: {
          id_ciclo: idCiclo,
          id_modulo_componente: idModuloComponente,
          id_docente: idDocente,
          tipo,
        },
      })) as any

      if (res?.success) {
        // Atualiza o estado local
        const ciclo = ciclos.value.find((c: any) => c.id_ciclo === idCiclo)
        if (ciclo) {
          const comp = ciclo.componentes?.find(
            (c: any) => c.id_modulo_componente === idModuloComponente,
          )
          if (comp) {
            const existente = comp.docentes?.find(
              (d: any) => d.id_docente === idDocente,
            )
            if (existente) {
              existente.tipo = tipo
            } else {
              const docente = docentes.value.find((d: any) => d.id === idDocente)
              comp.docentes = [
                ...(comp.docentes || []),
                {
                  id_atribuicao: res.id,
                  id_docente: idDocente,
                  docente_nome: docente?.nome || docente?.nome_completo || '—',
                  docente_email: docente?.email || '',
                  tipo,
                },
              ]
            }
          }
        }
        return true
      }
      return false
    } catch (e) {
      console.error('Erro ao atribuir docente:', e)
      return false
    } finally {
      savingId.value = null
    }
  }

  // ── Remover atribuição ────────────────────────────────────
  async function removerAtribuicao(idAtribuicao: string): Promise<boolean> {
    try {
      const res = (await $fetch('/api/atribuicao', {
        method: 'DELETE',
        params: { id: idAtribuicao },
      })) as any

      if (res?.success) {
        for (const ciclo of ciclos.value) {
          for (const comp of ciclo.componentes || []) {
            comp.docentes = (comp.docentes || []).filter(
              (d: any) => d.id_atribuicao !== idAtribuicao,
            )
          }
        }
        return true
      }
      return false
    } catch (e) {
      console.error('Erro ao remover atribuição:', e)
      return false
    }
  }

  // ── Watchers ──────────────────────────────────────────────
  watch(programaSelecionado, () => {
    fetchCiclos()
  })

  // ── Computed helpers ──────────────────────────────────────
  const totalAtribuicoes = computed(() => {
    let count = 0
    for (const ciclo of ciclos.value) {
      for (const comp of ciclo.componentes || []) {
        count += comp.docentes?.length || 0
      }
    }
    return count
  })

  const temAtribuicoes = computed(() => totalAtribuicoes.value > 0)

  return {
    // Estado
    loading,
    programas,
    programaSelecionado,
    ciclos,
    docentes,
    vinculos,
    anoSemestreSelecionado,
    anoSemestres,
    loadingProgramas,
    loadingCiclos,
    savingId,
    // Métodos
    fetchDadosIniciais,
    fetchCiclos,
    atribuirDocente,
    removerAtribuicao,
    getDocentesElegiveis,
    // Computed
    totalAtribuicoes,
    temAtribuicoes,
  }
}

export type UseAtribuicaoReturn = ReturnType<typeof useAtribuicao>
