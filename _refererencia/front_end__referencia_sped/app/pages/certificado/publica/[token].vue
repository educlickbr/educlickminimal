<script setup lang="ts">
interface CertificadoPublico {
  id_certificado_emitido: string
  token_publico: string
  token_publico_expira_em: string | null
  aluno_nome: string | null
  aluno_sobrenome: string | null
  nome_curso: string
  cod_curso: string | null
  area_curso: string | null
  modalidade: string | null
  descricao_curso: string | null
  certificado_texto_institucional: string | null
  certificado_nome_coordenador: string | null
  certificado_nome_docente: string | null
  certificado_nome_curador: string | null
  certificado_carga_horaria_exibida: string | null
  qtd_minutos_total: number | null
  cod_turma_contexto: string | null
  ano_semestre_contexto: string | null
  dt_ini_curso_contexto: string | null
  dt_fim_curso_contexto: string | null
  aprovado_em: string | null
  aprovado_por_nome: string | null
}

const route = useRoute()
const token = computed(() => String(route.params.token || ''))

definePageMeta({
  layout: false
})

const { data, pending, error } = await useFetch<{ ok: boolean; certificado: CertificadoPublico | null; message?: string; expired?: boolean; verificacao_expira_em?: string | null }>(
  () => `/api/certificado/publica/${token.value}`,
  { lazy: false }
)

const certificado = computed(() => data.value?.certificado || null)
const verificacaoExpiraEmLabel = computed(() => {
  const rawValue = data.value?.verificacao_expira_em || null
  if (!rawValue) return 'Sem prazo definido'

  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) return 'Não informado'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
})

const verificacaoExpirada = computed(() => !!data.value?.expired)
const errorTitle = computed(() => verificacaoExpirada.value ? 'Verificação expirada' : 'Certificado indisponível')
const errorMessage = computed(() => {
  if (verificacaoExpirada.value) {
    return data.value?.message || 'O prazo de validade desta verificação foi encerrado.'
  }
  return data.value?.message || 'Não foi possível localizar esta validação pública.'
})

const nomeAluno = computed(() => {
  const item = certificado.value
  if (!item) return 'Não informado'
  return `${item.aluno_nome || ''} ${item.aluno_sobrenome || ''}`.trim() || 'Não informado'
})

const normalizarArea = (area?: string | null) => {
  const valor = String(area || '').trim().toLowerCase()
  if (valor === 'regulares') return 'Regulares'
  if (valor === 'extensao' || valor === 'extensão') return 'Extensão'
  if (valor === 'cursos_livres' || valor === 'cursos livres') return 'Cursos Livres'
  if (valor === 'especializacao' || valor === 'especialização') return 'Especialização'
  return area || ''
}

const getAreaLabelPublica = (area?: string | null) => {
  const areaNormalizada = normalizarArea(area)
  if (areaNormalizada === 'Extensão') return 'Extensão Cultural'
  if (areaNormalizada === 'Regulares') return 'Cursos Regulares'
  if (areaNormalizada === 'Cursos Livres') return 'Cursos Livres'
  if (areaNormalizada === 'Especialização') return 'Especialização'
  return areaNormalizada || 'Não informado'
}

const getCoordenacaoArea = (area: string): string => {
  if (area === 'Regulares') return 'Coordenador(a) dos Cursos Regulares'
  if (area === 'Extensão') return 'Coordenador(a) dos Cursos de Extensão Cultural'
  if (area === 'Cursos Livres') return 'Coordenador(a) dos Cursos Livres'
  if (area === 'Especialização') return 'Coordenador(a) dos Cursos de Especialização'
  return 'Coordenador(a) dos Cursos'
}

const campoNaoInformado = 'Não informado'

const getNomeAssinatura = (valor?: string | null, fallback: string = campoNaoInformado) => {
  const texto = String(valor || '').trim()
  return texto || fallback
}

const getAssinaturasByArea = (
  area: string,
  nomes: { coordenador?: string | null; docente?: string | null; curador?: string | null }
) => {
  const linhas = [{ titulo: getCoordenacaoArea(area), nome: getNomeAssinatura(nomes.coordenador) }]

  if (area === 'Cursos Livres' || area === 'Extensão') {
    linhas.push({ titulo: 'Docente', nome: getNomeAssinatura(nomes.docente) })
  }

  if (area === 'Extensão') {
    linhas.push({ titulo: 'Curador(a)', nome: getNomeAssinatura(nomes.curador) })
  }

  return linhas
}

const assinaturasRegistradas = computed(() => {
  const item = certificado.value
  if (!item) return []

  const area = normalizarArea(item.area_curso)
  return getAssinaturasByArea(area, {
    coordenador: item.certificado_nome_coordenador,
    docente: item.certificado_nome_docente,
    curador: item.certificado_nome_curador
  })
})

const formatData = (iso?: string | null, style: 'long' | 'short' = 'long') => {
  if (!iso) return 'Não informado'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: style,
    timeZone: 'America/Sao_Paulo'
  }).format(date)
}

const formatHoras = (minutos?: number | null, cargaHorariaExibida?: string | null) => {
  if (cargaHorariaExibida) return cargaHorariaExibida
  if (!minutos || minutos <= 0) return 'Não informado'
  if (minutos % 60 === 0) return `${minutos / 60}h`
  return `${(minutos / 60).toFixed(1)}h`
}

useHead({
  title: 'Validação de Certificado | SPED Digital',
  htmlAttrs: {
    translate: 'no',
    class: 'notranslate'
  },
  bodyAttrs: {
    class: 'notranslate'
  }
})
</script>

