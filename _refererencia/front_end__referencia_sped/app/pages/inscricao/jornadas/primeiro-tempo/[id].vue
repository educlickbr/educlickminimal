<script setup lang="ts">
import { formatDate } from '@/utils/date'
import { fileToBase64, generateUuidFileName, validateFile } from '../../../../../utils/file'
import { useToast } from '../../../../../composables/useToast'

definePageMeta({
  title: 'Inscrição - Jornada Paulista (Primeiro Tempo)'
})

const route = useRoute()
const { showToast } = useToast()

const editalId = route.params.id as string

type FormTab =
  | 'dados_pessoais'
  | 'endereco'
  | 'perfil_artistico'
  | 'trajetoria'
  | 'atividades'
  | 'documentos'
  | 'declaracoes'

const tabs: Array<{ key: FormTab; label: string }> = [
  { key: 'dados_pessoais', label: 'Dados Pessoais' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'perfil_artistico', label: 'Perfil Artístico' },
  { key: 'trajetoria', label: 'Trajetória' },
  { key: 'atividades', label: 'Atividades' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'declaracoes', label: 'Declarações' },
]

const activeTab = ref<FormTab>('dados_pessoais')

interface Pergunta {
  id: string
  slug: string
  label: string
  tipo: string
  bloco: string
  ordem: number
  obrigatorio: boolean
  opcoes: any
}

interface OpcaoPergunta {
  id: string
  label: string
  ordem: number
}

interface PerguntaAtividade {
  id: string
  pergunta: string
  tipo_resposta: 'texto_curto' | 'texto_longo' | 'sim_nao' | 'multipla_escolha'
  obrigatoria: boolean
  ordem: number
  resposta_texto?: string | null
  opcoes?: OpcaoPergunta[]
}

interface AtividadeComPerguntas {
  id: string
  atividade_nome: string
  descricao: string | null
  ordem: number
  perguntas: PerguntaAtividade[]
}

type FieldState = 'idle' | 'saving' | 'saved' | 'error'

const edital = ref<any>(null)
const loadingPage = ref(true)
const loadingBloco = ref(false)
const loadingCep = ref(false)
const idCandidatura = ref<string | null>(null)
const idGrupo = ref<string | null>(null)
const idJornada = ref<string | null>(null)
const nomeGrupo = ref<string | null>(null)

const perguntasByBloco = ref<Record<string, Pergunta[]>>({})
const loadedBlocos = ref<Set<string>>(new Set())
const formData = ref<Record<string, string>>({})
const fieldState = ref<Record<string, FieldState>>({})
const lockedAddressFields = ref<Set<string>>(new Set())
const uploadingFiles = ref<Set<string>>(new Set())
const uploadedFiles = ref<Record<string, { fileName: string; originalName: string }>>({})
const atividadesComPerguntas = ref<AtividadeComPerguntas[]>([])
const loadingAtividadesPerguntas = ref(false)
const atividadesPerguntasLoaded = ref(false)
const respostasAtividade = ref<Record<string, string>>({})
const estadoPerguntaAtividade = ref<Record<string, FieldState>>({})
const finalizando = ref(false)

const currentPerguntas = computed<Pergunta[]>(() => perguntasByBloco.value[activeTab.value] || [])

const READONLY_SLUGS = new Set(['pt_nome', 'pt_sobrenome', 'pt_email', 'pt_idade'])

const isReadonlySlug = (slug: string): boolean => READONLY_SLUGS.has(slug)
const lastTabKey: FormTab = tabs[tabs.length - 1]!.key

const getInputType = (tipo: string): string => {
  const map: Record<string, string> = {
    email: 'email',
    telefone: 'tel',
    numero: 'number',
    data: 'date',
    link: 'url',
  }
  return map[tipo] || 'text'
}

const calculateAgeFromDate = (dateValue: string): string => {
  if (!dateValue) return ''

  const birthDate = new Date(dateValue)
  if (Number.isNaN(birthDate.getTime())) return ''

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  if (age < 0) return ''
  return String(age)
}

const formatCEP = (value: string): string => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

const getFieldState = (slug: string): FieldState => fieldState.value[slug] || 'idle'

const getInputStateClass = (slug: string): string => {
  const state = getFieldState(slug)
  if (state === 'saving') return 'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse'
  if (state === 'saved') return 'border-green-500/40 focus:ring-2 focus:ring-green-500/20'
  if (state === 'error') return 'border-red-500/40 focus:ring-2 focus:ring-red-500/20'
  return 'border-secondary/10 focus:ring-2 focus:ring-primary/20'
}

const getPerguntaAtividadeState = (idPergunta: string): FieldState => estadoPerguntaAtividade.value[idPergunta] || 'idle'

