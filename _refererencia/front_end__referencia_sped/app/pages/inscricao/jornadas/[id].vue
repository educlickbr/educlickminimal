<script setup lang="ts">
import { formatDate } from '@/utils/date'
import { formatCNPJ, isValidCNPJ } from '../../../utils/cnpj'
import { formatCPF, formatPhoneBR, isValidCPF } from '../../../utils/cpf'
import { fileToBase64, generateUuidFileName, validateFile } from '../../../../utils/file'
import { useToast } from '../../../../composables/useToast'

definePageMeta({
  title: 'Inscrição - Jornada Paulista'
})

const route = useRoute()
const { showToast } = useToast()

const editalId = route.params.id as string

type FormTab =
  | 'dados_grupo'
  | 'endereco_empresa'
  | 'documentos_empresa'
  | 'documentos_projeto'
  | 'direcao_artistica'
  | 'integrantes'
  | 'aceite_termos'

const tabs: Array<{ key: FormTab; label: string }> = [
  { key: 'dados_grupo', label: 'Dados do Grupo' },
  { key: 'endereco_empresa', label: 'Endereço Empresa' },
  { key: 'documentos_empresa', label: 'Documentos Empresa' },
  { key: 'documentos_projeto', label: 'Documentos Projeto' },
  { key: 'direcao_artistica', label: 'Direção Artística' },
  { key: 'integrantes', label: 'Integrantes' },
  { key: 'aceite_termos', label: 'Aceite Termos' }
]

const activeTab = ref<FormTab>('dados_grupo')

// ─── Header state ────────────────────────────────────────────────────────────
const edital = ref<any>(null)
const loadingEdital = ref(true)

// ─── Form context ─────────────────────────────────────────────────────────────
const loadingForm = ref(true)
const idCandidatura = ref<string | null>(null)
const idGrupo = ref<string | null>(null)
const nomeGrupo = ref<string | null>(null)

// ─── Dynamic perguntas / respostas ────────────────────────────────────────────
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

const perguntas = ref<Pergunta[]>([])
const formData = ref<Record<string, string>>({})
type FieldState = 'idle' | 'saving' | 'saved' | 'error'
const fieldState = ref<Record<string, FieldState>>({})

// ─── Aba 2: Endereço Empresa ──────────────────────────────────────────────────
const perguntasEndereco = ref<Pergunta[]>([])
const loadedBlocos = ref<Set<string>>(new Set(['dados_grupo']))
const loadingBloco = ref(false)
const loadingCep = ref(false)
const lockedAddressFields = ref<Set<string>>(new Set())

// ─── Aba 3: Documentos Empresa ────────────────────────────────────────────────
const perguntasDocumentos = ref<Pergunta[]>([])
const perguntasDocumentosProjeto = ref<Pergunta[]>([])
const perguntasDirecaoArtistica = ref<Pergunta[]>([])
const uploadingFiles = ref<Set<string>>(new Set())
const uploadedFiles = ref<Record<string, { fileName: string; originalName: string }>>({})
const confirmDeleteFiles = ref<Set<string>>(new Set())
const loadingCepDirecao = ref(false)
const lockedDirecaoFields = ref<Set<string>>(new Set())

// ─── Aba 6: Integrantes ───────────────────────────────────────────────────────
interface IntegranteCard {
  id_integrante?: string
  id_user_exp?: string
  ordem: number
  formData: Record<string, string>
  status: 'pendente' | 'salvando' | 'salvo' | 'erro'
  isOpen: boolean
  confirmDelete: boolean
}
const perguntasIntegrantes = ref<Pergunta[]>([])
const integrantesCards = ref<IntegranteCard[]>([])
const loadingIntegrantes = ref(false)
const qtdIntegrantesInput = ref(1)
const aceiteTermos = ref(false)
const finalizandoCandidatura = ref(false)

// ─── Fetch edital (header) ────────────────────────────────────────────────────
const fetchEdital = async () => {
  loadingEdital.value = true
  try {
    const result = await $fetch<{ ok: boolean; editais: any[] }>('/api/jnpta/editais/publicos')
    const editais = result.editais || []
    edital.value = editais.find((e: any) => e.id_edital === editalId)
    if (!edital.value) {
      showToast('Edital não encontrado', { type: 'error' })
      navigateTo('/processo_seletivo')
    }
  } catch {
    showToast('Erro ao carregar edital', { type: 'error' })
    navigateTo('/processo_seletivo')
  } finally {
    loadingEdital.value = false
  }
}

// ─── Init form context + perguntas + respostas ────────────────────────────────
const initForm = async () => {
  loadingForm.value = true
  try {
    const result = await $fetch<any>(
      `/api/jnpta/form/init-by-edital/${editalId}?bloco=dados_grupo`
    )

    idCandidatura.value = result.id_candidatura ?? null
    idGrupo.value = result.id_grupo ?? null
    nomeGrupo.value = result.nome_grupo ?? null

    const lista: Pergunta[] = (result.perguntas || []).sort(
      (a: Pergunta, b: Pergunta) => (a.ordem ?? 99) - (b.ordem ?? 99)
    )
    perguntas.value = lista

    // Init with empty strings
    const data: Record<string, string> = {}
    const state: Record<string, FieldState> = {}
    for (const p of lista) {
      data[p.slug] = ''
      state[p.slug] = 'idle'
    }

    // Pre-fill from grupo columns (most reliable source)
    if (result.grupo) {
      const g = result.grupo
      const mapping: Record<string, string | null | undefined> = {
        nome_do_grupo: g.nome_grupo,
        razao_social: g.razao_social,
        nome_da_empresa: g.nome_empresa,
        cnpj_empresa: g.cnpj,
        email_contato: g.email_contato,
        telefone_fixo: g.telefone_fixo,
        telefone_celular_contato: g.telefone_celular,
        redes_sociais_grupo: g.redes_sociais,
        banco_nome: g.banco,
        agencia_num: g.agencia,
        conta_corrente_num: g.conta_corrente,
        pix_chave: g.pix,
      }
      for (const [slug, value] of Object.entries(mapping)) {
        if (value != null) data[slug] = String(value)
      }
    }

    // Overlay with saved respostas (may be more up to date)
    const perguntaMap = new Map<string, string>()
    for (const p of lista) perguntaMap.set(p.id, p.slug)
    for (const r of (result.respostas as any[]) || []) {
      const slug = perguntaMap.get(r.id_pergunta)
      if (slug && r.resposta_texto != null) data[slug] = r.resposta_texto
    }

    formData.value = data
    fieldState.value = state
  } catch (e: any) {
    console.error('Erro ao iniciar formulário:', e)
    showToast(e?.data?.statusMessage || 'Erro ao inicializar formulário', { type: 'error' })
  } finally {
    loadingForm.value = false
  }
}

// ─── Onblur save ──────────────────────────────────────────────────────────────
const handleFieldBlur = async (slug: string) => {
  if (!idCandidatura.value) return

  if (slug === 'email') {
    fieldState.value[slug] = 'idle'
    return
  }

  const rawValue = formData.value[slug]
  const value = typeof rawValue === 'string' ? rawValue.trim() : ''

  if (value === '') {
    fieldState.value[slug] = 'idle'
    return
  }

  if (slug === 'cnpj_empresa') {
    if (!isValidCNPJ(value)) {
      fieldState.value[slug] = 'error'
      return
    }
  }

  if (slug === 'cpf') {
    if (!isValidCPF(value)) {
      fieldState.value[slug] = 'error'
      return
    }
  }

  fieldState.value[slug] = 'saving'
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
      method: 'POST',
      body: { respostas: [{ slug, resposta_texto: formData.value[slug] ?? '' }] },
    })
    fieldState.value[slug] = 'saved'
    setTimeout(() => {
      if (fieldState.value[slug] === 'saved') fieldState.value[slug] = 'idle'
    }, 2000)
  } catch (e: any) {
    fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || `Erro ao salvar campo`, { type: 'error' })
    setTimeout(() => {
      if (fieldState.value[slug] === 'error') fieldState.value[slug] = 'idle'
    }, 4000)
  }
}

const handleFieldInput = (slug: string) => {
  if (slug === 'cnpj_empresa') {
    formData.value[slug] = formatCNPJ(formData.value[slug] ?? '')
    return
  }

  if (slug === 'cpf') {
    formData.value[slug] = formatCPF(formData.value[slug] ?? '')
    return
  }

  if (
    slug === 'telefone_celular' ||
    slug === 'telefone_fixo' ||
    slug === 'telefone_celular_contato'
  ) {
    formData.value[slug] = formatPhoneBR(formData.value[slug] ?? '')
  }
}

const getCnpjStatus = (slug: string): 'empty' | 'valid' | 'invalid' => {
  if (slug !== 'cnpj_empresa') return 'empty'
  const value = formData.value[slug] ?? ''
  if (!value.trim()) return 'empty'
  return isValidCNPJ(value) ? 'valid' : 'invalid'
}

const getCpfStatus = (slug: string): 'empty' | 'valid' | 'invalid' => {
  if (slug !== 'cpf') return 'empty'
  const value = formData.value[slug] ?? ''
  if (!value.trim()) return 'empty'
  return isValidCPF(value) ? 'valid' : 'invalid'
}

const isDirecaoReadOnlyField = (slug: string): boolean => {
  return slug === 'email' || lockedDirecaoFields.value.has(slug)
}

// ─── Input type from tipo ────────────────────────────────────────────────────
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

