<script setup lang="ts">
definePageMeta({
  layout: 'wide'
})

import ModalPergunta from '../components/ModalPergunta.vue'
import { useAppStore } from '../../stores/app'
import { useToast } from '~/composables/useToast'
import { CEP_DEPENDENT_FIELDS } from '../utils/viacep'

interface Pergunta {
  id: string
  id_entidade: string | null
  nome_interno: string
  label: string
  placeholder: string
  tipo_pergunta: string
  opcoes: any
  global: boolean
  created_at: string
}

interface BuilderItem extends Pergunta {
  pergunta_id: string
  largura: string
  bloco_nome: string
}

const tabs = [
  { key: 'perguntas', label: 'Banco de Perguntas' },
  { key: 'configuracoes', label: 'Formulários' }
]
const route = useRoute()
const router = useRouter()
const activeTab = ref('perguntas')

// ── Vista: 'list' mostra o repetidor, 'builder' mostra o editor ──
const formView = ref<'list' | 'builder'>('list')

// Formulários salvos
interface FormularioSalvo {
  area_id: string | null
  programa_id: string | null
  tipo_proc: string
  tipo_cand: string
  total_campos: number
  contexto_tipo: 'area' | 'programa'
  contexto_nome: string
}
const formulariosSalvos = ref<FormularioSalvo[]>([])
const loadingFormularios = ref(false)
const selectedFormulario = ref<FormularioSalvo | null>(null)

const store = useAppStore()
const toast = useToast()

// Perguntas State
const showModalPergunta = ref<boolean>(false)
const isEditPergunta = ref<boolean>(false)
const perguntaEditData = ref<Pergunta | null>(null)
const perguntas = ref<Pergunta[]>([])
const loadingPerguntas = ref<boolean>(false)

// Context State (Area / Programa)
const areas = ref<any[]>([])
const programas = ref<any[]>([])
const contextType = ref<'area' | 'programa'>('area')
const selectedContextId = ref<string>('')
const selectedTipoProc = ref<string>('matricula')
const selectedTipoCand = ref<string>('estudante')
const loadingContexts = ref<boolean>(false)

const breadcrumbScope = computed(() => contextType.value === 'area' ? 'Área' : 'Programa')
const breadcrumbName = computed(() => {
  if (!selectedContextId.value) return 'Não Selecionado'
  if (contextType.value === 'area') {
    const a = areas.value.find(x => x.id === selectedContextId.value)
    return a ? a.nome_area : 'Não Selecionado'
  } else {
    const p = programas.value.find(x => x.id === selectedContextId.value)
    return p ? p.descricao : 'Não Selecionado'
  }
})

// Builder State
const builderItems = ref<BuilderItem[]>([])
const loadingBuilder = ref<boolean>(false)
const savingBuilder = ref<boolean>(false)

const builderBlocos = ref<string[]>(['Dados Gerais'])
const activeBuilderBlocoIndex = ref(0)
const currentBloco = computed(() => builderBlocos.value[activeBuilderBlocoIndex.value] || 'Dados Gerais')
const currentBlocoItems = computed(() => builderItems.value.filter(b => b.bloco_nome === currentBloco.value))

const baseItems = [
  { label: 'Nome Completo', tipo_pergunta: 'text', largura: '2', isLocked: true },
  { label: 'E-mail', tipo_pergunta: 'email', largura: '2', isLocked: true }
]

function getEntidadeAtivaId(): string | null {
  const entidades = (store as any).entidades || []
  for (const ent of entidades) {
    if (ent.tipo === 'empresa' && Array.isArray(ent.produtos)) {
      if (ent.produtos.some((p: any) => p.slug === 'academico')) {
        return ent.id
      }
    }
  }
  if (entidades[0]?.id) return entidades[0].id
  if ((store as any).company?.id) return (store as any).company.id
  return null
}

async function fetchFormulariosSalvos() {
  loadingFormularios.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) return
    const res = await $fetch('/api/formularios', { params: { id_entidade } }) as any
    formulariosSalvos.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    formulariosSalvos.value = []
  } finally {
    loadingFormularios.value = false
  }
}

async function fetchContexts() {
  loadingContexts.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) return
    const [resAreas, resProgramas] = await Promise.all([
      $fetch('/api/areas', { params: { id_entidade } }) as any,
      $fetch('/api/programas', { params: { id_entidade } }) as any
    ])
    areas.value = resAreas?.itens || []
    programas.value = resProgramas?.itens || []
    if (areas.value.length > 0 && contextType.value === 'area' && !selectedContextId.value) {
      selectedContextId.value = areas.value[0].id
    }
  } catch (e) {
    // silently fail context load
  } finally {
    loadingContexts.value = false
  }
}

function abrirFormulario(f: FormularioSalvo) {
  selectedFormulario.value = f
  contextType.value = f.contexto_tipo === 'area' ? 'area' : 'programa'
  selectedContextId.value = (f.area_id || f.programa_id) as string
  selectedTipoProc.value = f.tipo_proc || 'matricula'
  selectedTipoCand.value = f.tipo_cand || 'estudante'
  formView.value = 'builder'
  fetchFormConfig()
}

function novoFormulario() {
  selectedFormulario.value = null
  selectedContextId.value = ''
  selectedTipoProc.value = 'matricula'
  selectedTipoCand.value = 'estudante'
  builderItems.value = []
  builderBlocos.value = ['Dados Gerais']
  activeBuilderBlocoIndex.value = 0
  formView.value = 'builder'
}

function voltarParaLista() {
  formView.value = 'list'
  selectedFormulario.value = null
  fetchFormulariosSalvos()
}

const labelTipoProc: Record<string, string> = {
  matricula: 'Matrícula',
  seletivo: 'Processo Seletivo'
}
const labelTipoCand: Record<string, string> = {
  estudante: 'Estudante',
  docente: 'Docente',
  externo: 'Externo'
}

const mapTipoPergunta: Record<string, string> = {
  text: 'Texto Curto',
  textarea: 'Texto Longo',
  number: 'Número',
  email: 'E-mail',
  data: 'Data',
  date: 'Data',
  select: 'Seleção',
  file: 'Arquivo'
}

function getTipoPerguntaLabel(tipo: string) {
  return mapTipoPergunta[tipo] || tipo
}

async function fetchPerguntas(): Promise<void> {
  loadingPerguntas.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/perguntas', {
      method: 'GET',
      params: { id_entidade }
    }) as any

    perguntas.value = Array.isArray(res?.data) ? res.data : []
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao buscar perguntas', { type: 'error' })
  } finally {
    loadingPerguntas.value = false
  }
}