const getPerguntaAtividadeStateClass = (idPergunta: string): string => {
  const state = getPerguntaAtividadeState(idPergunta)
  if (state === 'saving') return 'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse'
  if (state === 'saved') return 'border-green-500/40 focus:ring-2 focus:ring-green-500/20'
  if (state === 'error') return 'border-red-500/40 focus:ring-2 focus:ring-red-500/20'
  return 'border-secondary/10 focus:ring-2 focus:ring-primary/20'
}

const getPergunta = (slug: string, bloco?: FormTab): Pergunta | null => {
  const source = bloco ? (perguntasByBloco.value[bloco] || []) : currentPerguntas.value
  return source.find((p) => p.slug === slug) || null
}

const isAddressReadOnlyField = (slug: string): boolean => lockedAddressFields.value.has(slug)

const getOptions = (opcoes: any): Array<{ label: string; value: string }> => {
  if (!opcoes) return []
  try {
    const parsed = typeof opcoes === 'string' ? JSON.parse(opcoes) : opcoes
    if (!Array.isArray(parsed)) return []
    return parsed.map((item: any) => {
      if (typeof item === 'string') return { label: item, value: item }
      return {
        label: String(item?.label ?? item?.value ?? ''),
        value: String(item?.value ?? item?.label ?? ''),
      }
    }).filter((o: any) => o.value)
  } catch {
    return []
  }
}