const getFieldGridClass = (slug: string): string => {
  const fullWidthSlugs = new Set([
    'nome_do_grupo',
    'redes_sociais_grupo',
    'nome_da_empresa',
    'email_contato',
    'banco_nome',
    'pix_chave',
  ])

  if (fullWidthSlugs.has(slug)) {
    return 'md:col-span-2'
  }

  return ''
}

const validateDadosGrupoForAdvance = (): boolean => {
  const perguntasObrigatorias = perguntas.value.filter((p) => p.obrigatorio)
  const faltantes = perguntasObrigatorias.filter((p) => {
    const value = (formData.value[p.slug] ?? '').toString().trim()
    return value === ''
  })

  for (const p of faltantes) {
    fieldState.value[p.slug] = 'error'
  }

  if (faltantes.length > 0) {
    showToast('Preencha os campos obrigatórios antes de avançar.', { type: 'error' })
    return false
  }

  const cnpj = (formData.value.cnpj_empresa ?? '').trim()
  if (cnpj && !isValidCNPJ(cnpj)) {
    fieldState.value.cnpj_empresa = 'error'
    showToast('CNPJ inválido. Corrija antes de avançar.', { type: 'error' })
    return false
  }

  return true
}

const handleAdvanceTab = () => {
  if (!canAdvanceFromCurrentTab()) return

  const currentIndex = tabs.findIndex(t => t.key === activeTab.value)
  const nextTab = tabs[currentIndex + 1]?.key
  if (nextTab) {
    activeTab.value = nextTab
  }
}

const handleTabClick = (targetTab: FormTab) => {
  const currentIndex = tabs.findIndex(t => t.key === activeTab.value)
  const targetIndex = tabs.findIndex(t => t.key === targetTab)

  const isAdvancing = targetIndex > currentIndex
  if (isAdvancing && !canAdvanceFromCurrentTab()) {
    return
  }

  activeTab.value = targetTab
}

// ─── Lazy-load perguntas by bloco ────────────────────────────────────────────
const loadBlocoPerguntas = async (bloco: string) => {
  if (!idCandidatura.value) return
  if (loadedBlocos.value.has(bloco)) return

  loadingBloco.value = true
  try {
    const result = await $fetch<any>(
      `/api/jnpta/form/init-by-edital/${editalId}?bloco=${bloco}`
    )

    const lista: Pergunta[] = (result.perguntas || []).sort(
      (a: Pergunta, b: Pergunta) => (a.ordem ?? 99) - (b.ordem ?? 99)
    )

    // Init form data + state for new slugs
    const data = { ...formData.value }
    const state = { ...fieldState.value }
    for (const p of lista) {
      if (!(p.slug in data)) {
        data[p.slug] = ''
        state[p.slug] = 'idle'
      }
    }

    // Overlay with saved respostas
    const perguntaMap = new Map<string, string>()
    for (const p of lista) perguntaMap.set(p.id, p.slug)
    for (const r of (result.respostas as any[]) || []) {
      const slug = perguntaMap.get(r.id_pergunta)
      if (slug && r.resposta_texto != null) data[slug] = r.resposta_texto
    }

    formData.value = data
    fieldState.value = state

    if (bloco === 'endereco_empresa') {
      perguntasEndereco.value = lista
      // If logradouro/bairro/cidade already have values, lock them (preenchidos pelo CEP)
      if (data.endereco_logradouro || data.endereco_bairro || data.endereco_cidade) {
        const locked = new Set<string>()
        if (data.endereco_logradouro) locked.add('endereco_logradouro')
        if (data.endereco_bairro) locked.add('endereco_bairro')
        if (data.endereco_cidade) locked.add('endereco_cidade')
        lockedAddressFields.value = locked
      }
    }

    if (bloco === 'documentos_empresa' || bloco === 'documentos_projeto' || bloco === 'direcao_artistica') {
      if (bloco === 'documentos_empresa') {
        perguntasDocumentos.value = lista
      }
      if (bloco === 'documentos_projeto') {
        perguntasDocumentosProjeto.value = lista
      }
      if (bloco === 'direcao_artistica') {
        perguntasDirecaoArtistica.value = lista
        if (data.endereco || data.bairro || data.cidade) {
          const locked = new Set<string>()
          if (data.endereco) locked.add('endereco')
          if (data.bairro) locked.add('bairro')
          if (data.cidade) locked.add('cidade')
          lockedDirecaoFields.value = locked
        }
      }

      // Pre-populate uploadedFiles from saved respostas
      const uploaded: Record<string, { fileName: string; originalName: string }> = { ...uploadedFiles.value }
      const perguntaMap = new Map<string, string>()
      for (const p of lista) perguntaMap.set(p.id, p.slug)
      for (const r of (result.respostas as any[]) || []) {
        const slug = perguntaMap.get(r.id_pergunta) as string
        if (slug && r.resposta_texto) {
          const nomeOriginal = r.resposta_json?.nome_original || r.resposta_texto
          uploaded[slug] = { fileName: r.resposta_texto, originalName: nomeOriginal }
        }
      }
      uploadedFiles.value = uploaded
    }

    loadedBlocos.value.add(bloco)
  } catch (e: any) {
    console.error(`Erro ao carregar bloco ${bloco}:`, e)
    showToast(`Erro ao carregar perguntas: ${bloco}`, { type: 'error' })
  } finally {
    loadingBloco.value = false
  }
}

// ─── CEP lookup via ViaCEP ────────────────────────────────────────────────────
const handleCepBlur = async () => {
  const cep = (formData.value.endereco_cep ?? '').replace(/\D/g, '')

  // Save raw CEP value first
  if (cep.length > 0) {
    await handleFieldBlur('endereco_cep')
  }

  if (cep.length !== 8) return

  loadingCep.value = true
  try {
    const data = await $fetch<any>(`https://viacep.com.br/ws/${cep}/json/`)

    if (data.erro) {
      showToast('CEP não encontrado.', { type: 'error' })
      fieldState.value.endereco_cep = 'error'
      return
    }

    // Auto-fill fields
    formData.value.endereco_logradouro = data.logradouro || ''
    formData.value.endereco_bairro = data.bairro || ''
    formData.value.endereco_cidade = data.localidade || ''

    // Lock auto-filled fields
    const locked = new Set<string>()
    if (data.logradouro) locked.add('endereco_logradouro')
    if (data.bairro) locked.add('endereco_bairro')
    if (data.localidade) locked.add('endereco_cidade')
    lockedAddressFields.value = locked

    // Batch save auto-filled fields
    const slugsToSave = ['endereco_cep', 'endereco_logradouro', 'endereco_bairro', 'endereco_cidade']
      .filter(s => (formData.value[s] ?? '').trim() !== '')

    if (slugsToSave.length > 0 && idCandidatura.value) {
      const respostas = slugsToSave.map(slug => ({
        slug,
        resposta_texto: formData.value[slug] ?? '',
      }))
      for (const slug of slugsToSave) fieldState.value[slug] = 'saving'
      try {
        await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
          method: 'POST',
          body: { respostas },
        })
        for (const slug of slugsToSave) {
          fieldState.value[slug] = 'saved'
          setTimeout(() => {
            if (fieldState.value[slug] === 'saved') fieldState.value[slug] = 'idle'
          }, 2000)
        }
      } catch {
        for (const slug of slugsToSave) fieldState.value[slug] = 'error'
      }
    }

    // Focus número field after CEP fill
    await nextTick()
    const numeroEl = document.getElementById('field-endereco_numero') as HTMLInputElement | null
    numeroEl?.focus()
  } catch {
    showToast('Erro ao consultar CEP.', { type: 'error' })
    fieldState.value.endereco_cep = 'error'
  } finally {
    loadingCep.value = false
  }
}

const handleDirecaoCepBlur = async () => {
  const cep = (formData.value.cep ?? '').replace(/\D/g, '')

  if (cep.length > 0) {
    await handleFieldBlur('cep')
  }

  if (cep.length !== 8) return

  loadingCepDirecao.value = true
  try {
    const data = await $fetch<any>(`https://viacep.com.br/ws/${cep}/json/`)

    if (data.erro) {
      showToast('CEP não encontrado.', { type: 'error' })
      fieldState.value.cep = 'error'
      return
    }

    formData.value.endereco = data.logradouro || ''
    formData.value.bairro = data.bairro || ''
    formData.value.cidade = data.localidade || ''

    const locked = new Set<string>()
    if (data.logradouro) locked.add('endereco')
    if (data.bairro) locked.add('bairro')
    if (data.localidade) locked.add('cidade')
    lockedDirecaoFields.value = locked

    const slugsToSave = ['cep', 'endereco', 'bairro', 'cidade']
      .filter(s => (formData.value[s] ?? '').trim() !== '')

    if (slugsToSave.length > 0 && idCandidatura.value) {
      const respostas = slugsToSave.map(slug => ({
        slug,
        resposta_texto: formData.value[slug] ?? '',
      }))
      for (const slug of slugsToSave) fieldState.value[slug] = 'saving'
      try {
        await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
          method: 'POST',
          body: { respostas },
        })
        for (const slug of slugsToSave) {
          fieldState.value[slug] = 'saved'
          setTimeout(() => {
            if (fieldState.value[slug] === 'saved') fieldState.value[slug] = 'idle'
          }, 2000)
        }
      } catch {
        for (const slug of slugsToSave) fieldState.value[slug] = 'error'
      }
    }

    await nextTick()
    const numeroEl = document.getElementById('field-numero') as HTMLInputElement | null
    numeroEl?.focus()
  } catch {
    showToast('Erro ao consultar CEP.', { type: 'error' })
    fieldState.value.cep = 'error'
  } finally {
    loadingCepDirecao.value = false
  }
}