async function fetchFormConfig() {
  if (!selectedContextId.value) {
    builderItems.value = []
    builderBlocos.value = ['Dados Gerais']
    activeBuilderBlocoIndex.value = 0
    return
  }
  loadingBuilder.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) return
    const res = await $fetch('/api/form_config', {
      method: 'GET',
      params: {
        id_entidade,
        area_id: contextType.value === 'area' ? selectedContextId.value : undefined,
        programa_id: contextType.value === 'programa' ? selectedContextId.value : undefined,
        tipo_proc: selectedTipoProc.value,
        tipo_cand: selectedTipoCand.value
      }
    }) as any
    if (res?.success && Array.isArray(res?.data)) {
      const uniqueBlocos = new Set<string>()
      res.data.forEach((r: any) => {
        if (r.bloco_nome) uniqueBlocos.add(r.bloco_nome)
      })
      
      if (uniqueBlocos.size > 0) {
        builderBlocos.value = Array.from(uniqueBlocos)
      } else {
        builderBlocos.value = ['Dados Gerais']
      }
      activeBuilderBlocoIndex.value = 0

      builderItems.value = res.data.map((r: any) => ({
        ...r.cmct_pergunta_form,
        pergunta_id: r.pergunta_id,
        largura: r.largura,
        bloco_nome: r.bloco_nome || 'Dados Gerais'
      }))
    } else {
      builderItems.value = []
      builderBlocos.value = ['Dados Gerais']
      activeBuilderBlocoIndex.value = 0
    }
  } catch (e) {
    builderItems.value = []
    builderBlocos.value = ['Dados Gerais']
    activeBuilderBlocoIndex.value = 0
  } finally {
    loadingBuilder.value = false
  }
}

async function saveFormConfig() {
  if (!selectedContextId.value) {
    toast.showToast('Selecione uma área ou programa primeiro.', { type: 'error' })
    return
  }
  savingBuilder.value = true
  // Sync selectedFormulario after save
  const afterSave = async () => { await fetchFormulariosSalvos() }
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) return
    
    // Filtramos apenas itens que tem um bloco válido, e recalculamos a ordem
    const itemsToSave = builderItems.value.map((b, index) => {
      let bOrdem = builderBlocos.value.indexOf(b.bloco_nome) + 1
      if (bOrdem <= 0) bOrdem = 1
      return {
        pergunta_id: b.pergunta_id,
        bloco_nome: b.bloco_nome || 'Dados Gerais',
        bloco_ordem: bOrdem,
        pergunta_ordem: index + 1,
        largura: b.largura
      }
    })

    const res = await $fetch('/api/form_config', {
      method: 'POST',
      body: {
        id_entidade,
        area_id: contextType.value === 'area' ? selectedContextId.value : null,
        programa_id: contextType.value === 'programa' ? selectedContextId.value : null,
        tipo_proc: selectedTipoProc.value,
        tipo_cand: selectedTipoCand.value,
        old_area_id: selectedFormulario.value?.area_id || null,
        old_programa_id: selectedFormulario.value?.programa_id || null,
        old_tipo_proc: selectedFormulario.value?.tipo_proc || null,
        old_tipo_cand: selectedFormulario.value?.tipo_cand || null,
        items: itemsToSave
      }
    }) as any

    if (res?.success) {
      toast.showToast('Configuração salva com sucesso!', { type: 'success' })
      await afterSave()
    } else {
      toast.showToast(res?.message || 'Erro ao salvar layout.', { type: 'error' })
    }
  } catch (e: any) {
    toast.showToast(e.message || 'Erro no servidor', { type: 'error' })
  } finally {
    savingBuilder.value = false
  }
}

function setActiveTab(tabKey: string): void {
  activeTab.value = tabKey
  router.replace({ query: { ...route.query, tab: tabKey } })
}

// ═══════════════════════════════════════════
// DRAG AND DROP — Abordagem com estado global
// ═══════════════════════════════════════════
const dragSource = ref<{ type: 'sidebar'; perguntaId: string } | { type: 'canvas'; index: number } | null>(null)
const dragOverCanvasIndex = ref<number | null>(null)
const dragOverCanvasSide = ref<'left' | 'right' | null>(null)
const dragOverSlotIdx = ref<number | null>(null)

function resetDragState() {
  dragSource.value = null
  dragOverCanvasIndex.value = null
  dragOverCanvasSide.value = null
  dragOverSlotIdx.value = null
}

// Detecta se um item span-1 está "orphanado" (sozinho na linha)
function isOrphaned(idx: number): boolean {
  const item = currentBlocoItems.value[idx]
  if (!item || String(item.largura) !== '1') return false
  let colPos = 0
  for (let i = 0; i < idx; i++) {
    colPos += String(currentBlocoItems.value[i]?.largura) === '2' ? 2 : 1
  }
  const startCol = colPos % 2
  if (startCol === 0) {
    const next = currentBlocoItems.value[idx + 1]
    if (next && String(next.largura) === '1') return false
    return true
  }
  return false
}

// ─── Sidebar Drag ───
function onDragStart(event: DragEvent, pId: string) {
  dragSource.value = { type: 'sidebar', perguntaId: pId }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copyMove'
    event.dataTransfer.setData('text/plain', pId)
  }
}

// ─── Canvas Item Drag (reordenamento) ───
function onCanvasDragStart(event: DragEvent, itemIndexInGrid: number) {
  // itemIndexInGrid é o índice do currentBlocoItems
  const realItem = currentBlocoItems.value[itemIndexInGrid]
  if (!realItem) return
  const realIndex = builderItems.value.indexOf(realItem)
  dragSource.value = { type: 'canvas', index: realIndex }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(realIndex))
  }
}

// ─── Drop no grid vazio (append ao final) ───
function onDrop(event: DragEvent) {
  event.preventDefault()
  const src = dragSource.value
  resetDragState()
  if (!src) return
  const target = event.target as HTMLElement
  if (target.closest('.canvas-item') || target.closest('.drop-slot')) return

  if (src.type === 'sidebar') {
    addPerguntaToEnd(src.perguntaId)
  } else if (src.type === 'canvas') {
    const items = [...builderItems.value]
    const [moved] = items.splice(src.index, 1)
    if (moved) {
      moved.bloco_nome = currentBloco.value // Moveu pro bloco atual
      items.push(moved); builderItems.value = items
    }
  }
}

function addPerguntaToEnd(pId: string) {
  const pergunta = perguntas.value.find(p => p.id === pId)
  if (!pergunta) return
  if (builderItems.value.some(x => x.pergunta_id === pId)) {
    toast.showToast('Esta pergunta já está no formulário.', { type: 'error' })
    return
  }
  builderItems.value.push({ ...pergunta, pergunta_id: pergunta.id, largura: '2', bloco_nome: currentBloco.value })
  if (pergunta.nome_interno === 'cep') {
    let adicionados = 0
    for (const nomeInterno of CEP_DEPENDENT_FIELDS) {
      const dep = perguntas.value.find(p => p.nome_interno === nomeInterno)
      if (dep && !builderItems.value.some(x => x.pergunta_id === dep.id)) {
        builderItems.value.push({ ...dep, pergunta_id: dep.id, largura: nomeInterno === 'numero' || nomeInterno === 'complemento' ? '1' : '2', bloco_nome: currentBloco.value })
        adicionados++
      }
    }
    if (adicionados > 0) toast.showToast(`CEP adicionado! ${adicionados} campos de endereço incluídos automaticamente.`, { type: 'success' })
  }
}