const getMultiCheckboxValues = (slug: string): string[] => {
  const value = formData.value[slug] || ''
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

const setFieldSavedTemporarily = (slug: string) => {
  fieldState.value[slug] = 'saved'
  setTimeout(() => {
    if (fieldState.value[slug] === 'saved') fieldState.value[slug] = 'idle'
  }, 1800)
}

const fetchEdital = async () => {
  const result = await $fetch<{ ok: boolean; editais: any[] }>('/api/jnpta/editais/publicos')
  const found = (result.editais || []).find((e: any) => e.id_edital === editalId)

  if (!found) {
    showToast('Edital não encontrado.', { type: 'error' })
    return navigateTo('/processo_seletivo')
  }

  if (found.qual_tempo !== 'primeiro_tempo') {
    return navigateTo(`/inscricao/jornadas/${editalId}`)
  }

  edital.value = found
}

const applyPerguntasAndRespostas = (result: any, bloco: FormTab) => {
  idCandidatura.value = result.id_candidatura ?? idCandidatura.value
  idGrupo.value = result.id_grupo ?? idGrupo.value
  idJornada.value = result.id_jornada ?? idJornada.value
  nomeGrupo.value = result.nome_grupo ?? nomeGrupo.value

  const lista: Pergunta[] = (result.perguntas || []).sort(
    (a: Pergunta, b: Pergunta) => (a.ordem ?? 99) - (b.ordem ?? 99)
  )

  perguntasByBloco.value = {
    ...perguntasByBloco.value,
    [bloco]: lista,
  }

  const data = { ...formData.value }
  const state = { ...fieldState.value }

  for (const p of lista) {
    if (!(p.slug in data)) data[p.slug] = ''
    if (!(p.slug in state)) state[p.slug] = 'idle'
  }

  const perguntaMap = new Map<string, string>()
  for (const p of lista) perguntaMap.set(p.id, p.slug)

  for (const r of (result.respostas || [])) {
    const slug = perguntaMap.get(r.id_pergunta)
    if (!slug) continue
    if (r.resposta_texto != null) data[slug] = String(r.resposta_texto)
    if (r.resposta_texto && (r.resposta_json?.nome_original || r.resposta_json?.originalName)) {
      uploadedFiles.value[slug] = {
        fileName: r.resposta_texto,
        originalName: r.resposta_json?.nome_original || r.resposta_json?.originalName || r.resposta_texto,
      }
    }
  }

  formData.value = data
  fieldState.value = state
  loadedBlocos.value.add(bloco)
}

const setPerguntaAtividadeSavedTemporarily = (idPergunta: string) => {
  estadoPerguntaAtividade.value[idPergunta] = 'saved'
  setTimeout(() => {
    if (estadoPerguntaAtividade.value[idPergunta] === 'saved') {
      estadoPerguntaAtividade.value[idPergunta] = 'idle'
    }
  }, 1800)
}

const fetchAtividadesPerguntas = async () => {
  if (!idCandidatura.value) return
  loadingAtividadesPerguntas.value = true
  try {
    const result = await $fetch<any>(`/api/jnpta/atividades/candidatura-perguntas?edital=${editalId}&candidatura=${idCandidatura.value}`)
    const atividades: AtividadeComPerguntas[] = (result?.atividades || []).map((a: any) => ({
      id: a.id,
      atividade_nome: a.atividade_nome || 'Atividade',
      descricao: a.descricao || null,
      ordem: Number(a.ordem || 0),
      perguntas: (a.perguntas || []).map((p: any) => ({
        id: p.id,
        pergunta: p.pergunta || '',
        tipo_resposta: (p.tipo_resposta || 'texto_curto') as PerguntaAtividade['tipo_resposta'],
        obrigatoria: !!p.obrigatoria,
        ordem: Number(p.ordem || 0),
        resposta_texto: p.resposta_texto || '',
        opcoes: (p.opcoes || []).map((o: any) => ({
          id: o.id,
          label: o.label || '',
          ordem: Number(o.ordem || 0),
        })).sort((x: OpcaoPergunta, y: OpcaoPergunta) => x.ordem - y.ordem),
      })).sort((x: PerguntaAtividade, y: PerguntaAtividade) => x.ordem - y.ordem),
    }))

    atividadesComPerguntas.value = atividades.sort((x: AtividadeComPerguntas, y: AtividadeComPerguntas) => x.ordem - y.ordem)

    const data = { ...respostasAtividade.value }
    const state = { ...estadoPerguntaAtividade.value }
    for (const atividade of atividadesComPerguntas.value) {
      for (const pergunta of atividade.perguntas) {
        data[pergunta.id] = String(pergunta.resposta_texto || '')
        if (!(pergunta.id in state)) state[pergunta.id] = 'idle'
      }
    }
    respostasAtividade.value = data
    estadoPerguntaAtividade.value = state
    atividadesPerguntasLoaded.value = true
  } catch (e: any) {
    showToast(e?.data?.statusMessage || 'Erro ao carregar perguntas das atividades.', { type: 'error' })
  } finally {
    loadingAtividadesPerguntas.value = false
  }
}

const saveRespostaAtividade = async (idPerguntaAtividade: string) => {
  if (!idCandidatura.value) return
  estadoPerguntaAtividade.value[idPerguntaAtividade] = 'saving'
  try {
    await $fetch(`/api/jnpta/atividades/candidatura-respostas?candidatura=${idCandidatura.value}`, {
      method: 'POST',
      body: {
        respostas: [{
          id_pergunta_atividade: idPerguntaAtividade,
          resposta_texto: respostasAtividade.value[idPerguntaAtividade] ?? '',
        }],
      },
    })
    setPerguntaAtividadeSavedTemporarily(idPerguntaAtividade)
  } catch (e: any) {
    estadoPerguntaAtividade.value[idPerguntaAtividade] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao salvar resposta da atividade.', { type: 'error' })
  }
}

const loadBloco = async (bloco: FormTab) => {
  if (bloco === 'atividades') {
    if (!atividadesPerguntasLoaded.value) {
      await fetchAtividadesPerguntas()
    }
    return
  }

  if (loadedBlocos.value.has(bloco)) return
  loadingBloco.value = true
  try {
    const result = await $fetch<any>(`/api/jnpta/form/init-by-edital/${editalId}?bloco=${bloco}`)
    applyPerguntasAndRespostas(result, bloco)
  } catch (e: any) {
    showToast(e?.data?.statusMessage || `Erro ao carregar ${bloco}.`, { type: 'error' })
  } finally {
    loadingBloco.value = false
  }
}

const initPage = async () => {
  loadingPage.value = true
  try {
    await fetchEdital()
    if (!edital.value) return
    await loadBloco('dados_pessoais')
    await fetchAtividadesPerguntas()
  } finally {
    loadingPage.value = false
  }
}

const saveTextField = async (slug: string) => {
  if (!idCandidatura.value) return
  const value = (formData.value[slug] ?? '').trim()
  if (!value) {
    fieldState.value[slug] = 'idle'
    return
  }
  fieldState.value[slug] = 'saving'
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
      method: 'POST',
      body: { respostas: [{ slug, resposta_texto: formData.value[slug] ?? '' }] },
    })
    setFieldSavedTemporarily(slug)
  } catch (e: any) {
    fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao salvar resposta.', { type: 'error' })
  }
}

const saveBatchFields = async (slugs: string[]) => {
  if (!idCandidatura.value || slugs.length === 0) return
  const respostas = slugs.map((slug) => ({ slug, resposta_texto: formData.value[slug] ?? '' }))
  for (const slug of slugs) fieldState.value[slug] = 'saving'
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
      method: 'POST',
      body: { respostas },
    })
    for (const slug of slugs) setFieldSavedTemporarily(slug)
  } catch (e: any) {
    for (const slug of slugs) fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao salvar campos.', { type: 'error' })
  }
}

const handleCepInput = () => {
  formData.value.pt_cep = formatCEP(formData.value.pt_cep || '')
}

const handleDataNascimentoInput = () => {
  const idade = calculateAgeFromDate(formData.value.pt_data_nascimento || '')
  formData.value.pt_idade = idade
}