// ─── Select options from pergunta.opcoes (JSON string or array) ───────────────
const getSelectOptions = (opcoes: any): Array<{ label: string; value: string }> => {
  if (!opcoes) return []
  try {
    const parsed = typeof opcoes === 'string' ? JSON.parse(opcoes) : opcoes
    if (!Array.isArray(parsed)) return []
    return parsed.map((o: any) => ({
      label: o.label ?? o.value ?? String(o),
      value: o.value ?? o.label ?? String(o),
    }))
  } catch {
    return []
  }
}

const getRadioOptions = (pergunta: Pergunta): Array<{ label: string; value: string }> => {
  const parsed = getSelectOptions(pergunta.opcoes)
  if (parsed.length > 0) return parsed.map((o) => ({ label: String(o.label), value: String(o.value) }))

  if (pergunta.slug === 'pcd') {
    return [
      { label: 'Sim', value: 'Sim' },
      { label: 'Não', value: 'Não' },
    ]
  }

  return []
}

const getDirecaoGridClass = (slug: string): string => {
  const fullWidth = new Set([
    'midias_sociais',
    'curriculo',
    'pcd',
  ])

  if (fullWidth.has(slug)) return 'md:col-span-2'
  return ''
}

// ─── File upload handler ──────────────────────────────────────────────────────
const handleFileSelect = async (event: Event, slug: string) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const validation = validateFile(file)
  if (!validation.valid) {
    showToast(validation.error || 'Arquivo inválido', { type: 'error' })
    input.value = ''
    return
  }

  uploadingFiles.value.add(slug)

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
        idCandidatura: idCandidatura.value
      }
    })

    uploadedFiles.value[slug] = {
      fileName: response.fileName,
      originalName: response.originalName
    }

    fieldState.value[slug] = 'saved'
    setTimeout(() => {
      if (fieldState.value[slug] === 'saved') fieldState.value[slug] = 'idle'
    }, 2000)

    showToast('Arquivo enviado com sucesso!', { type: 'success' })
    input.value = ''
  } catch (e: any) {
    fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao enviar arquivo', { type: 'error' })
    setTimeout(() => {
      if (fieldState.value[slug] === 'error') fieldState.value[slug] = 'idle'
    }, 4000)
  } finally {
    uploadingFiles.value.delete(slug)
  }
}

const handleFileRemove = async (slug: string) => {
  // Para remover, salvamos uma resposta vazia
  if (!idCandidatura.value) return

  fieldState.value[slug] = 'saving'
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/respostas`, {
      method: 'POST',
      body: { respostas: [{ slug, resposta_texto: '' }] }
    })

    uploadedFiles.value[slug] = undefined as any
    delete uploadedFiles.value[slug]

    fieldState.value[slug] = 'saved'
    setTimeout(() => {
      if (fieldState.value[slug] === 'saved') fieldState.value[slug] = 'idle'
    }, 2000)

    showToast('Arquivo removido', { type: 'success' })
    confirmDeleteFiles.value.delete(slug)
  } catch (e: any) {
    fieldState.value[slug] = 'error'
    showToast(e?.data?.statusMessage || 'Erro ao remover arquivo', { type: 'error' })
    setTimeout(() => {
      if (fieldState.value[slug] === 'error') fieldState.value[slug] = 'idle'
    }, 4000)
  }
}

const triggerFileUpload = (slug: string) => {
  const input = document.getElementById(`file-${slug}`) as HTMLInputElement | null
  input?.click()
}

const showConfirmDeleteFile = (slug: string) => {
  confirmDeleteFiles.value.add(slug)
}

const cancelConfirmDeleteFile = (slug: string) => {
  confirmDeleteFiles.value.delete(slug)
}

// ─── Integrantes: carregar perguntas + cards existentes ─────────────────────
const loadIntegrantes = async () => {
  if (!idCandidatura.value || !idGrupo.value) return
  if (loadedBlocos.value.has('integrantes')) return

  loadingIntegrantes.value = true
  try {
    // Carrega perguntas do bloco
    const pergResult = await $fetch<any>(
      `/api/jnpta/form/init-by-edital/${editalId}?bloco=integrantes`
    )
    const lista: Pergunta[] = (pergResult.perguntas || []).sort(
      (a: Pergunta, b: Pergunta) => (a.ordem ?? 99) - (b.ordem ?? 99)
    )
    perguntasIntegrantes.value = lista

    // Carrega integrantes já salvos
    const result = await $fetch<any>(
      `/api/jnpta/form/${idCandidatura.value}/integrantes`
    )

    const existentes = result.integrantes || []
    qtdIntegrantesInput.value = result.qtd_integrantes ?? Math.max(existentes.length, 1)

    // Monta mapa de perguntas pelo id para resolução das respostas
    const pergMap = new Map<string, string>() // id_pergunta → slug
    for (const p of lista) pergMap.set(p.id, p.slug)

    const cards: IntegranteCard[] = []

    for (const int of existentes) {
      const fd: Record<string, string> = {}
      for (const p of lista) fd[p.slug] = ''

      // Resolve respostas salvas
      for (const r of (int.respostas || [])) {
        const slug = pergMap.get(r.id_pergunta)
        if (slug && r.resposta_texto != null) fd[slug] = r.resposta_texto
      }

      // Injeta campos especiais do user_expandido
      if (int.email) fd['membro_email'] = int.email
      if (int.nome) fd['membro_nome'] = int.nome
      if (int.sobrenome) fd['membro_sobrenome'] = int.sobrenome
      if (int.funcao) fd['membro_funcao'] = int.funcao

      cards.push({
        id_integrante: int.id_integrante,
        id_user_exp:   int.id_user_exp,
        ordem:         int.ordem,
        formData:      fd,
        status:        'salvo',
        isOpen:        false,
        confirmDelete: false,
      })
    }

    // Completa com cards vazios se qtd > existentes
    const total = Math.max(qtdIntegrantesInput.value, existentes.length)
    for (let i = cards.length; i < total; i++) {
      const fd: Record<string, string> = {}
      for (const p of lista) fd[p.slug] = ''
      cards.push({
        ordem:         i + 1,
        formData:      fd,
        status:        'pendente',
        isOpen:        i === 0,
        confirmDelete: false,
      })
    }

    integrantesCards.value = cards
    loadedBlocos.value.add('integrantes')
  } catch (e: any) {
    showToast(e?.data?.statusMessage || 'Erro ao carregar integrantes', { type: 'error' })
  } finally {
    loadingIntegrantes.value = false
  }
}

const addIntegranteCard = () => {
  const ordem = integrantesCards.value.length + 1
  const fd: Record<string, string> = {}
  for (const p of perguntasIntegrantes.value) fd[p.slug] = ''
  integrantesCards.value.push({
    ordem,
    formData: fd,
    status:   'pendente',
    isOpen:   true,
    confirmDelete: false,
  })
  qtdIntegrantesInput.value = integrantesCards.value.length
}

const saveIntegranteCard = async (index: number) => {
  if (!idCandidatura.value || !idGrupo.value) return
  const card = integrantesCards.value[index]
  if (!card) return

  // Validação mínima
  const obrigatorios = perguntasIntegrantes.value.filter(p => p.obrigatorio).map(p => p.slug)
  const faltando = obrigatorios.filter(s => !(card.formData[s] ?? '').trim())
  if (faltando.length > 0) {
    showToast(`Integrante ${index + 1}: preencha os campos obrigatórios.`, { type: 'error' })
    return
  }

  const cpfVal = (card.formData['membro_cpf'] ?? '').trim()
  if (cpfVal && !isValidCPF(cpfVal)) {
    showToast(`Integrante ${index + 1}: CPF inválido.`, { type: 'error' })
    return
  }

  card.status = 'salvando'
  try {
    const respostas = perguntasIntegrantes.value.map(p => ({
      slug:          p.slug,
      resposta_texto: card.formData[p.slug] ?? '',
    }))

    const result = await $fetch<any>(
      `/api/jnpta/form/${idCandidatura.value}/integrantes-upsert`,
      {
        method: 'POST',
        body: {
          id_grupo: idGrupo.value,
          ordem:    card.ordem,
          respostas,
        },
      }
    )

    card.id_integrante = result.id_integrante
    card.id_user_exp   = result.id_user_exp
    card.status        = 'salvo'
    card.isOpen        = false
    showToast(`Integrante ${index + 1} salvo!`, { type: 'success' })
  } catch (e: any) {
    card.status = 'erro'
    showToast(e?.data?.statusMessage || `Erro ao salvar integrante ${index + 1}`, { type: 'error' })
  }
}

const confirmDeleteIntegranteCard = (index: number) => {
  const card = integrantesCards.value[index]
  if (card) card.confirmDelete = true
}

const cancelDeleteIntegranteCard = (index: number) => {
  const card = integrantesCards.value[index]
  if (card) card.confirmDelete = false
}

const deleteIntegranteCard = async (index: number) => {
  if (!idCandidatura.value) return
  const card = integrantesCards.value[index]
  if (!card) return

  // Se ainda não foi salvo, remove só do front
  if (!card.id_integrante) {
    integrantesCards.value.splice(index, 1)
    // Reordena
    integrantesCards.value.forEach((c, i) => { c.ordem = i + 1 })
    qtdIntegrantesInput.value = integrantesCards.value.length
    return
  }

  card.status = 'salvando'
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/integrantes-delete`, {
      method: 'POST',
      body:   { id_integrante: card.id_integrante },
    })
    integrantesCards.value.splice(index, 1)
    integrantesCards.value.forEach((c, i) => { c.ordem = i + 1 })
    qtdIntegrantesInput.value = integrantesCards.value.length
    showToast('Integrante removido.', { type: 'success' })
  } catch (e: any) {
    card.status = 'erro'
    card.confirmDelete = false
    showToast(e?.data?.statusMessage || 'Erro ao remover integrante', { type: 'error' })
  }
}