// ─── Dragover em card do canvas ───
// Zonas: topo 25% = inserir antes, meio = split (span-2) ou hover (span-1), fundo 25% = inserir depois
const dragOverZone = ref<'top' | 'bottom' | 'split-left' | 'split-right' | 'over' | null>(null)

function onCanvasDragOver(event: DragEvent, itemIndexInGrid: number) {
  event.preventDefault()
  event.stopPropagation()
  dragOverCanvasIndex.value = itemIndexInGrid
  dragOverSlotIdx.value = null

  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const relY = event.clientY - rect.top
  const pct = relY / rect.height

  if (pct < 0.25) {
    dragOverZone.value = 'top'
    dragOverCanvasSide.value = null
  } else if (pct > 0.75) {
    dragOverZone.value = 'bottom'
    dragOverCanvasSide.value = null
  } else {
    // Zona do meio: split se span-2
    const item = currentBlocoItems.value[itemIndexInGrid]
    if (item && String(item.largura) === '2') {
      const relX = event.clientX - rect.left
      const side = relX < rect.width / 2 ? 'left' : 'right'
      dragOverZone.value = side === 'left' ? 'split-left' : 'split-right'
      dragOverCanvasSide.value = side
    } else {
      dragOverZone.value = 'over'
      dragOverCanvasSide.value = null
    }
  }
}

function onCanvasDragLeave() {
  dragOverCanvasIndex.value = null
  dragOverCanvasSide.value = null
  dragOverZone.value = null
}

// ─── Drop em cima de um card existente ───
function onCanvasItemDrop(event: DragEvent, targetIndexInGrid: number) {
  event.preventDefault()
  event.stopPropagation()
  const src = dragSource.value
  resetDragState()
  dragOverZone.value = null
  if (!src) return

  const realTargetItem = currentBlocoItems.value[targetIndexInGrid]
  if (!realTargetItem) return
  const targetIndex = builderItems.value.indexOf(realTargetItem)
  const isTargetFull = String(realTargetItem.largura) === '2'

  // Recalcular a zona diretamente a partir da posição do mouse no momento do drop
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const pctY = (event.clientY - rect.top) / rect.height
  const pctX = (event.clientX - rect.left) / rect.width

  let zone: 'top' | 'bottom' | 'split-left' | 'split-right' | 'over'
  let side: 'left' | 'right' | null = null

  if (pctY < 0.25) {
    zone = 'top'
  } else if (pctY > 0.75) {
    zone = 'bottom'
  } else if (isTargetFull) {
    side = pctX < 0.5 ? 'left' : 'right'
    zone = side === 'left' ? 'split-left' : 'split-right'
  } else {
    zone = 'over'
  }

  // ── Inserir ANTES (zona topo) ou DEPOIS (zona fundo) ──
  if (zone === 'top' || zone === 'bottom') {
    const insertAt = zone === 'top' ? targetIndex : targetIndex + 1

    if (src.type === 'sidebar') {
      const pergunta = perguntas.value.find(p => p.id === src.perguntaId)
      if (!pergunta) return
      if (builderItems.value.some(x => x.pergunta_id === src.perguntaId)) {
        toast.showToast('Esta pergunta já está no formulário.', { type: 'error' })
        return
      }
      const items = [...builderItems.value]
      items.splice(insertAt, 0, { ...pergunta, pergunta_id: pergunta.id, largura: '2', bloco_nome: currentBloco.value })
      builderItems.value = items

    } else if (src.type === 'canvas') {
      if (src.index === targetIndex) return
      const items = [...builderItems.value]
      const [moved] = items.splice(src.index, 1)
      if (!moved) return
      moved.bloco_nome = currentBloco.value
      const adj = src.index < insertAt ? insertAt - 1 : insertAt
      items.splice(adj, 0, moved)
      builderItems.value = items
    }
    return
  }

  // ── Split ao lado (zona meio, card span-2) ──
  if (src.type === 'canvas') {
    if (src.index === targetIndex) return
    const items = [...builderItems.value]
    const [moved] = items.splice(src.index, 1)
    if (!moved) return
    moved.bloco_nome = currentBloco.value
    const adj = src.index < targetIndex ? targetIndex - 1 : targetIndex
    if (isTargetFull) {
      const movedHalf = { ...moved, largura: '1' as string }
      if (side === 'right') {
        items[adj] = { ...items[adj]!, largura: '1' }
        items.splice(adj + 1, 0, movedHalf)
      } else {
        items.splice(adj, 0, movedHalf)
        items[adj + 1] = { ...items[adj + 1]!, largura: '1' }
      }
    } else {
      items.splice(adj, 0, moved)
    }
    builderItems.value = items

  } else if (src.type === 'sidebar') {
    const pergunta = perguntas.value.find(p => p.id === src.perguntaId)
    if (!pergunta) return
    if (builderItems.value.some(x => x.pergunta_id === src.perguntaId)) {
      toast.showToast('Esta pergunta já está no formulário.', { type: 'error' })
      return
    }
    const newItem: BuilderItem = { ...pergunta, pergunta_id: pergunta.id, largura: '1', bloco_nome: currentBloco.value }
    const items = [...builderItems.value]
    if (isTargetFull) {
      items[targetIndex] = { ...realTargetItem, largura: '1' }
      if (side === 'right') {
        items.splice(targetIndex + 1, 0, newItem)
      } else {
        items.splice(targetIndex, 0, newItem)
      }
    } else {
      items.splice(targetIndex, 0, newItem)
    }
    builderItems.value = items
  }
}

// ─── Ghost slot ───
function onSlotDragOver(event: DragEvent, afterIdx: number) {
  event.preventDefault()
  event.stopPropagation()
  dragOverSlotIdx.value = afterIdx
  dragOverCanvasIndex.value = null
}
function onSlotDragLeave() { dragOverSlotIdx.value = null }