const handleCepBlur = async () => {
  const cep = (formData.value.pt_cep ?? '').replace(/\D/g, '')
  if (cep.length > 0) await saveTextField('pt_cep')
  if (cep.length !== 8) return

  loadingCep.value = true
  try {
    const data = await $fetch<any>(`https://viacep.com.br/ws/${cep}/json/`)
    if (data.erro) {
      fieldState.value.pt_cep = 'error'
      showToast('CEP não encontrado.', { type: 'error' })
      return
    }

    formData.value.pt_endereco = data.logradouro || ''
    formData.value.pt_bairro = data.bairro || ''
    formData.value.pt_cidade = data.localidade || ''

    const locked = new Set<string>()
    if (data.logradouro) locked.add('pt_endereco')
    if (data.bairro) locked.add('pt_bairro')
    if (data.localidade) locked.add('pt_cidade')
    lockedAddressFields.value = locked

    await saveBatchFields(
      ['pt_cep', 'pt_endereco', 'pt_bairro', 'pt_cidade']
        .filter((slug) => (formData.value[slug] ?? '').trim() !== '')
    )
  } catch {
    fieldState.value.pt_cep = 'error'
    showToast('Erro ao consultar CEP.', { type: 'error' })
  } finally {
    loadingCep.value = false
  }
}

const handleDataNascimentoBlur = async () => {
  if (!idCandidatura.value) return

  const idade = calculateAgeFromDate(formData.value.pt_data_nascimento || '')
  formData.value.pt_idade = idade

  fieldState.value.pt_data_nascimento = 'saving'
  if ('pt_idade' in fieldState.value) {
    fieldState.value.pt_idade = 'saving'
  }

  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
      method: 'POST',
      body: {
        respostas: [
          { slug: 'pt_data_nascimento', resposta_texto: formData.value.pt_data_nascimento ?? '' },
          { slug: 'pt_idade', resposta_texto: formData.value.pt_idade ?? '' },
        ],
      },
    })

    setFieldSavedTemporarily('pt_data_nascimento')
    if ('pt_idade' in fieldState.value) {
      setFieldSavedTemporarily('pt_idade')
    }
  } catch (e: any) {
    fieldState.value.pt_data_nascimento = 'error'
    if ('pt_idade' in fieldState.value) {
      fieldState.value.pt_idade = 'error'
    }
    showToast(e?.data?.statusMessage || 'Erro ao salvar data de nascimento.', { type: 'error' })
  }
}

const saveChoiceField = async (slug: string, value: string) => {
  if (!idCandidatura.value) return
  formData.value[slug] = value
  fieldState.value[slug] = 'saving'
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
      method: 'POST',
      body: { respostas: [{ slug, resposta_texto: value }] },
    })
    setFieldSavedTemporarily(slug)
  } catch (e: any) {
    fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao salvar resposta.', { type: 'error' })
  }
}

const toggleMultiCheckbox = async (slug: string, option: string, checked: boolean) => {
  const current = new Set(getMultiCheckboxValues(slug))
  if (checked) current.add(option)
  else current.delete(option)
  await saveChoiceField(slug, JSON.stringify(Array.from(current)))
}

const toggleSingleCheckbox = async (slug: string, checked: boolean) => {
  await saveChoiceField(slug, checked ? 'true' : '')
}

const handleFileSelect = async (event: Event, slug: string) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !idCandidatura.value) return

  const validation = validateFile(file)
  if (!validation.valid) {
    showToast(validation.error || 'Arquivo inválido.', { type: 'error' })
    input.value = ''
    return
  }

  uploadingFiles.value.add(slug)
  fieldState.value[slug] = 'saving'
  try {
    const fileBase64 = await fileToBase64(file)
    const fileName = generateUuidFileName(file.name)
    const response = await $fetch<{ ok: boolean; fileName: string; originalName: string }>('/api/jnpta/form/upload-doc', {
      method: 'POST',
      body: {
        fileBase64,
        fileName,
        originalName: file.name,
        slug,
        idCandidatura: idCandidatura.value,
      }
    })

    uploadedFiles.value[slug] = {
      fileName: response.fileName,
      originalName: response.originalName,
    }
    setFieldSavedTemporarily(slug)
    showToast('Arquivo enviado com sucesso.', { type: 'success' })
    input.value = ''
  } catch (e: any) {
    fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao enviar arquivo.', { type: 'error' })
  } finally {
    uploadingFiles.value.delete(slug)
  }
}

const removeFile = async (slug: string) => {
  if (!idCandidatura.value) return
  fieldState.value[slug] = 'saving'
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
      method: 'POST',
      body: { respostas: [{ slug, resposta_texto: '' }] },
    })
    delete uploadedFiles.value[slug]
    setFieldSavedTemporarily(slug)
  } catch (e: any) {
    fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao remover arquivo.', { type: 'error' })
  }
}