const integranteCardNome = (card: IntegranteCard): string => {
  const nome = (card.formData['membro_nome'] ?? '').trim()
  const sobrenome = (card.formData['membro_sobrenome'] ?? '').trim()
  if (nome || sobrenome) return `${nome} ${sobrenome}`.trim()
  return ''
}

const validateAceiteTermosForSubmit = (): boolean => {
  if (!aceiteTermos.value) {
    showToast('É necessário aceitar os termos para enviar a inscrição.', { type: 'error' })
    return false
  }
  return true
}

const finalizarCandidatura = async () => {
  if (!idCandidatura.value) return
  if (!validateAceiteTermosForSubmit()) return

  finalizandoCandidatura.value = true
  try {
    await $fetch(`/api/jnpta/form/${idCandidatura.value}/finalizar`, {
      method: 'POST',
      body: { aceite_termos: true },
    })

    showToast('Inscrição enviada com sucesso!', { type: 'success' })
    navigateTo('/processo_seletivo')
  } catch (e: any) {
    showToast(e?.data?.statusMessage || 'Erro ao finalizar candidatura', { type: 'error' })
  } finally {
    finalizandoCandidatura.value = false
  }
}

// ─── Watch tab changes → lazy-load perguntas ─────────────────────────────────
watch(activeTab, (newTab) => {
  if (newTab === 'endereco_empresa') {
    loadBlocoPerguntas('endereco_empresa')
  }
  if (newTab === 'documentos_empresa') {
    loadBlocoPerguntas('documentos_empresa')
  }
  if (newTab === 'documentos_projeto') {
    loadBlocoPerguntas('documentos_projeto')
  }
  if (newTab === 'direcao_artistica') {
    loadBlocoPerguntas('direcao_artistica')
  }
  if (newTab === 'integrantes') {
    loadIntegrantes()
  }
})

// ─── Validation for aba 2 ─────────────────────────────────────────────────────
const validateEnderecoForAdvance = (): boolean => {
  const slugsObrigatorios = perguntasEndereco.value
    .filter(p => p.obrigatorio)
    .map(p => p.slug)

  const faltantes = slugsObrigatorios.filter(slug => {
    const value = (formData.value[slug] ?? '').toString().trim()
    return value === ''
  })

  for (const slug of faltantes) {
    fieldState.value[slug] = 'error'
  }

  if (faltantes.length > 0) {
    showToast('Preencha os campos obrigatórios antes de avançar.', { type: 'error' })
    return false
  }

  const cep = (formData.value.endereco_cep ?? '').replace(/\D/g, '')
  if (cep.length > 0 && cep.length !== 8) {
    fieldState.value.endereco_cep = 'error'
    showToast('CEP inválido. Informe os 8 dígitos.', { type: 'error' })
    return false
  }

  return true
}

const validateDocumentosEmpresaForAdvance = (): boolean => {
  const obrigatorias = perguntasDocumentos.value.filter((p) => p.obrigatorio)

  const faltantes = obrigatorias.filter((p) => {
    if (p.tipo === 'arquivo') {
      return !uploadedFiles.value[p.slug]?.fileName
    }
    const value = (formData.value[p.slug] ?? '').toString().trim()
    return value === ''
  })

  for (const p of faltantes) {
    fieldState.value[p.slug] = 'error'
  }

  if (faltantes.length > 0) {
    showToast('Envie os documentos obrigatórios antes de avançar.', { type: 'error' })
    return false
  }

  return true
}

const validateDocumentosProjetoForAdvance = (): boolean => {
  const obrigatorias = perguntasDocumentosProjeto.value.filter((p) => p.obrigatorio)

  const faltantes = obrigatorias.filter((p) => {
    if (p.tipo === 'arquivo') {
      return !uploadedFiles.value[p.slug]?.fileName
    }
    const value = (formData.value[p.slug] ?? '').toString().trim()
    return value === ''
  })

  for (const p of faltantes) {
    fieldState.value[p.slug] = 'error'
  }

  if (faltantes.length > 0) {
    showToast('Envie os documentos obrigatórios antes de avançar.', { type: 'error' })
    return false
  }

  return true
}

const validateDirecaoArtisticaForAdvance = (): boolean => {
  const obrigatorias = perguntasDirecaoArtistica.value.filter((p) => p.obrigatorio)

  const faltantes = obrigatorias.filter((p) => {
    if (p.tipo === 'arquivo') {
      return !uploadedFiles.value[p.slug]?.fileName
    }
    const value = (formData.value[p.slug] ?? '').toString().trim()
    return value === ''
  })

  for (const p of faltantes) {
    fieldState.value[p.slug] = 'error'
  }

  if (faltantes.length > 0) {
    showToast('Preencha os dados da direção artística antes de avançar.', { type: 'error' })
    return false
  }

  const cep = (formData.value.cep ?? '').replace(/\D/g, '')
  if (cep.length > 0 && cep.length !== 8) {
    fieldState.value.cep = 'error'
    showToast('CEP inválido. Informe os 8 dígitos.', { type: 'error' })
    return false
  }

  const cpf = (formData.value.cpf ?? '').trim()
  if (cpf && !isValidCPF(cpf)) {
    fieldState.value.cpf = 'error'
    showToast('CPF inválido. Corrija antes de avançar.', { type: 'error' })
    return false
  }

  return true
}

const canAdvanceFromCurrentTab = (): boolean => {
  if (activeTab.value === 'dados_grupo') {
    return validateDadosGrupoForAdvance()
  }

  if (activeTab.value === 'endereco_empresa') {
    return validateEnderecoForAdvance()
  }

  if (activeTab.value === 'documentos_empresa') {
    return validateDocumentosEmpresaForAdvance()
  }

  if (activeTab.value === 'documentos_projeto') {
    return validateDocumentosProjetoForAdvance()
  }

  if (activeTab.value === 'direcao_artistica') {
    return validateDirecaoArtisticaForAdvance()
  }

  if (activeTab.value === 'integrantes') {
    if (integrantesCards.value.length === 0) {
      showToast('Adicione pelo menos um integrante.', { type: 'error' })
      return false
    }
    const pendentes = integrantesCards.value.filter(c => c.status !== 'salvo')
    if (pendentes.length > 0) {
      showToast(`Salve todos os integrantes antes de avançar (${pendentes.length} pendente${pendentes.length > 1 ? 's' : ''}).`, { type: 'error' })
      return false
    }
    return true
  }

  if (activeTab.value === 'aceite_termos') {
    return validateAceiteTermosForSubmit()
  }

  return true
}

onMounted(() => {
  fetchEdital()
  initForm()
})
</script>