function onSlotDrop(event: DragEvent, afterIdxInGrid: number) {
  event.preventDefault()
  event.stopPropagation()
  const src = dragSource.value
  resetDragState()
  if (!src) return

  const realTargetItem = currentBlocoItems.value[afterIdxInGrid]
  if (!realTargetItem) return
  const targetIndex = builderItems.value.indexOf(realTargetItem)

  if (src.type === 'canvas') {
    const items = [...builderItems.value]
    const [moved] = items.splice(src.index, 1)
    if (!moved) return
    moved.bloco_nome = currentBloco.value
    const adj = src.index <= targetIndex ? targetIndex : targetIndex + 1
    items.splice(adj, 0, { ...moved, largura: '1' })
    builderItems.value = items
  } else if (src.type === 'sidebar') {
    const pergunta = perguntas.value.find(p => p.id === src.perguntaId)
    if (!pergunta) return
    if (builderItems.value.some(x => x.pergunta_id === src.perguntaId)) {
      toast.showToast('Esta pergunta já está no formulário.', { type: 'error' })
      return
    }
    const items = [...builderItems.value]
    items.splice(targetIndex + 1, 0, { ...pergunta, pergunta_id: pergunta.id, largura: '1', bloco_nome: currentBloco.value })
    builderItems.value = items
  }
}

function toggleLargura(indexInGrid: number) {
  const realItem = currentBlocoItems.value[indexInGrid]
  if (!realItem) return
  const targetIndex = builderItems.value.indexOf(realItem)
  const item = builderItems.value[targetIndex]
  if (item) {
    builderItems.value[targetIndex] = { ...item, largura: String(item.largura) === '1' ? '2' : '1' }
  }
}

function removeBuilderItem(indexInGrid: number) {
  const realItem = currentBlocoItems.value[indexInGrid]
  if (!realItem) return
  const targetIndex = builderItems.value.indexOf(realItem)
  if (targetIndex >= 0) {
    builderItems.value.splice(targetIndex, 1)
  }
}

function mudarBlocoItem(indexInGrid: number, event: Event) {
  const realItem = currentBlocoItems.value[indexInGrid]
  if (!realItem) return
  const targetIndex = builderItems.value.indexOf(realItem)
  if (targetIndex >= 0) {
    const novoBloco = (event.target as HTMLSelectElement).value
    if (novoBloco) {
      const item = builderItems.value[targetIndex]
      if (item) {
        item.bloco_nome = novoBloco
      }
      // Resetar o select para o placeholder
      ;(event.target as HTMLSelectElement).value = ""
    }
  }
}

const showModalBloco = ref(false)
const novoBlocoNome = ref('')

function abrirModalNovoBloco() {
  novoBlocoNome.value = ''
  showModalBloco.value = true
}

function confirmarNovoBloco() {
  const nome = novoBlocoNome.value.trim()
  if (!nome) return
  if (builderBlocos.value.includes(nome)) {
    toast.showToast('Já existe um bloco com este nome.', { type: 'error' })
    return
  }
  builderBlocos.value.push(nome)
  activeBuilderBlocoIndex.value = builderBlocos.value.length - 1
  showModalBloco.value = false
}

function removerBlocoAtual() {
  if (builderBlocos.value.length <= 1) return
  if (!confirm('Tem certeza? Todas as perguntas deste bloco voltarão para o banco.')) return

  const blocoARemover = currentBloco.value
  // Remove itens do bloco
  builderItems.value = builderItems.value.filter(b => b.bloco_nome !== blocoARemover)
  
  // Remove o bloco da lista
  builderBlocos.value.splice(activeBuilderBlocoIndex.value, 1)
  activeBuilderBlocoIndex.value = Math.max(0, activeBuilderBlocoIndex.value - 1)
}

// PERGUNTAS BANCO
function openNovaPergunta() {
  isEditPergunta.value = false
  perguntaEditData.value = null
  showModalPergunta.value = true
}

function openEditarPergunta(p: Pergunta) {
  isEditPergunta.value = true
  perguntaEditData.value = p
  showModalPergunta.value = true
}

function handleSavedPergunta() {
  fetchPerguntas()
  showModalPergunta.value = false
}

async function handleDeletePergunta(id: string) {
  if (!confirm('Tem certeza? Isso apagará a pergunta do banco globalmente.')) return
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) return
    const res = await $fetch('/api/perguntas', {
        method: 'DELETE',
        params: { id, id_entidade }
    }) as any
    if (res?.success) {
      toast.showToast('Pergunta removida', { type: 'success' })
      await fetchPerguntas()
      // Opcional: recarregar o form config se afetou o builder
    } else {
      toast.showToast(res?.message || 'Erro', { type: 'error' })
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  }
}