const triggerFileUpload = (slug: string) => {
  if (!import.meta.client) return
  const input = window.document.getElementById(`file-${slug}`) as HTMLInputElement | null
  input?.click()
}

const isMissing = (p: Pergunta): boolean => {
  if (!p.obrigatorio) return false
  if (p.tipo === 'arquivo') return !uploadedFiles.value[p.slug]?.fileName
  return ((formData.value[p.slug] ?? '').trim() === '')
}

const validateCurrentTab = (): boolean => {
  if (activeTab.value === 'atividades') {
    const faltantes: string[] = []
    for (const atividade of atividadesComPerguntas.value) {
      for (const pergunta of atividade.perguntas) {
        if (!pergunta.obrigatoria) continue
        const valor = (respostasAtividade.value[pergunta.id] || '').trim()
        if (!valor) {
          estadoPerguntaAtividade.value[pergunta.id] = 'error'
          faltantes.push(pergunta.id)
        }
      }
    }

    if (faltantes.length > 0) {
      showToast('Preencha as perguntas obrigatórias das atividades antes de avançar.', { type: 'error' })
      return false
    }
    return true
  }

  const faltantes = currentPerguntas.value.filter(isMissing)
  for (const p of faltantes) fieldState.value[p.slug] = 'error'
  if (faltantes.length > 0) {
    showToast('Preencha os campos obrigatórios antes de avançar.', { type: 'error' })
    return false
  }
  return true
}

const goNext = async () => {
  if (!validateCurrentTab()) return
  const idx = tabs.findIndex((t) => t.key === activeTab.value)
  const next = tabs[idx + 1]?.key
  if (!next) return
  activeTab.value = next
  await loadBloco(next)
}

const handleTabClick = async (targetTab: FormTab) => {
  const currentIndex = tabs.findIndex((t) => t.key === activeTab.value)
  const targetIndex = tabs.findIndex((t) => t.key === targetTab)

  const isAdvancing = targetIndex > currentIndex
  if (isAdvancing && !validateCurrentTab()) {
    return
  }

  activeTab.value = targetTab
  await loadBloco(targetTab)
}