<template>
  <NuxtLayout name="base">
    <div class="flex flex-col gap-8 pb-10">

      <!-- Loading -->
      <div v-if="loadingEdital || loadingForm" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>

      <!-- Content -->
      <template v-else-if="edital">

        <!-- Header -->
        <div class="bg-div-15 rounded-lg p-4 md:p-8 border border-secondary/10 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div class="relative z-10">
            <div class="mb-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                Jornada Paulista de Teatro
              </span>
            </div>
            <h1 class="text-xl md:text-3xl font-black text-text mb-2 md:mb-3 leading-tight">{{ edital.edital_titulo }}</h1>
            <p v-if="edital.edital_descricao" class="text-sm text-secondary mb-4">{{ edital.edital_descricao }}</p>
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

          <!-- Nome do grupo (contexto) -->
          <div v-if="nomeGrupo" class="flex items-center gap-2 mb-6">
            <span class="text-xs text-secondary uppercase font-bold tracking-wider">Grupo:</span>
            <span class="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded">{{ nomeGrupo }}</span>
          </div>

          <h2 class="text-xl font-black text-white mb-6">Formulário de Inscrição</h2>

          <!-- Tabs -->
          <div class="flex items-center gap-4 overflow-x-auto pb-4 mb-6 custom-scrollbar-x border-b border-secondary/10">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              @click="handleTabClick(tab.key)"
              class="whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 border"
              :class="activeTab === tab.key
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-background text-secondary border-secondary/10 hover:bg-div-15'"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Aba: Dados do Grupo (dinâmica) -->
          <div v-if="activeTab === 'dados_grupo'" class="space-y-4">

            <!-- Carregando perguntas -->
            <div v-if="perguntas.length === 0" class="text-center py-8">
              <p class="text-xs text-secondary">Carregando perguntas...</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="pergunta in perguntas"
                :key="pergunta.slug"
                class="relative"
                :class="getFieldGridClass(pergunta.slug)"
              >
                <!-- Label -->
                <label :for="`field-${pergunta.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  {{ pergunta.label }}
                  <span v-if="pergunta.obrigatorio" class="text-primary ml-0.5">*</span>
                </label>

                <!-- Input wrapper com indicador de estado -->
                <div class="relative">
                  <select
                    v-if="pergunta.slug === 'pt_genero'"
                    :id="`field-${pergunta.slug}`"
                    :value="formData[pergunta.slug] || ''"
                    class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                    :class="{
                      'border-secondary/10 focus:ring-2 focus:ring-primary/20': fieldState[pergunta.slug] === 'idle',
                      'border-primary/40 animate-pulse': fieldState[pergunta.slug] === 'saving',
                      'border-green-500/40': fieldState[pergunta.slug] === 'saved',
                      'border-red-500/40': fieldState[pergunta.slug] === 'error',
                    }"
                    @change="(e: Event) => { formData[pergunta.slug] = (e.target as HTMLSelectElement).value; handleFieldBlur(pergunta.slug) }"
                  >
                    <option value="" disabled>Selecione</option>
                    <option
                      v-for="opt in getRadioOptions(pergunta)"
                      :key="`${pergunta.slug}-${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>

                  <!-- Texto / email / telefone / número / link / data -->
                  <input
                    v-else-if="pergunta.tipo !== 'radio' && pergunta.tipo !== 'boolean'"
                    :id="`field-${pergunta.slug}`"
                    v-model="formData[pergunta.slug]"
                    :type="getInputType(pergunta.tipo)"
                    :required="pergunta.obrigatorio"
                    :maxlength="pergunta.slug === 'cnpj_empresa' ? 18 : undefined"
                    :placeholder="pergunta.tipo === 'telefone' ? '(00) 00000-0000' : pergunta.tipo === 'email' ? 'seu@email.com' : ''"
                    class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none pr-10 transition-colors"
                    :class="{
                      'border-secondary/10 focus:ring-2 focus:ring-primary/20': fieldState[pergunta.slug] === 'idle',
                      'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse': fieldState[pergunta.slug] === 'saving',
                      'border-green-500/40 focus:ring-2 focus:ring-green-500/20': fieldState[pergunta.slug] === 'saved',
                      'border-red-500/40 focus:ring-2 focus:ring-red-500/20': fieldState[pergunta.slug] === 'error',
                    }"
                    @input="handleFieldInput(pergunta.slug)"
                    @blur="handleFieldBlur(pergunta.slug)"
                  />

                  <p
                    v-if="pergunta.slug === 'cnpj_empresa' && getCnpjStatus(pergunta.slug) !== 'empty'"
                    class="text-xs mt-1 font-bold"
                    :class="getCnpjStatus(pergunta.slug) === 'valid' ? 'text-green-400' : 'text-red-400'"
                  >
                    {{ getCnpjStatus(pergunta.slug) === 'valid' ? 'CNPJ válido' : 'CNPJ inválido' }}
                  </p>

                  <!-- Radio -->
                  <div
                    v-else-if="pergunta.tipo === 'radio' && Array.isArray(pergunta.opcoes)"
                    class="flex flex-wrap gap-2 mt-1"
                  >
                    <label
                      v-for="opcao in pergunta.opcoes"
                      :key="opcao"
                      class="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        :name="`field-${pergunta.slug}`"
                        :value="opcao"
                        v-model="formData[pergunta.slug]"
                        class="text-primary focus:ring-primary"
                        @change="handleFieldBlur(pergunta.slug)"
                      />
                      <span class="text-sm text-secondary">{{ opcao }}</span>
                    </label>
                  </div>

                  <!-- Boolean (checkbox) -->
                  <div v-else-if="pergunta.tipo === 'boolean'" class="flex items-center gap-3 mt-1">
                    <input
                      :id="`field-${pergunta.slug}`"
                      type="checkbox"
                      :checked="formData[pergunta.slug] === 'true'"
                      class="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
                      @change="(e: Event) => { formData[pergunta.slug] = (e.target as HTMLInputElement).checked ? 'true' : 'false'; handleFieldBlur(pergunta.slug) }"
                    />
                    <span class="text-sm text-secondary">{{ pergunta.label }}</span>
                  </div>

                  <!-- Estado indicator (canto direito) -->
                  <div
                    v-if="pergunta.slug !== 'pt_genero' && pergunta.tipo !== 'radio' && pergunta.tipo !== 'boolean'"
                    class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <!-- Saving spinner -->
                    <svg v-if="fieldState[pergunta.slug] === 'saving'" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <!-- Saved check -->
                    <svg v-else-if="fieldState[pergunta.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <!-- Error X -->
                    <svg v-else-if="fieldState[pergunta.slug] === 'error'" class="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aba: Endereço Empresa -->
          <div v-else-if="activeTab === 'endereco_empresa'" class="space-y-4">

            <!-- Loading bloco -->
            <div v-if="loadingBloco" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>

            <template v-else>
              <!-- Região Administrativa (full width select) -->
              <div
                v-for="p in perguntasEndereco.filter(p => p.slug === 'regiao_administrativa')"
                :key="p.slug"
                class="relative"
              >
                <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  {{ p.label }}
                  <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                </label>
                <select
                  :id="`field-${p.slug}`"
                  v-model="formData[p.slug]"
                  class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  :class="{
                    'border-secondary/10 focus:ring-2 focus:ring-primary/20': fieldState[p.slug] === 'idle',
                    'border-primary/40 animate-pulse': fieldState[p.slug] === 'saving',
                    'border-green-500/40': fieldState[p.slug] === 'saved',
                    'border-red-500/40': fieldState[p.slug] === 'error',
                  }"
                  @change="handleFieldBlur(p.slug)"
                >
                  <option value="" disabled>Selecione a Região Administrativa</option>
                  <option
                    v-for="opt in getSelectOptions(p.opcoes)"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- Grid 2 colunas para os demais campos -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                <!-- CEP (col 1) -->
                <div
                  v-for="p in perguntasEndereco.filter(p => p.slug === 'endereco_cep')"
                  :key="p.slug"
                  class="relative"
                >
                  <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                    {{ p.label }}
                    <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                  </label>
                  <div class="relative">
                    <input
                      :id="`field-${p.slug}`"
                      v-model="formData[p.slug]"
                      type="text"
                      maxlength="9"
                      placeholder="00000-000"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none pr-10 transition-colors"
                      :class="{
                        'border-secondary/10 focus:ring-2 focus:ring-primary/20': fieldState[p.slug] === 'idle',
                        'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse': fieldState[p.slug] === 'saving',
                        'border-green-500/40 focus:ring-2 focus:ring-green-500/20': fieldState[p.slug] === 'saved',
                        'border-red-500/40 focus:ring-2 focus:ring-red-500/20': fieldState[p.slug] === 'error',
                      }"
                      @blur="handleCepBlur"
                    />
                    <!-- CEP spinner -->
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg v-if="loadingCep" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'error'" class="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Cidade (col 2, readonly se preenchida pelo CEP) -->
                <div
                  v-for="p in perguntasEndereco.filter(p => p.slug === 'endereco_cidade')"
                  :key="p.slug"
                  class="relative"
                >
                  <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                    {{ p.label }}
                    <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                    <span v-if="lockedAddressFields.has(p.slug)" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(preenchido pelo CEP)</span>
                  </label>
                  <div class="relative">
                    <input
                      :id="`field-${p.slug}`"
                      v-model="formData[p.slug]"
                      type="text"
                      :readonly="lockedAddressFields.has(p.slug)"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm focus:outline-none pr-10 transition-colors"
                      :class="[
                        lockedAddressFields.has(p.slug) ? 'text-secondary/70 cursor-not-allowed' : 'text-white',
                        fieldState[p.slug] === 'idle' ? 'border-secondary/10 focus:ring-2 focus:ring-primary/20' : '',
                        fieldState[p.slug] === 'saving' ? 'border-primary/40 animate-pulse' : '',
                        fieldState[p.slug] === 'saved' ? 'border-green-500/40' : '',
                        fieldState[p.slug] === 'error' ? 'border-red-500/40' : '',
                      ]"
                      @blur="!lockedAddressFields.has(p.slug) && handleFieldBlur(p.slug)"
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <!-- Lock icon -->
                      <svg v-if="lockedAddressFields.has(p.slug)" class="w-4 h-4 text-secondary/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saving'" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Endereço / Logradouro (col 1, readonly se preenchido pelo CEP) -->
                <div
                  v-for="p in perguntasEndereco.filter(p => p.slug === 'endereco_logradouro')"
                  :key="p.slug"
                  class="relative"
                >
                  <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                    {{ p.label }}
                    <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                    <span v-if="lockedAddressFields.has(p.slug)" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(preenchido pelo CEP)</span>
                  </label>
                  <div class="relative">
                    <input
                      :id="`field-${p.slug}`"
                      v-model="formData[p.slug]"
                      type="text"
                      :readonly="lockedAddressFields.has(p.slug)"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm focus:outline-none pr-10 transition-colors"
                      :class="[
                        lockedAddressFields.has(p.slug) ? 'text-secondary/70 cursor-not-allowed' : 'text-white',
                        fieldState[p.slug] === 'idle' ? 'border-secondary/10 focus:ring-2 focus:ring-primary/20' : '',
                        fieldState[p.slug] === 'saving' ? 'border-primary/40 animate-pulse' : '',
                        fieldState[p.slug] === 'saved' ? 'border-green-500/40' : '',
                        fieldState[p.slug] === 'error' ? 'border-red-500/40' : '',
                      ]"
                      @blur="!lockedAddressFields.has(p.slug) && handleFieldBlur(p.slug)"
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg v-if="lockedAddressFields.has(p.slug)" class="w-4 h-4 text-secondary/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saving'" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Bairro (col 2, readonly preenchido pelo CEP) -->
                <div
                  v-for="p in perguntasEndereco.filter(p => p.slug === 'endereco_bairro')"
                  :key="p.slug"
                  class="relative"
                >
                  <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                    {{ p.label }}
                    <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                    <span v-if="lockedAddressFields.has(p.slug)" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(preenchido pelo CEP)</span>
                  </label>
                  <div class="relative">
                    <input
                      :id="`field-${p.slug}`"
                      v-model="formData[p.slug]"
                      type="text"
                      :readonly="lockedAddressFields.has(p.slug)"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm focus:outline-none pr-10 transition-colors"
                      :class="[
                        lockedAddressFields.has(p.slug) ? 'text-secondary/70 cursor-not-allowed' : 'text-white',
                        fieldState[p.slug] === 'idle' ? 'border-secondary/10 focus:ring-2 focus:ring-primary/20' : '',
                        fieldState[p.slug] === 'saving' ? 'border-primary/40 animate-pulse' : '',
                        fieldState[p.slug] === 'saved' ? 'border-green-500/40' : '',
                        fieldState[p.slug] === 'error' ? 'border-red-500/40' : '',
                      ]"
                      @blur="!lockedAddressFields.has(p.slug) && handleFieldBlur(p.slug)"
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg v-if="lockedAddressFields.has(p.slug)" class="w-4 h-4 text-secondary/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saving'" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Número (col 1) -->
                <div
                  v-for="p in perguntasEndereco.filter(p => p.slug === 'endereco_numero')"
                  :key="p.slug"
                  class="relative"
                >
                  <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                    {{ p.label }}
                    <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                  </label>
                  <div class="relative">
                    <input
                      :id="`field-${p.slug}`"
                      v-model="formData[p.slug]"
                      type="text"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none pr-10 transition-colors"
                      :class="{
                        'border-secondary/10 focus:ring-2 focus:ring-primary/20': fieldState[p.slug] === 'idle',
                        'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse': fieldState[p.slug] === 'saving',
                        'border-green-500/40 focus:ring-2 focus:ring-green-500/20': fieldState[p.slug] === 'saved',
                        'border-red-500/40 focus:ring-2 focus:ring-red-500/20': fieldState[p.slug] === 'error',
                      }"
                      @blur="handleFieldBlur(p.slug)"
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg v-if="fieldState[p.slug] === 'saving'" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'error'" class="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Complemento (col 2) -->
                <div
                  v-for="p in perguntasEndereco.filter(p => p.slug === 'endereco_complemento')"
                  :key="p.slug"
                  class="relative"
                >
                  <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                    {{ p.label }}
                    <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                  </label>
                  <div class="relative">
                    <input
                      :id="`field-${p.slug}`"
                      v-model="formData[p.slug]"
                      type="text"
                      class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none pr-10 transition-colors"
                      :class="{
                        'border-secondary/10 focus:ring-2 focus:ring-primary/20': fieldState[p.slug] === 'idle',
                        'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse': fieldState[p.slug] === 'saving',
                        'border-green-500/40 focus:ring-2 focus:ring-green-500/20': fieldState[p.slug] === 'saved',
                        'border-red-500/40 focus:ring-2 focus:ring-red-500/20': fieldState[p.slug] === 'error',
                      }"
                      @blur="handleFieldBlur(p.slug)"
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg v-if="fieldState[p.slug] === 'saving'" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else-if="fieldState[p.slug] === 'error'" class="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>
            </template>
          </div>

          <!-- Aba: Documentos Empresa / Projeto -->
          <div v-else-if="activeTab === 'documentos_empresa' || activeTab === 'documentos_projeto'" class="space-y-4">

            <div v-if="loadingBloco" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="p in (activeTab === 'documentos_empresa' ? perguntasDocumentos : perguntasDocumentosProjeto)"
                :key="p.slug"
                class="relative"
              >
                <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  {{ p.label }}
                  <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                </label>

                <div v-if="p.tipo === 'arquivo'">
                  <div
                    class="relative border-2 border-dashed border-secondary/20 rounded-lg p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer"
                    @click="triggerFileUpload(p.slug)"
                  >
                    <input
                      :id="`file-${p.slug}`"
                      type="file"
                      class="hidden"
                      :disabled="uploadingFiles.has(p.slug)"
                      accept="application/pdf,image/jpeg,image/png,image/jpg"
                      @change="(e) => handleFileSelect(e, p.slug)"
                    />

                    <div v-if="!uploadedFiles[p.slug]?.fileName" class="flex flex-col items-center gap-2">
                      <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      </div>
                      <p class="text-xs font-bold text-secondary tracking-tight">
                        {{ uploadingFiles.has(p.slug) ? 'Enviando arquivo...' : 'Clique ou arraste para enviar arquivo' }}
                      </p>
                      <p class="text-[10px] text-secondary/40">PDF, JPG, PNG (Max 4MB)</p>
                    </div>

                    <div v-else class="flex flex-col items-center gap-2 py-2 w-full">
                      <div v-if="!confirmDeleteFiles.has(p.slug)" class="w-full flex flex-col items-center gap-2">
                        <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1">
                          <svg class="w-6 h-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                        </div>
                        <p class="text-xs font-bold text-text truncate max-w-full px-4">{{ uploadedFiles[p.slug]?.originalName }}</p>
                        <button
                          type="button"
                          class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
                          @click.stop="showConfirmDeleteFile(p.slug)"
                          :disabled="fieldState[p.slug] === 'saving'"
                        >
                          {{ fieldState[p.slug] === 'saving' ? 'Removendo...' : 'Remover arquivo' }}
                        </button>
                      </div>

                      <div v-else class="w-full bg-div-15 border border-secondary/10 rounded-lg p-4 flex flex-col items-center gap-3">
                        <p class="text-sm font-bold text-text">Tem certeza que deseja remover este arquivo?</p>
                        <div class="flex gap-3">
                          <button
                            type="button"
                            class="bg-danger text-white font-bold py-2 px-4 rounded-lg text-xs"
                            @click.stop="handleFileRemove(p.slug)"
                            :disabled="fieldState[p.slug] === 'saving'"
                          >
                            {{ fieldState[p.slug] === 'saving' ? 'Removendo...' : 'Sim, remover' }}
                          </button>
                          <button
                            type="button"
                            class="bg-background border border-secondary/10 text-secondary font-bold py-2 px-4 rounded-lg text-xs"
                            @click.stop="cancelConfirmDeleteFile(p.slug)"
                            :disabled="fieldState[p.slug] === 'saving'"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="relative">
                  <input
                    :id="`field-${p.slug}`"
                    v-model="formData[p.slug]"
                    :type="getInputType(p.tipo)"
                    class="w-full bg-background border rounded-md px-4 py-3 text-sm text-white focus:outline-none pr-10 transition-colors"
                    :class="{
                      'border-secondary/10 focus:ring-2 focus:ring-primary/20': fieldState[p.slug] === 'idle',
                      'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse': fieldState[p.slug] === 'saving',
                      'border-green-500/40 focus:ring-2 focus:ring-green-500/20': fieldState[p.slug] === 'saved',
                      'border-red-500/40 focus:ring-2 focus:ring-red-500/20': fieldState[p.slug] === 'error',
                    }"
                    @blur="handleFieldBlur(p.slug)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Aba: Direção Artística -->
          <div v-else-if="activeTab === 'direcao_artistica'" class="space-y-4">

            <div v-if="loadingBloco" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="p in perguntasDirecaoArtistica"
                :key="p.slug"
                class="relative"
                :class="getDirecaoGridClass(p.slug)"
              >
                <label :for="`field-${p.slug}`" class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                  {{ p.label }}
                  <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                  <span v-if="p.slug === 'email'" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(vinculado ao login)</span>
                  <span v-else-if="lockedDirecaoFields.has(p.slug)" class="ml-1 text-secondary/50 font-normal normal-case tracking-normal">(preenchido pelo CEP)</span>
                </label>

                <div v-if="p.tipo === 'arquivo'">
                  <div
                    class="relative border-2 border-dashed border-secondary/20 rounded-lg p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer"
                    @click="triggerFileUpload(p.slug)"
                  >
                    <input
                      :id="`file-${p.slug}`"
                      type="file"
                      class="hidden"
                      :disabled="uploadingFiles.has(p.slug)"
                      accept="application/pdf,image/jpeg,image/png,image/jpg"
                      @change="(e) => handleFileSelect(e, p.slug)"
                    />

                    <div v-if="!uploadedFiles[p.slug]?.fileName" class="flex flex-col items-center gap-2">
                      <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      </div>
                      <p class="text-xs font-bold text-secondary tracking-tight">
                        {{ uploadingFiles.has(p.slug) ? 'Enviando arquivo...' : 'Clique ou arraste para enviar arquivo' }}
                      </p>
                      <p class="text-[10px] text-secondary/40">PDF, JPG, PNG (Max 4MB)</p>
                    </div>

                    <div v-else class="flex flex-col items-center gap-2 py-2 w-full">
                      <div v-if="!confirmDeleteFiles.has(p.slug)" class="w-full flex flex-col items-center gap-2">
                        <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1">
                          <svg class="w-6 h-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                        </div>
                        <p class="text-xs font-bold text-text truncate max-w-full px-4">{{ uploadedFiles[p.slug]?.originalName }}</p>
                        <button
                          type="button"
                          class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
                          @click.stop="showConfirmDeleteFile(p.slug)"
                          :disabled="fieldState[p.slug] === 'saving'"
                        >
                          {{ fieldState[p.slug] === 'saving' ? 'Removendo...' : 'Remover arquivo' }}
                        </button>
                      </div>

                      <div v-else class="w-full bg-div-15 border border-secondary/10 rounded-lg p-4 flex flex-col items-center gap-3">
                        <p class="text-sm font-bold text-text">Tem certeza que deseja remover este arquivo?</p>
                        <div class="flex gap-3">
                          <button
                            type="button"
                            class="bg-danger text-white font-bold py-2 px-4 rounded-lg text-xs"
                            @click.stop="handleFileRemove(p.slug)"
                            :disabled="fieldState[p.slug] === 'saving'"
                          >
                            {{ fieldState[p.slug] === 'saving' ? 'Removendo...' : 'Sim, remover' }}
                          </button>
                          <button
                            type="button"
                            class="bg-background border border-secondary/10 text-secondary font-bold py-2 px-4 rounded-lg text-xs"
                            @click.stop="cancelConfirmDeleteFile(p.slug)"
                            :disabled="fieldState[p.slug] === 'saving'"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="p.tipo === 'radio'" class="flex flex-wrap gap-2 mt-1">
                  <label
                    v-for="opt in getRadioOptions(p)"
                    :key="opt.value"
                    class="flex items-center gap-3 p-3 rounded-md border border-secondary/10 bg-div-15 cursor-pointer hover:bg-div-30 transition-colors group"
                  >
                    <input
                      type="radio"
                      :name="`field-${p.slug}`"
                      :value="opt.value"
                      v-model="formData[p.slug]"
                      class="w-4 h-4 text-primary border-secondary/30 focus:ring-primary bg-background"
                      @change="handleFieldBlur(p.slug)"
                    />
                    <span class="text-sm font-bold text-secondary group-hover:text-text transition-colors">
                      {{ opt.label }}
                    </span>
                  </label>
                </div>

                <div v-else class="relative">
                  <input
                    :id="`field-${p.slug}`"
                    v-model="formData[p.slug]"
                    :type="getInputType(p.tipo)"
                    :readonly="isDirecaoReadOnlyField(p.slug)"
                    :maxlength="p.slug === 'cpf' ? 14 : (p.tipo === 'telefone' ? 15 : undefined)"
                    :placeholder="p.slug === 'cpf' ? '000.000.000-00' : (p.tipo === 'telefone' ? '(00) 00000-0000' : '')"
                    class="w-full bg-background border rounded-md px-4 py-3 text-sm focus:outline-none pr-10 transition-colors"
                    :class="[
                      isDirecaoReadOnlyField(p.slug) ? 'text-secondary/70 cursor-not-allowed' : 'text-white',
                      fieldState[p.slug] === 'idle' ? 'border-secondary/10 focus:ring-2 focus:ring-primary/20' : '',
                      fieldState[p.slug] === 'saving' ? 'border-primary/40 focus:ring-2 focus:ring-primary/30 animate-pulse' : '',
                      fieldState[p.slug] === 'saved' ? 'border-green-500/40 focus:ring-2 focus:ring-green-500/20' : '',
                      fieldState[p.slug] === 'error' ? 'border-red-500/40 focus:ring-2 focus:ring-red-500/20' : '',
                    ]"
                    @input="handleFieldInput(p.slug)"
                    @blur="p.slug === 'cep' ? handleDirecaoCepBlur() : (!isDirecaoReadOnlyField(p.slug) && handleFieldBlur(p.slug))"
                  />

                  <p
                    v-if="p.slug === 'cpf' && getCpfStatus(p.slug) !== 'empty'"
                    class="text-xs mt-1 font-bold"
                    :class="getCpfStatus(p.slug) === 'valid' ? 'text-green-400' : 'text-red-400'"
                  >
                    {{ getCpfStatus(p.slug) === 'valid' ? 'CPF válido' : 'CPF inválido' }}
                  </p>

                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg v-if="p.slug === 'cep' && loadingCepDirecao" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <svg v-else-if="isDirecaoReadOnlyField(p.slug)" class="w-4 h-4 text-secondary/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else-if="fieldState[p.slug] === 'saving'" class="w-4 h-4 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <svg v-else-if="fieldState[p.slug] === 'saved'" class="w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else-if="fieldState[p.slug] === 'error'" class="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aba: Integrantes -->
          <div v-else-if="activeTab === 'integrantes'" class="space-y-6">

            <div v-if="loadingIntegrantes" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>

            <template v-else>
              <!-- Cabeçalho: botão adicionar -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-black text-white">Integrantes do Grupo</p>
                  <p class="text-xs text-secondary mt-0.5">
                    {{ integrantesCards.length }} integrante{{ integrantesCards.length !== 1 ? 's' : '' }} adicionado{{ integrantesCards.length !== 1 ? 's' : '' }}
                  </p>
                </div>
                <button
                  type="button"
                  @click="addIntegranteCard"
                  class="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 px-4 rounded-lg text-sm transition-colors border border-primary/20"
                >
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Adicionar integrante
                </button>
              </div>

              <!-- Aviso se nenhum integrante -->
              <div v-if="integrantesCards.length === 0" class="bg-background border border-dashed border-secondary/20 rounded-lg p-8 text-center">
                <p class="text-sm text-secondary">Nenhum integrante adicionado. Clique em "Adicionar integrante" para começar.</p>
              </div>

              <!-- Cards dos integrantes -->
              <div
                v-for="(card, idx) in integrantesCards"
                :key="idx"
                class="rounded-xl border transition-all duration-200"
                :class="{
                  'border-green-500/40 bg-green-500/5': card.status === 'salvo',
                  'border-red-500/40 bg-red-500/5':    card.status === 'erro',
                  'border-primary/30 bg-primary/5':    card.status === 'salvando',
                  'border-secondary/10 bg-div-15':     card.status === 'pendente',
                }"
              >
                <!-- Header do card (accordion toggle) -->
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-5 py-4 text-left"
                  @click="card.isOpen = !card.isOpen"
                >
                  <div class="flex items-center gap-3">
                    <!-- Ordem badge -->
                    <span
                      class="flex items-center justify-center w-7 h-7 rounded-full text-xs font-black"
                      :class="{
                        'bg-green-500/20 text-green-400':  card.status === 'salvo',
                        'bg-red-500/20 text-red-400':      card.status === 'erro',
                        'bg-primary/20 text-primary':      card.status === 'salvando' || card.status === 'pendente',
                      }"
                    >{{ idx + 1 }}</span>

                    <div>
                      <p class="text-sm font-bold text-white">
                        Integrante {{ idx + 1 }}
                        <span v-if="integranteCardNome(card)" class="text-secondary font-normal ml-1">— {{ integranteCardNome(card) }}</span>
                      </p>
                      <p class="text-[10px] text-secondary/60 mt-0.5">
                        <span v-if="card.status === 'salvo'" class="text-green-400 font-bold">✓ Salvo</span>
                        <span v-else-if="card.status === 'erro'"  class="text-red-400 font-bold">Erro ao salvar</span>
                        <span v-else-if="card.status === 'salvando'" class="text-primary font-bold">Salvando...</span>
                        <span v-else class="text-yellow-400/80 font-bold">Pendente</span>
                      </p>
                    </div>
                  </div>

                  <!-- Chevron -->
                  <svg
                    class="w-4 h-4 text-secondary transition-transform duration-200"
                    :class="card.isOpen ? 'rotate-180' : ''"
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>

                <!-- Conteúdo accordion -->
                <div v-if="card.isOpen" class="px-5 pb-5 space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      v-for="p in perguntasIntegrantes"
                      :key="p.slug"
                      class="relative"
                      :class="(p.slug === 'membro_redes_sociais' || p.slug === 'membro_email' || p.slug === 'membro_funcao' || p.slug === 'pcd') ? 'md:col-span-2' : ''"
                    >
                      <label class="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">
                        {{ p.label }}
                        <span v-if="p.obrigatorio" class="text-primary ml-0.5">*</span>
                        <span v-if="p.slug === 'membro_cpf' && card.formData['membro_cpf']?.trim()" class="ml-2 font-normal normal-case tracking-normal"
                          :class="isValidCPF(card.formData['membro_cpf']) ? 'text-green-400' : 'text-red-400'">
                          {{ isValidCPF(card.formData['membro_cpf']) ? '✓ válido' : '✗ inválido' }}
                        </span>
                      </label>

                      <!-- Radio (pcd) -->
                      <div v-if="p.tipo === 'radio'" class="flex gap-3 flex-wrap mt-1">
                        <label
                          v-for="opt in getRadioOptions(p)"
                          :key="opt.value"
                          class="flex items-center gap-2 p-3 rounded-md border border-secondary/10 bg-background cursor-pointer hover:bg-div-15 transition-colors"
                        >
                          <input
                            type="radio"
                            :name="`integrante-${idx}-${p.slug}`"
                            :value="opt.value"
                            v-model="card.formData[p.slug]"
                            class="w-4 h-4 text-primary border-secondary/30 focus:ring-primary bg-background"
                          />
                          <span class="text-sm font-bold text-secondary">{{ opt.label }}</span>
                        </label>
                      </div>

                      <!-- Text / email / tel -->
                      <input
                        v-else
                        v-model="card.formData[p.slug]"
                        :type="getInputType(p.tipo)"
                        :placeholder="p.slug === 'membro_cpf' ? '000.000.000-00' : p.tipo === 'telefone' ? '(00) 00000-0000' : p.tipo === 'email' ? 'email@exemplo.com' : ''"
                        :maxlength="p.slug === 'membro_cpf' ? 14 : (p.tipo === 'telefone' ? 15 : undefined)"
                        class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        @input="
                          p.slug === 'membro_cpf'
                            ? (card.formData[p.slug] = formatCPF(card.formData[p.slug] ?? ''))
                            : p.tipo === 'telefone'
                              ? (card.formData[p.slug] = formatPhoneBR(card.formData[p.slug] ?? ''))
                              : null
                        "
                      />
                    </div>
                  </div>

                  <!-- Ações do card -->
                  <div class="flex items-center justify-between pt-3 border-t border-secondary/10">

                    <!-- Confirmar delete inline -->
                    <div v-if="card.confirmDelete" class="flex items-center gap-3">
                      <p class="text-xs text-text font-bold">Remover este integrante?</p>
                      <button
                        type="button"
                        class="bg-danger text-white font-bold py-1.5 px-3 rounded text-xs"
                        :disabled="card.status === 'salvando'"
                        @click="deleteIntegranteCard(idx)"
                      >
                        {{ card.status === 'salvando' ? 'Removendo...' : 'Sim, remover' }}
                      </button>
                      <button
                        type="button"
                        class="bg-background border border-secondary/10 text-secondary font-bold py-1.5 px-3 rounded text-xs"
                        @click="cancelDeleteIntegranteCard(idx)"
                      >
                        Cancelar
                      </button>
                    </div>

                    <button
                      v-else
                      type="button"
                      class="text-xs font-black uppercase tracking-widest text-secondary/60 hover:text-red-400 transition-colors"
                      @click="confirmDeleteIntegranteCard(idx)"
                    >
                      Remover
                    </button>

                    <!-- Salvar -->
                    <button
                      type="button"
                      :disabled="card.status === 'salvando'"
                      class="flex items-center gap-2 font-bold py-2 px-5 rounded-lg text-sm transition-colors"
                      :class="
                        card.status === 'salvo'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                          : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
                      "
                      @click="saveIntegranteCard(idx)"
                    >
                      <svg v-if="card.status === 'salvando'" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <svg v-else-if="card.status === 'salvo'" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      {{
                        card.status === 'salvando' ? 'Salvando...' :
                        card.status === 'salvo'    ? 'Salvo ✓' :
                        'Salvar integrante'
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Aba: Aceite Termos -->
          <div v-else-if="activeTab === 'aceite_termos'" class="space-y-6">
            <div class="bg-background border border-secondary/10 rounded-xl p-6 md:p-8 space-y-6">
              <div>
                <h3 class="text-lg md:text-xl font-black text-white mb-2">Aceite dos Termos</h3>
                <p class="text-sm text-secondary">
                  Leia com atenção os termos abaixo. Após marcar o aceite, o envio final da inscrição ficará disponível.
                </p>
              </div>

              <div class="max-h-[440px] overflow-y-auto pr-2 custom-scrollbar-y text-sm leading-7 text-secondary space-y-5">
                <p>
                  Neste ato o(a) Inscrito(a) por si próprio quando pessoa física maior de 18 (dezoito) anos ou emancipado e totalmente capaz de praticar os atos da vida civil, ou a representante legal de pessoa menor de idade, ou a representante legal de pessoa absolutamente ou relativamente incapaz, declara:
                </p>

                <div>
                  <p class="font-black text-white uppercase tracking-wide mb-2">Dados coletados</p>
                  <p>
                    Os dados coletados nesta ficha de matrícula são tratados nos termos da Lei Geral de Proteção de Dados e serão utilizados exclusivamente pela Associação Pró-Dança, conforme política de privacidade da instituição. Ao realizar esta matrícula o(a) candidato(a) ou o(a) responsável legal do candidato(a), ou da pessoa com idade menor de 18 anos, declara que leu e concorda com os termos vigentes.
                  </p>
                </div>

                <div>
                  <p class="font-black text-white uppercase tracking-wide mb-2">Condições de saúde</p>
                  <p>
                    Garante que o INSCRITO está em plenas condições de saúde e apto a realizar todas e quaisquer atividades físicas e, ainda, não portar nenhuma moléstia contagiosa, que possa prejudicar os demais frequentadores da atividade. Fica a ASSOCIAÇÃO PRÓ-DANÇA, desde já, isenta de toda e qualquer responsabilidade relacionada a eventuais problemas de saúde que o INSCRITO venha a sentir, contrair ou sofrer durante a permanência no local indicado para a atividade pela ASSOCIAÇÃO PRÓ-DANÇA, incluindo, mas não se limitando a quaisquer tipos de lesões e acidentes físicos em razão das circunstâncias acima apontadas.
                  </p>
                </div>

                <div>
                  <p class="font-black text-white uppercase tracking-wide mb-2">Responsabilidade sobre atos ou danos</p>
                  <p>
                    Assume a responsabilidade por quaisquer atos ou danos causados pelo INSCRITO à ASSOCIAÇÃO PRÓ-DANÇA e/ou a terceiros, comprometendo-se a isentar a ASSOCIAÇÃO PRÓ-DANÇA, seus dirigentes, empregados e prepostos, do pagamento de quaisquer danos, perdas ou lucros cessantes, obrigações, despesas e obrigações de qualquer natureza.
                  </p>
                </div>

                <div>
                  <p class="font-black text-white uppercase tracking-wide mb-2">Saída da atividade</p>
                  <p>
                    Concorda que durante ou após o encerramento da atividade, a ASSOCIAÇÃO PRÓ-DANÇA não será responsável por quaisquer fatos ocorridos no trajeto até o local de realização da atividade ou no trajeto de retorno do INSCRITO.
                  </p>
                </div>

                <div>
                  <p class="font-black text-white uppercase tracking-wide mb-2">Autorização de imagem e voz</p>
                  <p>
                    Autoriza a utilização, fixação, reprodução, edição, reedição, distribuição, divulgação, exibição, veiculação, transmissão e retransmissão da imagem do INSCRITO (incluindo o som da voz) eventualmente captadas e editadas pela ASSOCIAÇÃO PRÓ-DANÇA, de modo que neste ato, cede, transfere e autoriza à ASSOCIAÇÃO PRÓ-DANÇA, a título gratuito, não exclusivo, universal e por prazo indefinido, o uso da imagem do INSCRITO (incluindo o som da voz) e de personalidade, a serem utilizados em obra, conforme previsão legal aplicável, em conjunto ou individualmente com as demais obras previstas na Lei de Direitos Autorais (uso sincronizado da imagem e do som da voz), podendo, dessa forma, a ASSOCIAÇÃO PRÓ-DANÇA usar, gozar, fruir e dispor das imagens (incluindo o som da voz) e das obras sincronizadas, segundo seus próprios critérios, no total ou em parte, sem limitação de tempo, exemplares e quantidades de exibição, inclusive por quaisquer terceiros indicados pela ASSOCIAÇÃO PRÓ-DANÇA, no Brasil e/ou no exterior, em todas e quaisquer mídias à disposição.
                  </p>
                </div>
              </div>

              <label class="flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer"
                :class="aceiteTermos ? 'border-primary/40 bg-primary/5' : 'border-secondary/10 bg-div-15 hover:bg-div-30'">
                <button
                  type="button"
                  class="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  :class="aceiteTermos ? 'border-primary bg-primary text-white' : 'border-secondary/30 bg-background text-transparent'"
                  @click="aceiteTermos = !aceiteTermos"
                  aria-label="Aceitar termos"
                >
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>

                <div>
                  <p class="text-sm font-bold text-white">Declaro que li e concordo com os termos acima.</p>
                  <p class="text-xs text-secondary mt-1">
                    O envio final da inscrição só será realizado após a confirmação deste aceite.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Demais abas (próximas etapas) -->
          <div v-else class="bg-background border border-secondary/10 rounded-lg p-6 text-center">
            <p class="text-sm font-bold text-white mb-2">{{ tabs.find(t => t.key === activeTab)?.label }}</p>
            <p class="text-xs text-secondary">Esta aba será implementada na próxima etapa.</p>
          </div>

          <!-- Footer navigation -->
          <div class="flex flex-col-reverse md:flex-row gap-3 pt-6 mt-6 border-t border-secondary/10">
            <button
              type="button"
              @click="navigateTo('/processo_seletivo')"
              class="w-full md:w-auto bg-background border border-secondary/10 text-secondary hover:text-white font-bold py-3 px-6 rounded-lg text-sm uppercase tracking-wider transition-colors"
            >
              Voltar
            </button>
            <div class="flex-1"></div>
            <button
              v-if="activeTab !== 'aceite_termos'"
              type="button"
              @click="handleAdvanceTab"
              class="w-full md:w-auto bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg text-sm uppercase tracking-wider transition-colors shadow-lg shadow-primary/20"
            >
              Próxima aba →
            </button>

            <button
              v-else
              type="button"
              @click="finalizarCandidatura"
              :disabled="finalizandoCandidatura || !aceiteTermos"
              class="w-full md:w-auto font-bold py-3 px-6 rounded-lg text-sm uppercase tracking-wider transition-colors"
              :class="[
                finalizandoCandidatura || !aceiteTermos
                  ? 'bg-secondary/20 text-secondary/50 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20'
              ]"
            >
              {{ finalizandoCandidatura ? 'Enviando...' : 'Enviar inscrição' }}
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

.custom-scrollbar-y::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar-y::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar-y::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.custom-scrollbar-y::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