if (import.meta.client) {
  onMounted(async () => {
    const tabFromQuery = typeof route.query.tab === 'string' ? route.query.tab : null
    if (tabFromQuery && tabs.some((tab) => tab.key === tabFromQuery)) {
      activeTab.value = tabFromQuery
    }
    await fetchPerguntas()
    await fetchContexts()
    if (activeTab.value === 'configuracoes') {
      await fetchFormulariosSalvos()
    }
  })

  watch(activeTab, async (val) => {
    if (val === 'configuracoes') {
      formView.value = 'list'
      await fetchFormulariosSalvos()
    }
  }, { immediate: false })

  watch([contextType, selectedContextId], () => {
    if (activeTab.value === 'configuracoes' && selectedContextId.value && formView.value === 'builder') {
      fetchFormConfig()
    }
  })
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-top-row">
      <nav class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="setActiveTab(tab.key)"
          :class="['tab-btn', activeTab === tab.key ? 'tab-btn--active' : '']"
        >
          {{ tab.label }}
        </button>
      </nav>

      <button v-if="activeTab === 'perguntas'" @click="openNovaPergunta" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Nova Pergunta
      </button>
      <button v-else-if="activeTab === 'configuracoes' && formView === 'list'" @click="novoFormulario" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Novo Formulário
      </button>
    </div>

    <div>
      <!-- TAB BANCO DE PERGUNTAS -->
      <div v-if="activeTab === 'perguntas'" class="flex flex-col gap-6">
         <div v-if="loadingPerguntas" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando perguntas...</span>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div v-if="perguntas.length === 0" class="col-span-full empty-state">
                <div class="empty-icon"><Icon name="ph:question-bold" class="w-8 h-8" /></div>
                <p class="empty-title">Nenhuma pergunta cadastrada</p>
                <p class="empty-subtitle">Crie perguntas para serem usadas na configuração dos seus formulários.</p>
                <button @click="openNovaPergunta" class="empty-cta mt-4">
                  Cadastrar Primeira Pergunta
                </button>
             </div>
             <div v-for="p in perguntas" :key="p.id" class="comp-card group">
                <div class="comp-card-accent"></div>
                <div class="comp-avatar">{{ (p.label || '?').charAt(0).toUpperCase() }}</div>
                <div class="flex-1 min-w-0">
                   <div class="flex items-center gap-2 mb-0.5">
                     <p class="text-xs font-black text-primary truncate">{{ p.label }}</p>
                     <span v-if="p.global" class="flex-shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">Global</span>
                   </div>
                   <p class="text-[9px] text-secondary/40 font-medium truncate">{{ p.nome_interno }} - {{ p.tipo_pergunta }}</p>
                </div>
                <div class="comp-actions group-hover:opacity-100">
                   <button v-if="!p.global" @click="openEditarPergunta(p)" class="comp-action-btn comp-action-edit" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63Z"/>
                      </svg>
                   </button>
                   <button v-if="!p.global" @click="handleDeletePergunta(p.id)" class="comp-action-btn comp-action-delete" title="Excluir">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>
                      </svg>
                   </button>
                </div>
             </div>
          </div>
          <ModalPergunta 
            v-if="showModalPergunta"
            v-model="showModalPergunta"
            :isEdit="isEditPergunta"
            :initialData="perguntaEditData"
            :idEntidade="getEntidadeAtivaId()"
            @saved="handleSavedPergunta"
          />
      </div>

      <!-- TAB FORMULÁRIOS -->
      <div v-if="activeTab === 'configuracoes'">

        <!-- VISTA: LISTA DE FORMULÁRIOS SALVOS -->
        <div v-if="formView === 'list'" class="flex flex-col gap-6">

          <!-- Loading -->
          <div v-if="loadingFormularios" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando formulários...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="formulariosSalvos.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160Zm40,164.69H56V40h88V88a8,8,0,0,0,8,8h48Z"/></svg>
            </div>
            <p class="empty-title">Nenhum formulário configurado</p>
            <p class="empty-subtitle">Crie seu primeiro formulário para configurar os campos de inscrição.</p>
            <button @click="novoFormulario" class="empty-cta mt-4">Criar Primeiro Formulário</button>
          </div>

          <!-- Grid de Formulários -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(f, idx) in formulariosSalvos"
              :key="idx"
              class="form-card group"
              @click="abrirFormulario(f)"
            >
              <div class="form-card-accent"></div>
              <!-- Icône -->
              <div class="form-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160Zm40,164.69H56V40h88V88a8,8,0,0,0,8,8h48ZM136,136a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h32A8,8,0,0,1,136,136Zm32,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z"/></svg>
              </div>
              <!-- Conteúdo -->
              <div class="flex-1 min-w-0">
                <p class="text-xs font-black text-white truncate">{{ f.contexto_nome || 'Sem nome' }}</p>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="form-badge form-badge--scope">{{ f.contexto_tipo === 'area' ? 'Área' : 'Programa' }}</span>
                  <span class="form-badge form-badge--proc">{{ labelTipoProc[f.tipo_proc] || f.tipo_proc }}</span>
                  <span class="form-badge form-badge--cand">{{ labelTipoCand[f.tipo_cand] || f.tipo_cand }}</span>
                </div>
                <p class="text-[9px] text-secondary/40 mt-2 font-semibold">{{ f.total_campos }} campo{{ f.total_campos !== 1 ? 's' : '' }} configurado{{ f.total_campos !== 1 ? 's' : '' }}</p>
              </div>
              <!-- Seta -->
              <div class="form-card-arrow opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- VISTA: BUILDER -->
        <div v-else-if="formView === 'builder'">
          <!-- Breadcrumb reativo / identificador do formulário ativo -->
          <div class="form-breadcrumb mb-5">
            <button @click="voltarParaLista" class="form-breadcrumb-back">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M228,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-16.97,16.98l-72-72a12,12,0,0,1,0-16.98l72-72a12,12,0,0,1,16.97,16.98L69,116H216A12,12,0,0,1,228,128Z"/></svg>
              Formulários
            </button>
            <span class="form-breadcrumb-sep">/</span>
            
            <template v-if="selectedContextId">
              <div class="form-breadcrumb-current">
                <span class="form-badge form-badge--scope" style="margin-right:6px">{{ breadcrumbScope }}</span>
                <span class="font-bold text-white text-xs">{{ breadcrumbName }}</span>
                <span class="form-badge form-badge--proc" style="margin-left:8px">{{ labelTipoProc[selectedTipoProc] || selectedTipoProc }}</span>
                <span class="form-badge form-badge--cand" style="margin-left:4px">{{ labelTipoCand[selectedTipoCand] || selectedTipoCand }}</span>
              </div>
            </template>
            <template v-else>
               <span class="text-xs font-bold text-primary/80">{{ selectedFormulario ? 'Editando Formulário...' : 'Novo Formulário' }}</span>
            </template>
          </div>
        
             <div class="builder-layout">
        <!-- SIDEBAR: Banco de Perguntas (Draggable) -->
        <div class="builder-sidebar">
          <h4 class="text-xs font-black uppercase tracking-widest text-primary/90 mb-4">Banco de Perguntas</h4>
          <div class="text-[10px] text-secondary/50 mb-4 font-semibold pb-4 border-b border-white/5">
            Arraste os campos abaixo para o quadro ao lado para formar o cadastro.
          </div>

          <div class="flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[70vh] pr-2 pb-2">
             <div 
               v-for="p in perguntas" 
               :key="p.id"
               class="draggable-field"
               draggable="true"
               @dragstart="onDragStart($event, p.id)"
             >
                <div class="opacity-50">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M104,64A16,16,0,1,1,88,48,16,16,0,0,1,104,64Zm56-16a16,16,0,1,0,16,16A16,16,0,0,0,160,48ZM88,112a16,16,0,1,0,16,16A16,16,0,0,0,88,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,112ZM88,184a16,16,0,1,0,16,16A16,16,0,0,0,88,184Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,184Z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                   <div class="flex items-center gap-2 mb-0.5">
                     <p class="text-xs font-bold text-white truncate">{{ p.label }}</p>
                     <span v-if="p.global" class="flex-shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">Global</span>
                   </div>
                   <p class="text-[9px] text-primary font-medium uppercase tracking-wider">{{ getTipoPerguntaLabel(p.tipo_pergunta) }}</p>
                </div>
             </div>
          </div>
        </div>

        <!-- MAIN CANVAS -->
        <div class="builder-main">
          
          <!-- Configurations Header -->
          <div class="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-[11px] font-black uppercase tracking-widest text-primary m-0 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M221.56,100.85l-76.41-76.41A15.93,15.93,0,0,0,133.83,20H48A16,16,0,0,0,32,36V220a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V112.18A15.93,15.93,0,0,0,221.56,100.85ZM140,43.31,192.68,96H140ZM208,220H48V36h76V104a8,8,0,0,0,8,8h68Z"/></svg>
                Destino do Formulário
              </h4>
              <button @click="saveFormConfig" class="add-btn" :disabled="savingBuilder">
                {{ savingBuilder ? 'Salvando...' : 'Salvar Layout' }}
              </button>
            </div>
            
            <div class="flex flex-wrap gap-6 items-end">
               <div class="flex-1 min-w-[200px]">
                  <label class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase">Atrelar ao escopo:</label>
                  <select v-model="contextType" class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] appearance-none">
                     <option value="area">Área Generalista</option>
                     <option value="programa">Programa Específico</option>
                  </select>
               </div>
               <div class="flex-1 min-w-[200px]">
                  <label class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase">Selecione:</label>
                  <select v-model="selectedContextId" class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] appearance-none">
                     <option value="" disabled>Selecione...</option>
                     <template v-if="contextType === 'area'">
                        <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.nome_area }}</option>
                     </template>
                     <template v-else>
                        <option v-for="p in programas" :key="p.id" :value="p.id">{{ p.descricao }}</option>
                     </template>
                  </select>
               </div>
               <div class="flex-1 min-w-[200px]">
                  <label class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase">Tipo de Processo:</label>
                  <select v-model="selectedTipoProc" class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] appearance-none">
                     <option value="matricula">Matrícula</option>
                     <option value="seletivo">Processo Seletivo</option>
                  </select>
               </div>
               <div class="flex-1 min-w-[200px]">
                  <label class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase">Tipo de Candidato:</label>
                  <select v-model="selectedTipoCand" class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] appearance-none">
                     <option value="estudante">Estudante</option>
                     <option value="docente">Docente</option>
                     <option value="externo">Externo</option>
                  </select>
               </div>
            </div>
          </div>
          
          <!-- Builder Blocos (Abas) -->
          <div class="flex gap-4 mb-4 overflow-x-auto pb-2 scrollbar-hide items-center">
            <button 
              v-for="(bloco, idx) in builderBlocos" 
              :key="idx"
              @click="activeBuilderBlocoIndex = idx"
              class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border flex items-center gap-3"
              :class="activeBuilderBlocoIndex === idx ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white' : 'bg-white/5 border-white/5 text-secondary hover:text-white'"
            >
              {{ bloco }}
              <span v-if="activeBuilderBlocoIndex === idx && builderBlocos.length > 1" @click.stop="removerBlocoAtual" class="hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity" title="Remover Bloco">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66a8,8,0,0,1,11.32-11.32L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>
              </span>
            </button>
            
            <button @click="abrirModalNovoBloco" class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/50 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
              Novo Bloco
            </button>
          </div>

          <!-- The Canvas Grid -->
          <div 
             class="canvas-grid" 
             @dragover.prevent="" 
             @drop="onDrop"
             :class="{ 'canvas-empty': builderItems.length === 0 }"
           >
             <div v-if="loadingBuilder" class="col-span-full flex justify-center py-10 opacity-50">Carregando...</div>
             
             <!-- Hardcoded Base Items -->
             <template v-if="activeBuilderBlocoIndex === 0">
               <div v-for="(base, bidx) in baseItems" :key="'base-'+bidx" class="canvas-item locked" style="grid-column: span 2 / span 2;">
                   <div class="canvas-item-inner">
                      <div class="flex-1 min-w-0">
                        <div class="text-[10px] uppercase font-black text-white/50 tracking-wider mb-1 flex items-center gap-2">
                          {{ base.label }}
                          <span class="bg-white/5 text-white/40 border border-white/10 px-1.5 py-0.5 rounded flex items-center gap-1 text-[8px]" title="Campo obrigatório do sistema">
                             <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 256 256"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-60-56a20,20,0,1,1-20-20A20,20,0,0,1,148,152Z"/></svg>
                             Fixo
                          </span>
                        </div>
                        <div class="h-8 rounded bg-white/5 border border-white/5 w-full flex items-center px-3 text-xs text-white/30 truncate">
                          Padrão do sistema
                        </div>
                      </div>
                   </div>
               </div>
             </template>

             <!-- Dropped Items + Ghost Slots -->
             <template v-for="(item, idx) in currentBlocoItems" :key="idx">

              <!-- O card em si -->
              <div 
                  class="canvas-item group"
                  :class="{
                    'canvas-item--drag-top': dragOverCanvasIndex === idx && dragOverZone === 'top',
                    'canvas-item--drag-bottom': dragOverCanvasIndex === idx && dragOverZone === 'bottom',
                    'canvas-item--drag-over': dragOverCanvasIndex === idx && dragOverZone === 'over',
                    'canvas-item--split-left': dragOverCanvasIndex === idx && dragOverZone === 'split-left',
                    'canvas-item--split-right': dragOverCanvasIndex === idx && dragOverZone === 'split-right',
                  }"
                  :style="{ gridColumn: item.largura === '2' ? 'span 2 / span 2' : 'span 1 / span 1' }"
                  draggable="true"
                  @dragstart="onCanvasDragStart($event, idx)"
                  @dragover="onCanvasDragOver($event, idx)"
                  @dragleave="onCanvasDragLeave"
                  @drop.stop="onCanvasItemDrop($event, idx)"
              >
                 <div class="canvas-item-inner">
                     <!-- Handle de arrasto -->
                     <div class="drag-handle opacity-0 group-hover:opacity-40 mr-3 flex-shrink-0 cursor-grab" title="Arraste para reordenar">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M104,64A16,16,0,1,1,88,48,16,16,0,0,1,104,64Zm56-16a16,16,0,1,0,16,16A16,16,0,0,0,160,48ZM88,112a16,16,0,1,0,16,16A16,16,0,0,0,88,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,112ZM88,184a16,16,0,1,0,16,16A16,16,0,0,0,88,184Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,184Z"/></svg>
                     </div>
                     <div class="flex-1 mr-4 min-w-0">
                       <div class="text-[10px] uppercase font-black text-primary/80 tracking-wider mb-1 flex items-center gap-2">
                          {{ item.label }}
                          <span class="bg-primary/20 px-1.5 py-0.5 rounded text-[8px]">{{ getTipoPerguntaLabel(item.tipo_pergunta) }}</span>
                       </div>
                       <div v-if="item.tipo_pergunta === 'file'" class="h-9 rounded border border-dashed border-primary/40 bg-primary/5 w-full flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-primary/70 truncate cursor-pointer hover:bg-primary/10 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160Zm40,164.69H56V40h88V88a8,8,0,0,0,8,8h48ZM128,112a8,8,0,0,1,8,8v32h32a8,8,0,0,1,0,16H136v32a8,8,0,0,1-16,0V168H88a8,8,0,0,1,0-16h32V120A8,8,0,0,1,128,112Z"/></svg>
                         {{ item.placeholder || 'Anexar Arquivo...' }}
                       </div>
                       <div v-else-if="item.tipo_pergunta === 'select'" class="w-full relative pointer-events-none">
                         <select class="h-8 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] w-full px-3 text-xs text-white/50 truncate appearance-none">
                            <option value="" disabled selected>{{ item.placeholder || 'Selecione uma opção...' }}</option>
                            <template v-if="item.opcoes && item.opcoes.length > 0">
                               <option v-for="(opt, oidx) in item.opcoes" :key="oidx" :value="opt">{{ opt }}</option>
                            </template>
                         </select>
                       </div>
                       <div v-else-if="item.tipo_pergunta === 'radio'" class="flex flex-col gap-2 mt-1 pointer-events-none">
                         <template v-if="item.opcoes && item.opcoes.length > 0">
                           <label v-for="(opt, oidx) in item.opcoes" :key="oidx" class="flex items-center gap-2 text-xs text-white/50">
                             <div class="w-3.5 h-3.5 rounded-full border border-white/20"></div>
                             {{ opt }}
                           </label>
                         </template>
                         <div v-else class="text-xs text-white/30 italic">Nenhuma opção configurada...</div>
                       </div>
                       <div v-else-if="item.tipo_pergunta === 'checkbox'" class="flex flex-col gap-2 mt-1 pointer-events-none">
                         <template v-if="item.opcoes && item.opcoes.length > 0">
                           <label v-for="(opt, oidx) in item.opcoes" :key="oidx" class="flex items-center gap-2 text-xs text-white/50">
                             <div class="w-3.5 h-3.5 rounded border border-white/20"></div>
                             {{ opt }}
                           </label>
                         </template>
                         <div v-else class="text-xs text-white/30 italic">Nenhuma opção configurada...</div>
                       </div>
                       <div v-else-if="['data', 'date'].includes(item.tipo_pergunta)" class="w-full relative pointer-events-none">
                         <div class="h-8 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] w-full flex items-center px-3 text-xs text-white/30 truncate">
                           {{ item.placeholder || 'DD/MM/AAAA' }}
                         </div>
                         <svg class="absolute right-3 top-2.5 opacity-50 text-white/50" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM48,208V96H208V208Z"/></svg>
                       </div>
                       <div v-else class="h-8 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] w-full flex items-center px-3 text-xs text-white/30 truncate">
                         {{ item.placeholder || 'Preencha aqui...' }}
                       </div>
                     </div>

                    <!-- Botões de Ação do Card -->
                    <div class="flex flex-col items-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div class="canvas-actions">
                        <button type="button" @click.prevent.stop="toggleLargura(idx)" class="action-btn action-sizing" :title="item.largura === '1' ? 'Expandir Tela Inteira' : 'Reduzir Meia Tela'">
                           <!-- Expandir: setas apontando para fora -->
                           <svg v-if="item.largura === '1'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                             <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM82.34,146.34,56,172.69V152a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H88a8,8,0,0,0,0-16H67.31l26.35-26.34a8,8,0,0,0-11.32-11.32ZM216,104a8,8,0,0,0-8-8H168a8,8,0,0,0,0,16h20.69l-26.35,26.34a8,8,0,0,0,11.32,11.32L200,123.31V144a8,8,0,0,0,16,0V104Z"/>
                           </svg>
                           <!-- Recolher: setas apontando para dentro -->
                           <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                             <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM109.66,146.34a8,8,0,0,1,0,11.32L83.31,184H104a8,8,0,0,1,0,16H64a8,8,0,0,1-8-8V152a8,8,0,0,1,16,0v20.69l26.34-26.35A8,8,0,0,1,109.66,146.34Zm42.68-36.68L178.69,84H158a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8V116a8,8,0,0,1-16,0V95.31l-26.34,26.35a8,8,0,0,1-11.32-11.32Z"/>
                           </svg>
                        </button>
                        <button @click="removeBuilderItem(idx)" class="action-btn action-remove" title="Excluir do formulário">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>
                        </button>
                      </div>
                      
                      <!-- Mini Drop de Mover Bloco -->
                      <div v-if="builderBlocos.length > 1" class="relative w-20" title="Mudar bloco">
                         <select @change="mudarBlocoItem(idx, $event)" class="w-full h-5 rounded bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary/80 pl-1.5 pr-4 appearance-none cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-all outline-none">
                            <option value="" disabled selected>Bloco...</option>
                            <option v-for="b in builderBlocos.filter(bl => bl !== currentBloco)" :key="b" :value="b" class="bg-background text-white">{{ b }}</option>
                         </select>
                      </div>
                    </div>
                 </div>
              </div>

              <!-- Ghost Slot: espaço vazio ao lado de item orphanado -->
              <div
                v-if="isOrphaned(idx)"
                class="drop-slot"
                :class="{ 'drop-slot--active': dragOverSlotIdx === idx }"
                @dragover="onSlotDragOver($event, idx)"
                @dragleave="onSlotDragLeave"
                @drop.stop="onSlotDrop($event, idx)"
              >
                <svg class="opacity-40" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
                <span class="text-[10px] font-black uppercase tracking-widest">Soltar aqui</span>
              </div>
             </template>

             <div v-if="builderItems.length === 0" style="grid-column: span 2 / span 2;" class="py-10 flex text-center flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl bg-white/5">
                <svg class="opacity-30 mb-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160Zm40,164.69H56V40h88V88a8,8,0,0,0,8,8h48Z"/></svg>
                <span class="text-[11px] font-bold text-white/50 uppercase tracking-widest">Arraste os campos para cá</span>
             </div>
          </div>
          <!-- /canvas-grid -->
        </div>
        <!-- /builder-main -->
        </div>
        <!-- /builder-layout -->
        </div>
        <!-- /formView builder -->

      </div>
      <!-- /activeTab configuracoes -->
    </div>
  </div>

  <!-- Modal Novo Bloco -->
  <div v-if="showModalBloco" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-background border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-up">
      <div class="p-6">
        <h3 class="text-lg font-black text-white mb-2 tracking-tight">Novo Bloco</h3>
        <p class="text-xs text-secondary/60 mb-6 font-semibold">Dê um nome para a nova etapa do seu formulário.</p>
        
        <input 
          v-model="novoBlocoNome" 
          @keyup.enter="confirmarNovoBloco"
          type="text" 
          placeholder="Ex: Documentação" 
          class="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all mb-8"
          autofocus
        />
        
        <div class="flex items-center gap-3">
          <button @click="showModalBloco = false" class="flex-1 px-4 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all text-secondary">
            Cancelar
          </button>
          <button @click="confirmarNovoBloco" class="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Styles */