const finalizarInscricao = async () => {
  if (!idCandidatura.value) return
  if (!validateCurrentTab()) return

  finalizando.value = true
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/finalizar`, {
      method: 'POST',
      body: { aceite_termos: true },
    })
    showToast('Inscrição enviada com sucesso!', { type: 'success' })
    navigateTo('/processo_seletivo')
  } catch (e: any) {
    showToast(e?.data?.statusMessage || 'Erro ao finalizar inscrição.', { type: 'error' })
  } finally {
    finalizando.value = false
  }
}

watch(activeTab, async (tab) => {
  await loadBloco(tab)
})

onMounted(() => {
  initPage()
})
</script>

<template>
  <NuxtLayout name="base">
    <div class="flex flex-col gap-6 pb-10">
      <div v-if="loadingPage" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>

      <template v-else-if="edital">
        <div class="bg-div-15 rounded-lg p-4 md:p-8 border border-secondary/10 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div class="relative z-10">
            <div class="mb-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                Jornada Paulista • Primeiro Tempo
              </span>
            </div>
            <h1 class="text-xl md:text-3xl font-black text-text mb-2 md:mb-3 leading-tight">{{ edital.edital_titulo }}</h1>
            <p v-if="edital.edital_descricao" class="text-sm text-secondary mb-4 whitespace-pre-line">{{ edital.edital_descricao }}</p>
            <div class="flex flex-wrap gap-3 text-xs md:text-sm font-bold text-secondary">
              <div class="flex items-center gap-2 bg-background border border-secondary/10 rounded-md px-3 py-2">
                <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Início: {{ formatDate(edital.dt_inicio, 'dd/MM/yy HH:mm') }}</span>
              </div>
              <div class="flex items-center gap-2 bg-background border border-secondary/10 rounded-md px-3 py-2">
                <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Fim: {{ formatDate(edital.dt_fim, 'dd/MM/yy HH:mm') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-div-15 rounded-xl p-4 md:p-8">
          <div v-if="nomeGrupo" class="flex items-center gap-2 mb-6">
            <span class="text-xs text-secondary uppercase font-bold tracking-wider">Grupo:</span>
            <span class="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded">{{ nomeGrupo }}</span>
          </div>

          <h2 class="text-xl font-black text-white mb-6">Formulário de Inscrição</h2>

          <div class="flex items-center gap-4 overflow-x-auto pb-4 mb-6 custom-scrollbar-x border-b border-secondary/10">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              @click="handleTabClick(tab.key)"
              class="whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 border"
              :class="activeTab === tab.key ? 'bg-primary text-white border-primary shadow-md' : 'bg-background text-secondary border-secondary/10 hover:bg-div-15'"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-if="loadingBloco" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>

          <div v-else-if="activeTab === 'endereco'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="relative">
                <label for="field-pt_cep" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  CEP
                  <span v-if="getPergunta('pt_cep', 'endereco')?.obrigatorio" class="text-primary ml-0.5">*</span>
                </label>
                <div class="relative">
                  <input
                    id="field-pt_cep"
                    v-model="formData.pt_cep"
                    type="text"
                    maxlength="9"
                    placeholder="00000-000"
                    class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none pr-10 transition-colors"
                    :class="getInputStateClass('pt_cep')"
                    @input="handleCepInput"
                    @blur="handleCepBlur"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg v-if="loadingCep" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    <svg v-else-if="getFieldState('pt_cep') === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                    <svg v-else-if="getFieldState('pt_cep') === 'error'" class="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clip-rule="evenodd" /></svg>
                  </div>
                </div>
              </div>

              <div class="relative">
                <label for="field-pt_cidade" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  Cidade
                  <span v-if="getPergunta('pt_cidade', 'endereco')?.obrigatorio" class="text-primary ml-0.5">*</span>
                  <span v-if="lockedAddressFields.has('pt_cidade')" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(preenchido pelo CEP)</span>
                </label>
                <input
                  id="field-pt_cidade"
                  v-model="formData.pt_cidade"
                  type="text"
                  :readonly="isAddressReadOnlyField('pt_cidade')"
                  class="w-full bg-background border rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  :class="[isAddressReadOnlyField('pt_cidade') ? 'text-secondary/70 cursor-not-allowed' : 'text-white', getInputStateClass('pt_cidade')]"
                  @blur="!isAddressReadOnlyField('pt_cidade') && saveTextField('pt_cidade')"
                />
              </div>

              <div class="relative">
                <label for="field-pt_endereco" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  Endereço
                  <span v-if="getPergunta('pt_endereco', 'endereco')?.obrigatorio" class="text-primary ml-0.5">*</span>
                  <span v-if="lockedAddressFields.has('pt_endereco')" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(preenchido pelo CEP)</span>
                </label>
                <input
                  id="field-pt_endereco"
                  v-model="formData.pt_endereco"
                  type="text"
                  :readonly="isAddressReadOnlyField('pt_endereco')"
                  class="w-full bg-background border rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  :class="[isAddressReadOnlyField('pt_endereco') ? 'text-secondary/70 cursor-not-allowed' : 'text-white', getInputStateClass('pt_endereco')]"
                  @blur="!isAddressReadOnlyField('pt_endereco') && saveTextField('pt_endereco')"
                />
              </div>

              <div class="relative">
                <label for="field-pt_bairro" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  Bairro
                  <span v-if="getPergunta('pt_bairro', 'endereco')?.obrigatorio" class="text-primary ml-0.5">*</span>
                  <span v-if="lockedAddressFields.has('pt_bairro')" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(preenchido pelo CEP)</span>
                </label>
                <input
                  id="field-pt_bairro"
                  v-model="formData.pt_bairro"
                  type="text"
                  :readonly="isAddressReadOnlyField('pt_bairro')"
                  class="w-full bg-background border rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  :class="[isAddressReadOnlyField('pt_bairro') ? 'text-secondary/70 cursor-not-allowed' : 'text-white', getInputStateClass('pt_bairro')]"
                  @blur="!isAddressReadOnlyField('pt_bairro') && saveTextField('pt_bairro')"
                />
              </div>

              <div class="relative">
                <label for="field-pt_numero" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  Número
                  <span v-if="getPergunta('pt_numero', 'endereco')?.obrigatorio" class="text-primary ml-0.5">*</span>
                </label>
                <input
                  id="field-pt_numero"
                  v-model="formData.pt_numero"
                  type="text"
                  class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  :class="getInputStateClass('pt_numero')"
                  @blur="saveTextField('pt_numero')"
                />
              </div>

              <div class="relative">
                <label for="field-pt_complemento" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  Complemento
                </label>
                <input
                  id="field-pt_complemento"
                  v-model="formData.pt_complemento"
                  type="text"
                  class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  :class="getInputStateClass('pt_complemento')"
                  @blur="saveTextField('pt_complemento')"
                />
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'atividades'" class="space-y-4">
            <div v-if="loadingAtividadesPerguntas" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>

            <div v-else-if="atividadesComPerguntas.length === 0" class="rounded-lg border border-dashed border-secondary/20 p-6 text-center text-sm text-secondary">
              Não há perguntas por atividade para este edital.
            </div>

            <div v-else class="space-y-4">
              <div v-for="atividade in atividadesComPerguntas" :key="atividade.id" class="rounded-lg border border-secondary/10 bg-background/40 p-4 md:p-5 space-y-4">
                <div>
                  <h3 class="text-base font-bold text-white">{{ atividade.atividade_nome }}</h3>
                  <p v-if="atividade.descricao" class="text-xs text-secondary mt-1 whitespace-pre-line">{{ atividade.descricao }}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="pergunta in atividade.perguntas"
                    :key="pergunta.id"
                    class="relative"
                    :class="(pergunta.tipo_resposta === 'texto_longo' || pergunta.tipo_resposta === 'multipla_escolha' || pergunta.tipo_resposta === 'sim_nao') ? 'md:col-span-2' : ''"
                  >
                    <label :for="`atividade-pergunta-${pergunta.id}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                      {{ pergunta.pergunta }}
                      <span v-if="pergunta.obrigatoria" class="text-primary ml-0.5">*</span>
                    </label>

                    <!-- Sim / Não -->
                    <div v-if="pergunta.tipo_resposta === 'sim_nao'" class="flex gap-3">
                      <button
                        v-for="opcao in ['Sim', 'Não']"
                        :key="opcao"
                        type="button"
                        class="px-6 py-2.5 rounded-md text-sm font-bold border transition-colors"
                        :class="respostasAtividade[pergunta.id] === opcao
                          ? 'bg-primary border-primary text-white'
                          : 'bg-background border-secondary/20 text-secondary hover:border-primary/40 hover:text-white'"
                        @click="respostasAtividade[pergunta.id] = opcao; saveRespostaAtividade(pergunta.id)"
                      >
                        {{ opcao }}
                      </button>
                    </div>

                    <!-- Múltipla escolha -->
                    <div v-else-if="pergunta.tipo_resposta === 'multipla_escolha'" class="flex flex-wrap gap-2">
                      <button
                        v-for="opcao in pergunta.opcoes"
                        :key="opcao.id"
                        type="button"
                        class="px-4 py-2 rounded-md text-sm border transition-colors"
                        :class="respostasAtividade[pergunta.id] === opcao.id
                          ? 'bg-primary border-primary text-white font-bold'
                          : 'bg-background border-secondary/20 text-secondary hover:border-primary/40 hover:text-white'"
                        @click="respostasAtividade[pergunta.id] = opcao.id; saveRespostaAtividade(pergunta.id)"
                      >
                        {{ opcao.label }}
                      </button>
                      <div v-if="!pergunta.opcoes || pergunta.opcoes.length === 0" class="text-xs text-secondary/50 italic">Nenhuma opção disponível.</div>
                    </div>

                    <!-- Texto longo -->
                    <textarea
                      v-else-if="pergunta.tipo_resposta === 'texto_longo'"
                      :id="`atividade-pergunta-${pergunta.id}`"
                      v-model="respostasAtividade[pergunta.id]"
                      rows="5"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      :class="getPerguntaAtividadeStateClass(pergunta.id)"
                      @blur="saveRespostaAtividade(pergunta.id)"
                    />

                    <!-- Texto curto (default) -->
                    <input
                      v-else
                      :id="`atividade-pergunta-${pergunta.id}`"
                      v-model="respostasAtividade[pergunta.id]"
                      type="text"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      :class="getPerguntaAtividadeStateClass(pergunta.id)"
                      @blur="saveRespostaAtividade(pergunta.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="p in currentPerguntas"
                :key="p.id"
                class="relative"
                :class="p.slug === 'pt_carta_intencao' || p.tipo === 'arquivo' || p.slug === 'pt_email' ? 'md:col-span-2' : ''"
              >
                <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  {{ p.label }}
                  <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                </label>

                <div v-if="p.tipo === 'arquivo'" class="relative border-2 border-dashed border-secondary/20 rounded-lg p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer" @click="triggerFileUpload(p.slug)">
                  <input :id="`file-${p.slug}`" type="file" class="hidden" :disabled="uploadingFiles.has(p.slug)" accept="application/pdf,image/jpeg,image/png,image/jpg" @change="(e) => handleFileSelect(e, p.slug)" />
                  <div v-if="!uploadedFiles[p.slug]?.fileName" class="flex flex-col items-center gap-2">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                      <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <p class="text-xs font-bold text-secondary tracking-tight">{{ uploadingFiles.has(p.slug) ? 'Enviando arquivo...' : 'Clique para enviar arquivo' }}</p>
                    <p class="text-[10px] text-secondary/40">PDF, JPG, PNG (Max 4MB)</p>
                  </div>
                  <div v-else class="flex flex-col items-center gap-2 py-2 w-full">
                    <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1">
                      <svg class="w-6 h-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>
                    </div>
                    <p class="text-xs font-bold text-text truncate max-w-full px-4">{{ uploadedFiles[p.slug]?.originalName }}</p>
                    <button type="button" class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1" :disabled="fieldState[p.slug] === 'saving'" @click.stop="removeFile(p.slug)">
                      {{ fieldState[p.slug] === 'saving' ? 'Removendo...' : 'Remover arquivo' }}
                    </button>
                  </div>
                </div>

                <div v-else class="relative">
                  <div v-if="p.slug === 'pt_genero'" class="mt-1">
                    <select
                      :id="`field-${p.slug}`"
                      :value="formData[p.slug] || ''"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      :class="getInputStateClass(p.slug)"
                      @change="saveChoiceField(p.slug, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="" disabled>Selecione</option>
                      <option
                        v-for="opt in getOptions(p.opcoes)"
                        :key="`${p.slug}-${opt.value}`"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                  </div>

                  <div v-else-if="p.tipo === 'radio'" class="flex flex-wrap gap-2 mt-1">
                    <label v-for="opt in getOptions(p.opcoes)" :key="`${p.slug}-${opt.value}`" class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`field-${p.slug}`" :value="opt.value" :checked="formData[p.slug] === opt.value" class="text-primary focus:ring-primary" @change="saveChoiceField(p.slug, opt.value)" />
                      <span class="text-sm text-secondary">{{ opt.label }}</span>
                    </label>
                  </div>

                  <div v-else-if="p.tipo === 'checkbox' && getOptions(p.opcoes).length > 0" class="space-y-2 mt-1">
                    <label v-for="opt in getOptions(p.opcoes)" :key="`${p.slug}-${opt.value}`" class="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                      <input type="checkbox" :checked="getMultiCheckboxValues(p.slug).includes(opt.value)" class="text-primary focus:ring-primary" @change="(e) => toggleMultiCheckbox(p.slug, opt.value, (e.target as HTMLInputElement).checked)" />
                      <span>{{ opt.label }}</span>
                    </label>
                  </div>

                  <div v-else-if="p.tipo === 'checkbox'" class="flex items-center gap-3 mt-1">
                    <input :id="`field-${p.slug}`" type="checkbox" :checked="formData[p.slug] === 'true'" class="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded" @change="(e) => toggleSingleCheckbox(p.slug, (e.target as HTMLInputElement).checked)" />
                    <span class="text-sm text-secondary">Confirmo</span>
                  </div>

                  <textarea v-else-if="p.slug === 'pt_carta_intencao'" :id="`field-${p.slug}`" v-model="formData[p.slug]" rows="8" class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors" :class="getInputStateClass(p.slug)" @blur="saveTextField(p.slug)" />

                  <input
                    v-else
                    :id="`field-${p.slug}`"
                    v-model="formData[p.slug]"
                    :type="getInputType(p.tipo)"
                    :readonly="isReadonlySlug(p.slug)"
                    class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none pr-10 transition-colors"
                    :class="[
                      getInputStateClass(p.slug),
                      isReadonlySlug(p.slug) ? 'text-secondary/70 cursor-not-allowed opacity-70' : ''
                    ]"
                    @input="p.slug === 'pt_data_nascimento' ? handleDataNascimentoInput() : undefined"
                    @blur="isReadonlySlug(p.slug) ? undefined : (p.slug === 'pt_data_nascimento' ? handleDataNascimentoBlur() : saveTextField(p.slug))"
                  />

                  <div
                    v-if="isReadonlySlug(p.slug)"
                    class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <svg class="w-4 h-4 text-secondary/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col-reverse md:flex-row gap-3 pt-6 mt-6 border-t border-secondary/10">
            <button type="button" @click="navigateTo('/processo_seletivo')" class="w-full md:w-auto bg-background border border-secondary/10 text-secondary hover:text-white font-bold py-3 px-6 rounded-lg text-sm uppercase tracking-wider transition-colors">
              Voltar
            </button>
            <div class="flex-1"></div>
            <button v-if="activeTab !== lastTabKey" type="button" @click="goNext" class="w-full md:w-auto bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg text-sm uppercase tracking-wider transition-colors shadow-lg shadow-primary/20">
              Próxima aba →
            </button>
            <button v-else type="button" @click="finalizarInscricao" :disabled="finalizando" class="w-full md:w-auto font-bold py-3 px-6 rounded-lg text-sm uppercase tracking-wider transition-colors" :class="finalizando ? 'bg-secondary/20 text-secondary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20'">
              {{ finalizando ? 'Enviando...' : 'Enviar inscrição' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.custom-scrollbar-x::-webkit-scrollbar {
  height: 6px;
}

.custom-scrollbar-x::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar-x::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.custom-scrollbar-x::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