<template>
  <div translate="no" class="notranslate public-page min-h-screen bg-[#f4f6f8] text-[#1a1f2b]">
    <div class="w-full md:max-w-5xl md:mx-auto">
      <div class="bg-white border border-[#d9dee5] shadow-sm overflow-hidden">
        <div class="border-b border-[#d9dee5] bg-primary text-white px-2 py-4 md:px-8 md:py-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-start gap-3">
              <img src="/logosp_sem_fundo.png" alt="Logo da escola" class="w-14 h-14 object-contain" />
              <div>
                <p class="text-xs uppercase tracking-[0.2em] opacity-70">São Paulo Escola de Dança</p>
                <h1 class="text-2xl md:text-3xl font-black mt-1">Validação de Certificado</h1>
                <p class="text-sm opacity-80 mt-2">Esta é a validação digital oficial do certificado emitido pela instituição.</p>
              </div>
            </div>
            <div class="bg-white/10 border border-white/20 px-3 py-2 text-xs min-w-[180px]">
              <p class="uppercase tracking-wider opacity-80">Expira Em</p>
              <p class="font-bold mt-1">{{ verificacaoExpiraEmLabel }}</p>
            </div>
          </div>
        </div>

        <div v-if="pending" class="p-10 text-center">
          <svg class="animate-spin h-8 w-8 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p class="text-sm text-[#4b5563]">Carregando certificado público...</p>
        </div>

        <div v-else-if="error || !certificado" class="p-10">
          <div class="border border-red-200 bg-red-50 rounded-lg p-5">
            <h2 class="font-bold text-red-700">{{ errorTitle }}</h2>
            <p class="text-sm text-red-600 mt-2">{{ errorMessage }}</p>
            <p v-if="data?.verificacao_expira_em" class="text-xs text-red-500 mt-3">Última expiração registrada: {{ verificacaoExpiraEmLabel }}</p>
          </div>
        </div>

        <div v-else class="px-2 py-4 md:px-8 md:py-6 space-y-6">
          <div v-if="verificacaoExpirada" class="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-900">
            <p class="font-bold uppercase tracking-[0.15em] text-amber-700">Prazo de Verificação Encerrado</p>
            <p class="mt-2">
              O documento continua disponível para consulta, porém o prazo recomendado de verificação foi encerrado em {{ verificacaoExpiraEmLabel }}.
            </p>
          </div>

          <div class="border border-emerald-200 bg-emerald-50 rounded-lg p-4 text-sm text-emerald-900">
            <p class="font-bold uppercase tracking-[0.15em] text-emerald-700">Validação Institucional</p>
            <p class="mt-2">
              Esta é a validação digital do certificado. Os dados abaixo correspondem ao documento emitido e homologado pela SP Escola de Dança.
            </p>
          </div>

          <div class="border border-[#d9dee5] p-4 rounded-lg bg-[#f8fafc]">
            <p class="text-xs uppercase tracking-[0.15em] text-primary font-bold">Dados do Certificado</p>
            <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span class="font-semibold">Aluno:</span> {{ nomeAluno }}</p>
              <p><span class="font-semibold">Curso:</span> {{ certificado.nome_curso }}</p>
              <p><span class="font-semibold">Código do curso:</span> {{ certificado.cod_curso || 'Não informado' }}</p>
              <p><span class="font-semibold">Área:</span> {{ getAreaLabelPublica(certificado.area_curso) }}</p>
              <p><span class="font-semibold">Modalidade:</span> {{ certificado.modalidade || 'Não informado' }}</p>
              <p><span class="font-semibold">Turma:</span> {{ certificado.cod_turma_contexto || 'Não informado' }}</p>
              <p><span class="font-semibold">Ano/Semestre:</span> {{ certificado.ano_semestre_contexto || 'Não informado' }}</p>
              <p><span class="font-semibold">Carga horária:</span> {{ formatHoras(certificado.qtd_minutos_total, certificado.certificado_carga_horaria_exibida) }}</p>
              <p><span class="font-semibold">Período inicial:</span> {{ formatData(certificado.dt_ini_curso_contexto) }}</p>
              <p><span class="font-semibold">Período final:</span> {{ formatData(certificado.dt_fim_curso_contexto) }}</p>
              <p><span class="font-semibold">Aprovado em:</span> {{ formatData(certificado.aprovado_em, 'short') }}</p>
              <p><span class="font-semibold">Aprovado por:</span> {{ certificado.aprovado_por_nome || 'Não informado' }}</p>
              <div class="md:col-span-2 border border-[#d9dee5] rounded-lg bg-white p-3">
                <p class="text-xs uppercase tracking-[0.12em] text-primary font-bold">Assinaturas Registradas</p>
                <div class="mt-2 space-y-1.5">
                  <p v-for="assinatura in assinaturasRegistradas" :key="assinatura.titulo">
                    <span class="font-semibold">{{ assinatura.titulo }}:</span> {{ assinatura.nome }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="border border-[#d9dee5] p-4 rounded-lg bg-white">
            <p class="text-xs uppercase tracking-[0.15em] text-primary font-bold">Descrição Registrada</p>
            <div class="mt-3 text-sm leading-7 text-[#334155] whitespace-pre-wrap">
              {{ certificado.descricao_curso || 'Sem descrição cadastrada.' }}
            </div>
          </div>

          <div class="border border-[#d9dee5] p-4 rounded-lg bg-white text-sm text-[#334155]">
            <p class="text-xs uppercase tracking-[0.15em] text-primary font-bold">Autoridades Responsáveis</p>
            <div class="mt-3 space-y-2">
              <p class="font-semibold text-[#1f2937]">Inês Bogéa <span class="font-normal text-[#334155]">(Diretora Artística e Educacional)</span></p>
              <p class="font-semibold text-[#1f2937]">José Simões <span class="font-normal text-[#334155]">(Superintendente Educacional)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>