.page-wrap { padding: 16px; background: var(--color-background); min-height: 100vh; }
.page-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }

/* Tabs */
.tabs-nav {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 4px;
}
.tab-btn {
  padding: 7px 16px; border-radius: 9px;
  color: rgba(255,255,255,0.35); font-size: 12px; font-weight: 600;
  transition: all 0.2s ease; border: none; cursor: pointer; background: transparent;
}
.tab-btn:hover { color: rgba(255,255,255,0.7); }
.tab-btn--active {
  color: #c4b5fd; background: rgba(139,92,246,0.15); font-weight: 700;
}

/* Button */
.add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 12px;
  background: #7c3aed; color: #fff;
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
  transition: all 0.2s ease; border: none; cursor: pointer;
}
.add-btn:hover { background: #6d28d9; }
.add-btn:disabled { opacity: 0.5; background: #6d28d9; cursor: not-allowed; }

/* Back button */
.back-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 12px;
  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55);
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  transition: all 0.2s ease; cursor: pointer;
}
.back-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); }
.empty-icon { color: rgba(139,92,246,0.5); margin-bottom: 16px; }
.empty-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.empty-subtitle { font-size: 12px; color: rgba(255,255,255,0.4); text-align: center; }
.empty-cta { margin-top: 16px; padding: 8px 16px; background: rgba(139,92,246,0.15); color: #c4b5fd; border-radius: 12px; font-weight: 600; font-size: 12px; border: 1px solid rgba(139,92,246,0.3); cursor: pointer; }

/* Card Lista Simples */
.comp-card {
  position: relative; display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 12px;
  overflow: hidden; transition: all 0.2s ease;
}
.comp-card:hover { border-color: rgba(139,92,246,0.3); transform: translateX(2px); }
.comp-card-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #8b5cf6; opacity: 0; transition: opacity 0.2s ease; }
.comp-card:hover .comp-card-accent { opacity: 1; }
.comp-avatar { background: rgba(139,92,246,0.1); color: #a78bfa; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
.comp-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s ease; }
.comp-action-btn { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); width: 28px; height: 28px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
.comp-action-edit:hover { background: rgba(139,92,246,0.15); color: #c4b5fd; }
.comp-action-delete:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }

/* Builder Grid Layout */
.builder-layout {
  display: flex; gap: 24px; min-height: calc(100vh - 120px);
}
.builder-sidebar {
  width: 420px; flex-shrink: 0; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03);
  border-radius: 12px; padding: 20px;
}
.draggable-field {
  display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 10px;
  cursor: grab; transition: all 0.2s;
  margin-right: 8px;
}
.draggable-field:hover { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.3); transform: translateX(2px); }
.draggable-field:active { cursor: grabbing; opacity: 0.8; }

.builder-main {
  flex: 1; min-width: 0; display: flex; flex-direction: column;
}

/* Canvas Grid */
.canvas-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;
  background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 20px; align-content: start; min-height: 400px;
}

.canvas-item {
  background: rgba(139,92,246,0.04); border: 1px solid rgba(139,92,246,0.15);
  border-radius: 12px; padding: 14px 16px; transition: all 0.2s ease; cursor: grab;
}
.canvas-item.locked { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); cursor: default; }
.canvas-item:hover { border-color: rgba(139,92,246,0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.canvas-item--drag-over {
  border-color: #8b5cf6 !important;
  background: rgba(139,92,246,0.12) !important;
  box-shadow: 0 0 0 2px rgba(139,92,246,0.3), 0 4px 20px rgba(0,0,0,0.2);
  transform: scale(1.01);
}
/* Split visual: metade esquerda ou direita destacada */
.canvas-item--split-left {
  background: linear-gradient(90deg, rgba(139,92,246,0.25) 50%, rgba(139,92,246,0.04) 50%) !important;
  border-color: #8b5cf6 !important;
}
.canvas-item--split-right {
  background: linear-gradient(90deg, rgba(139,92,246,0.04) 50%, rgba(139,92,246,0.25) 50%) !important;
  border-color: #8b5cf6 !important;
}

/* Ghost drop slot */
.drop-slot {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  border: 2px dashed rgba(139,92,246,0.2); border-radius: 12px;
  color: rgba(139,92,246,0.4); min-height: 80px; transition: all 0.2s ease;
  cursor: copy;
}
.drop-slot--active {
  border-color: #8b5cf6; background: rgba(139,92,246,0.1); color: #c4b5fd;
  transform: scale(1.02);
}

/* Zona topo/fundo: linha indicadora de inserção */
.canvas-item--drag-top {
  position: relative;
  border-color: rgba(139,92,246,0.3) !important;
}
.canvas-item--drag-top::before {
  content: '';
  position: absolute;
  top: -3px; left: 0; right: 0;
  height: 3px;
  background: #8b5cf6;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(139,92,246,0.6);
  z-index: 10;
}
.canvas-item--drag-bottom {
  position: relative;
  border-color: rgba(139,92,246,0.3) !important;
}
.canvas-item--drag-bottom::after {
  content: '';
  position: absolute;
  bottom: -3px; left: 0; right: 0;
  height: 3px;
  background: #8b5cf6;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(139,92,246,0.6);
  z-index: 10;
}

.drag-handle { color: rgba(255,255,255,0.6); transition: opacity 0.2s; }
.canvas-item-inner { display: flex; align-items: flex-start; justify-content: space-between; }

/* Ações Canvas Card */
.canvas-actions { display: flex; align-items: center; gap: 6px; }
.action-btn { width: 26px; height: 26px; border-radius: 6px; border: none; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.1s ease; }
.action-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.action-remove:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
.action-sizing:hover { background: rgba(139,92,246,0.2); color: #c4b5fd; }

/* ── Cards de Formulários Salvos ── */
.form-card {
  position: relative; display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px; padding: 16px 14px; overflow: hidden;
  cursor: pointer; transition: all 0.2s ease;
}
.form-card:hover {
  border-color: rgba(139,92,246,0.35);
  background: rgba(139,92,246,0.06);
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.25);
}
.form-card-accent {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, #7c3aed, #a78bfa);
  opacity: 0; transition: opacity 0.2s;
}
.form-card:hover .form-card-accent { opacity: 1; }
.form-card-icon {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  color: #a78bfa; display: flex; align-items: center; justify-content: center;
}
.form-card-arrow { color: rgba(139,92,246,0.6); flex-shrink: 0; }

/* Badges de classificação */
.form-badge {
  display: inline-flex; align-items: center;
  font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
  padding: 2px 7px; border-radius: 4px;
}
.form-badge--scope { background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.25); }
.form-badge--proc  { background: rgba(34,197,94,0.1);  color: #86efac;  border: 1px solid rgba(34,197,94,0.2); }
.form-badge--cand  { background: rgba(251,191,36,0.1); color: #fcd34d;  border: 1px solid rgba(251,191,36,0.2); }

/* Breadcrumb do Builder */
.form-breadcrumb {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px; padding: 10px 14px;
}
.form-breadcrumb-back {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer;
  transition: color 0.15s;
}
.form-breadcrumb-back:hover { color: #c4b5fd; }
.form-breadcrumb-sep { color: rgba(255,255,255,0.2); font-size: 12px; }
.form-breadcrumb-current { display: flex; align-items: center; gap: 4px; }
select {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
  background-position: right 1rem center !important;
  background-repeat: no-repeat !important;
  background-size: 1.2em 1.2em !important;
  padding-right: 2.5rem !important;
}
</style>
