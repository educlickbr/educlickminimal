<script setup lang="ts">
definePageMeta({
  layout: 'base'
})

import ModalComponente from '../components/ModalComponente.vue'
import ModalModulo from '../components/ModalModulo.vue'
import ModalCurso from '../components/ModalCurso.vue'
import ModalPrograma from '../components/ModalPrograma.vue'
import ModalCiclo from '../components/ModalCiclo.vue'
import ModalArea from '../components/ModalArea.vue'
import ModalConfirmacao from '../components/ModalConfirmacao.vue'
import { useAppStore } from '../../stores/app'
import { useToast } from '~/composables/useToast'

const client = useSupabaseClient()

interface Componente {
  id: string
  id_entidade: string
  nome_componente: string
  descricao?: string | null
  criado_por?: string
  criado_em: string
  modificado_em: string
}

interface Modulo {
  id: string
  nome_modulo: string
  descricao?: string | null
  carga_horaria?: number | null
  qtd_componentes?: number
  qtd_planos?: number
  criado_em: string
}

interface Curso {
  id: string
  nome_curso: string
  descricao?: string | null
  id_area?: string | null
  nome_area?: string | null
  qtd_modulos?: number
  criado_em: string
}

interface Programa {
  id: string
  id_curso: string
  nome_curso?: string
  descricao: string
  qtd_ciclos?: number
  criado_em: string
}

interface Area {
  id: string
  nome_area: string
  descricao?: string | null
  id_entidade: string
  criado_em: string
}

interface ComponentePayload {
  nome_componente: string
  descricao?: string | null
}

const tabs = [
  { key: 'areas', label: 'Áreas' },
  { key: 'componentes', label: 'Componentes' },
  { key: 'modulos', label: 'Módulos' },
  { key: 'cursos', label: 'Cursos' },
  { key: 'ciclos', label: 'Ciclos' },
  { key: 'programas', label: 'Programas' }
]
const route = useRoute()
const router = useRouter()
const activeTab = ref('areas')

// State
const store = useAppStore()
const toast = useToast()

// Componentes State
const showModalComponente = ref<boolean>(false)
const isEditComponente = ref<boolean>(false)
const componenteEditData = ref<Componente | null>(null)
const componentes = ref<Componente[]>([])
const loadingComponentes = ref<boolean>(false)

// Exclusão de Componente
const showConfirmDeleteComponente = ref<boolean>(false)
const componenteToDelete = ref<string | null>(null)
const isDeletingComponente = ref<boolean>(false)

// Áreas State
const showModalArea = ref<boolean>(false)
const isEditArea = ref<boolean>(false)
const areaEditData = ref<Area | null>(null)
const loadingAreas = ref<boolean>(false)
const areas = ref<Area[]>([])

// Exclusão de Área
const showConfirmDeleteArea = ref<boolean>(false)
const areaToDelete = ref<string | null>(null)
const isDeletingArea = ref<boolean>(false)

// Modulos State
const showModalModulo = ref<boolean>(false)
const isEditModulo = ref<boolean>(false)
const moduloEditData = ref<Modulo | null>(null)
const modulos = ref<Modulo[]>([])
const loadingModulos = ref<boolean>(false)

// Exclusão de Módulo
const showConfirmDeleteModulo = ref<boolean>(false)
const moduloToDelete = ref<string | null>(null)
const isDeletingModulo = ref<boolean>(false)

// Cursos State
const showModalCurso = ref<boolean>(false)
const isEditCurso = ref<boolean>(false)
const cursoEditData = ref<Curso | null>(null)
const cursos = ref<Curso[]>([])
const loadingCursos = ref<boolean>(false)

// Exclusão de Curso
const showConfirmDeleteCurso = ref<boolean>(false)
const cursoToDelete = ref<string | null>(null)
const isDeletingCurso = ref<boolean>(false)

// Programas State
const showModalPrograma = ref<boolean>(false)
const isEditPrograma = ref<boolean>(false)
const programaEditData = ref<Programa | null>(null)
const programas = ref<Programa[]>([])
const loadingProgramas = ref<boolean>(false)

// Ciclos State
const showModalCiclo = ref<boolean>(false)
const isEditCiclo = ref<boolean>(false)
const cicloEditData = ref<any | null>(null)
const loadingCiclos = ref<boolean>(false)
const ciclos = ref<any[]>([])
const moduloSelecionadoParaCiclo = ref<any | null>(null)

// Exclusão de Ciclo
const showConfirmDeleteCiclo = ref<boolean>(false)
const cicloToDelete = ref<string | null>(null)
const isDeletingCiclo = ref<boolean>(false)

function getEntidadeAtivaId(): string | null {
  // Exemplo: pega a primeira entidade do tipo empresa com produto acadêmico
  const entidades = (store as any).entidades || []
  for (const ent of entidades) {
    if (ent.tipo === 'empresa' && Array.isArray(ent.produtos)) {
      if (ent.produtos.some((p: any) => p.slug === 'academico')) {
        return ent.id
      }
    }
  }
  // fallback: primeira entidade
  if (entidades[0]?.id) return entidades[0].id

  // fallback de compatibilidade (payload legado com company)
  if ((store as any).company?.id) return (store as any).company.id

  return null
}

async function fetchComponentes(): Promise<void> {
  loadingComponentes.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await requestComponentes(id_entidade)

    if (res?.success === false) {
      throw new Error(res?.message || 'Falha ao listar componentes')
    }

    componentes.value = Array.isArray(res?.itens) ? res.itens : []
  } catch (e) {
    toast.showToast((e as any)?.message || 'Erro ao buscar componentes', { type: 'error' })
  } finally {
    loadingComponentes.value = false
  }
}

async function requestComponentes(id_entidade: string): Promise<any> {
  return await $fetch('/api/componentes', {
    method: 'GET',
    params: {
      id_entidade,
      page: 1,
      limit: 20
    }
  })
}

async function fetchModulos(): Promise<void> {
  loadingModulos.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/modulos', {
      method: 'GET',
      params: { id_entidade, page: 1, limit: 20 }
    }) as any

    modulos.value = Array.isArray(res?.itens) ? res.itens : []
  } catch (e) {
    toast.showToast((e as any)?.message || 'Erro ao buscar módulos', { type: 'error' })
  } finally {
    loadingModulos.value = false
  }
}

async function fetchCursos(): Promise<void> {
  loadingCursos.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/cursos', {
      method: 'GET',
      params: { id_entidade, page: 1, limit: 20 }
    }) as any
    cursos.value = Array.isArray(res?.itens) ? res.itens : []
  } catch (e) {
    toast.showToast('Erro ao buscar cursos', { type: 'error' })
  } finally {
    loadingCursos.value = false
  }
}

async function fetchAreas(): Promise<void> {
  loadingAreas.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/areas', {
      method: 'GET',
      params: { id_entidade }
    }) as any
    areas.value = Array.isArray(res?.itens) ? res.itens : []
  } catch (e) {
    toast.showToast('Erro ao buscar áreas', { type: 'error' })
  } finally {
    loadingAreas.value = true
    loadingAreas.value = false
  }
}

function openNovaArea() {
  isEditArea.value = false
  areaEditData.value = null
  showModalArea.value = true
}

function handleSavedArea() {
  fetchAreas()
}

function confirmDeleteArea(id: string) {
  areaToDelete.value = id
  showConfirmDeleteArea.value = true
}

function confirmDeleteComponente(id: string) {
  componenteToDelete.value = id
  showConfirmDeleteComponente.value = true
}

function confirmDeleteModulo(id: string) {
  moduloToDelete.value = id
  showConfirmDeleteModulo.value = true
}

function confirmDeleteCurso(id: string) {
  cursoToDelete.value = id
  showConfirmDeleteCurso.value = true
}

async function handleDeleteCurso() {
  if (!cursoToDelete.value) return
  isDeletingCurso.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')

    const res = await $fetch('/api/cursos', {
      method: 'DELETE',
      body: { 
        id: cursoToDelete.value,
        id_entidade 
      }
    }) as any

    if (res?.success === false) {
      throw new Error(res?.message || 'Erro ao remover curso')
    }

    toast.showToast('Curso removido', { type: 'success' })
    await fetchCursos()
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao remover curso', { type: 'error' })
  } finally {
    isDeletingCurso.value = false
    showConfirmDeleteCurso.value = false
    cursoToDelete.value = null
  }
}

async function handleDeleteModulo() {
  if (!moduloToDelete.value) return
  isDeletingModulo.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')

    const res = await $fetch('/api/modulos', {
      method: 'DELETE',
      body: { 
        id: moduloToDelete.value,
        id_entidade 
      }
    }) as any

    if (res?.success === false) {
      throw new Error(res?.message || 'Erro ao remover módulo')
    }

    toast.showToast('Módulo removido', { type: 'success' })
    await fetchModulos()
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao remover módulo', { type: 'error' })
  } finally {
    isDeletingModulo.value = false
    showConfirmDeleteModulo.value = false
    moduloToDelete.value = null
  }
}

async function handleDeleteComponente() {
  if (!componenteToDelete.value) return
  isDeletingComponente.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')

    const res = await $fetch('/api/componentes', {
      method: 'DELETE',
      body: { 
        id: componenteToDelete.value,
        id_entidade 
      }
    }) as any

    if (res?.success === false) {
      throw new Error(res?.message || 'Erro ao remover componente')
    }

    toast.showToast('Componente removido', { type: 'success' })
    await fetchComponentes()
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao remover componente', { type: 'error' })
  } finally {
    isDeletingComponente.value = false
    showConfirmDeleteComponente.value = false
    componenteToDelete.value = null
  }
}

async function handleDeleteArea() {
  if (!areaToDelete.value) return
  isDeletingArea.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')

    const res = await $fetch('/api/areas', {
      method: 'DELETE',
      body: { 
        id: areaToDelete.value,
        id_entidade 
      }
    }) as any

    if (res?.success === false) {
      throw new Error(res?.message || 'Erro ao remover área')
    }

    toast.showToast('Área removida', { type: 'success' })
    await fetchAreas()
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao remover área', { type: 'error' })
  } finally {
    isDeletingArea.value = false
    showConfirmDeleteArea.value = false
    areaToDelete.value = null
  }
}

function editArea(area: Area) {
  isEditArea.value = true
  areaEditData.value = area
  showModalArea.value = true
}

async function fetchProgramas(): Promise<void> {
  loadingProgramas.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/programas', {
      method: 'GET',
      params: { id_entidade, page: 1, limit: 20 }
    }) as any
    programas.value = Array.isArray(res?.itens) ? res.itens : []
  } catch (e) {
    toast.showToast('Erro ao buscar programas', { type: 'error' })
  } finally {
    loadingProgramas.value = false
  }
}

function openNovoComponente() {
  isEditComponente.value = false
  componenteEditData.value = null
  showModalComponente.value = true
}

function setActiveTab(tabKey: string): void {
  activeTab.value = tabKey
  router.replace({
    query: {
      ...route.query,
      tab: tabKey
    }
  })
}

function openNovoModulo() {
  isEditModulo.value = false
  moduloEditData.value = null
  showModalModulo.value = true
}

function openEditarModulo(m: Modulo) {
  isEditModulo.value = true
  moduloEditData.value = m
  showModalModulo.value = true
}

function handleSavedModulo() {
  fetchModulos()
}

function openNovoCurso() {
  isEditCurso.value = false
  cursoEditData.value = null
  showModalCurso.value = true
}

function openEditarCurso(c: Curso) {
  isEditCurso.value = true
  cursoEditData.value = c
  showModalCurso.value = true
}

function handleSavedCurso() {
  fetchCursos()
}

function openNovoPrograma() {
  isEditPrograma.value = false
  programaEditData.value = null
  showModalPrograma.value = true
}

function openEditarPrograma(p: Programa) {
  isEditPrograma.value = true
  programaEditData.value = p
  showModalPrograma.value = true
}

function handleSavedPrograma() {
  fetchProgramas()
}

// Ciclos Actions
async function fetchCiclos() {
  loadingCiclos.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) return
    const res = await $fetch('/api/ciclos', { params: { id_entidade } }) as any
    ciclos.value = Array.isArray(res?.itens) ? res.itens : []
  } catch (e) {
    toast.showToast('Erro ao carregar ciclos', { type: 'error' })
  } finally {
    loadingCiclos.value = false
  }
}

function confirmDeleteCiclo(id: string) {
  cicloToDelete.value = id
  showConfirmDeleteCiclo.value = true
}

async function handleDeleteCiclo() {
  if (!cicloToDelete.value) return
  isDeletingCiclo.value = true
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')

    const res = await $fetch('/api/ciclos', {
      method: 'DELETE',
      body: { 
        id: cicloToDelete.value,
        id_entidade 
      }
    }) as any

    if (res?.success === false) {
      throw new Error(res?.message || 'Erro ao remover ciclo')
    }

    toast.showToast('Ciclo acadêmico removido', { type: 'success' })
    await fetchCiclos()
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao remover ciclo', { type: 'error' })
  } finally {
    isDeletingCiclo.value = false
    showConfirmDeleteCiclo.value = false
    cicloToDelete.value = null
  }
}

function openNovoCicloGlobal() {
  isEditCiclo.value = false
  cicloEditData.value = null
  showModalCiclo.value = true
}

function openEditarCiclo(ciclo: any) {
  isEditCiclo.value = true
  cicloEditData.value = ciclo
  showModalCiclo.value = true
}

function handleSavedCiclo() {
  fetchCiclos()
}

async function handleSaveComponente(data: ComponentePayload): Promise<void> {
  // ... (keeping existing logic)
  if (!data || typeof data !== 'object') {
    toast.showToast('Dados inválidos do componente', { type: 'error' })
    return
  }
  const nome_componente: string = (data as any).nome_componente || ''
  const descricao: string | null = (data as any).descricao ?? null
  if (!nome_componente.trim()) {
    toast.showToast('O nome do componente é obrigatório', { type: 'error' })
    return
  }
  try {
    let id_entidade = getEntidadeAtivaId()
    if (!id_entidade) {
      await store.initSession()
      id_entidade = getEntidadeAtivaId()
    }
    if (!id_entidade) {
      toast.showToast('Entidade ativa não encontrada', { type: 'error' })
      return
    }
    const res = await $fetch('/api/componentes', {
      method: 'POST',
      body: {
        id: isEditComponente.value ? componenteEditData.value?.id : undefined,
        id_entidade,
        nome_componente,
        descricao,
        usuario_id: store.user_expandido_id
      }
    }) as any
    if (res?.success) {
      toast.showToast('Componente salvo com sucesso', { type: 'success' })
      showModalComponente.value = false
      fetchComponentes()
    } else {
      toast.showToast(res?.message || 'Erro ao salvar', { type: 'error' })
    }
  } catch (e) {
    toast.showToast('Erro ao salvar componente', { type: 'error' })
  }
}

if (import.meta.client) {
  onMounted(async () => {
    const tabFromQuery = typeof route.query.tab === 'string' ? route.query.tab : null
    if (tabFromQuery && tabs.some((tab) => tab.key === tabFromQuery)) {
      activeTab.value = tabFromQuery
    }

    if (activeTab.value === 'areas') {
      await fetchAreas()
    } else if (activeTab.value === 'componentes') {
      await fetchComponentes()
    } else if (activeTab.value === 'modulos') {
      await fetchComponentes()
      await fetchModulos()
    } else if (activeTab.value === 'cursos') {
      await fetchAreas()
      await fetchCursos()
      await fetchModulos()
    } else if (activeTab.value === 'programas') {
      await fetchProgramas()
      await fetchCursos()
    } else if (activeTab.value === 'ciclos') {
      await fetchModulos()
      await fetchProgramas()
      await fetchCiclos()
    }
  })

  watch(activeTab, async (val) => {
    if (val === 'areas') {
      await fetchAreas()
    } else if (val === 'componentes') {
      await fetchComponentes()
    } else if (val === 'modulos') {
      await fetchComponentes()
      await fetchModulos()
    } else if (val === 'cursos') {
      await fetchAreas()
      await fetchCursos()
      await fetchModulos()
    } else if (val === 'programas') {
      await fetchProgramas()
      await fetchCursos()
    } else if (val === 'ciclos') {
      await fetchModulos()
      await fetchCiclos()
    }
  }, { immediate: false })
}
</script>

<template>
  <div class="page-wrap">
    <!-- Page Header Row: Tabs + Action button -->
    <div class="page-top-row">
      <!-- Pills Tabs -->
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

      <!-- Action Button (contextual) -->
      <button v-if="activeTab === 'areas'" @click="openNovaArea" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Nova Área
      </button>
      <button v-else-if="activeTab === 'componentes'" @click="openNovoComponente" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Novo Componente
      </button>
      <button v-else-if="activeTab === 'modulos'" @click="openNovoModulo" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Novo Módulo
      </button>
      <button v-else-if="activeTab === 'cursos'" @click="openNovoCurso" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Novo Curso
      </button>
      <button v-else-if="activeTab === 'ciclos'" @click="openNovoCicloGlobal" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Novo Ciclo
      </button>
      <button v-else-if="activeTab === 'programas'" @click="openNovoPrograma" class="add-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Novo Programa
      </button>

    </div>



    <!-- Tab Content -->
    <div>
      <div v-if="activeTab === 'areas'" class="flex flex-col gap-6">

         <!-- List area -->
         <div v-if="loadingAreas" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando áreas...</span>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div v-if="areas.length === 0" class="col-span-full empty-state">
                <div class="empty-icon"><Icon name="ph:folders-bold" class="w-8 h-8" /></div>
                <p class="empty-title">Nenhuma área cadastrada</p>
                <p class="empty-subtitle">Use categorias para organizar seus cursos (ex: Exatas, Saúde, Humanas)</p>
                <button @click="openNovaArea" class="empty-cta mt-4">
                  Nova Área Educacional
                </button>
             </div>

             <div 
               v-for="a in areas" 
               :key="a.id" 
               class="comp-card"
             >
                <div class="comp-card-accent"></div>
                <!-- Avatar com inicial da Área -->
                <div class="comp-avatar">
                  {{ (a.nome_area || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                   <p class="text-xs font-black text-primary truncate">{{ a.nome_area }}</p>
                   <p class="text-[9px] text-secondary/40 font-medium truncate">{{ a.descricao || 'Sem descrição' }}</p>
                </div>
                <div class="comp-actions group-hover:opacity-100">
                   <button @click="editArea(a)" class="comp-action-btn comp-action-edit" title="Editar área">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM51.31,168,136,83.31,152.69,100,68,184.69ZM48,208V196.69l11.31,11.31Zm48,0H79.31L192,95.31l16.69,16.69Z"/>
                      </svg>
                   </button>
                   <button @click="confirmDeleteArea(a.id)" class="comp-action-btn comp-action-delete" title="Excluir área">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>
                      </svg>
                   </button>
                </div>
             </div>
          </div>

          <ModalArea 
            v-model="showModalArea"
            :isEdit="isEditArea"
            :initialData="areaEditData"
            :idEntidade="getEntidadeAtivaId()"
            @saved="handleSavedArea"
          />

          <ModalConfirmacao
            v-model="showConfirmDeleteArea"
            title="Excluir Área Educacional"
            message="Tem certeza? A exclusão desta área pode afetar cursos e programas vinculados a ela."
            type="danger"
            confirmText="Excluir Área"
            :loading="isDeletingArea"
            @confirm="handleDeleteArea"
          />
      </div>
      <div v-if="activeTab === 'componentes'">
        <div class="flex flex-col gap-4">
          
          <div v-if="loadingComponentes" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
          </div>
          <div v-else class="cards-list">

          <div v-if="componentes.length === 0" class="empty-state">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,96a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,96Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,128Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,160Z"/>
                </svg>
              </div>
              <p class="empty-title">Nenhum componente educacional</p>
              <p class="empty-subtitle">Componentes são as disciplinas e matérias que compõem seus módulos</p>
              <button @click="openNovoComponente" class="empty-cta">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
                </svg>
                Cadastrar primeiro componente
              </button>
            </div>

            <div
              v-for="c in componentes"
              :key="c.id"
              class="comp-card"
            >
              <!-- Accent left bar animado -->
              <div class="comp-card-accent"></div>

              <!-- Avatar com inicial -->
              <div class="comp-avatar">
                {{ (c.nome_componente || '?').charAt(0).toUpperCase() }}
              </div>

              <!-- Content -->
              <div class="comp-content">
                <div class="comp-name">{{ c.nome_componente || '-' }}</div>
                <div class="comp-meta">
                  <span class="comp-desc">{{ c.descricao || 'Sem descrição' }}</span>
                  <span class="comp-date">{{ c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '' }}</span>
                </div>
              </div>

              <!-- Actions (aparecem no hover) -->
              <div class="comp-actions">
                <button
                  @click.stop="isEditComponente = true; componenteEditData = c; showModalComponente = true"
                  class="comp-action-btn comp-action-edit"
                  title="Editar componente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM51.31,168,136,83.31,152.69,100,68,184.69ZM48,208V196.69l11.31,11.31Zm48,0H79.31L192,95.31l16.69,16.69Z"/>
                  </svg>
                </button>
                <button
                  @click.stop="confirmDeleteComponente(c.id)"
                  class="comp-action-btn comp-action-delete"
                  title="Excluir componente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
        <ModalComponente
          v-model="showModalComponente"
          :isEdit="isEditComponente"
          :initialData="componenteEditData ? { nome_componente: componenteEditData.nome_componente, descricao: componenteEditData.descricao ?? '' } : null"
          @save="handleSaveComponente"
        />
        <ModalConfirmacao
          v-model="showConfirmDeleteComponente"
          title="Excluir Componente Educacional"
          message="Tem certeza que quer excluir este componente? Esta operação não pode ser desfeita e pode afetar os módulos que o contêm."
          type="danger"
          confirmText="Excluir Componente"
          :loading="isDeletingComponente"
          @confirm="handleDeleteComponente"
        />
      </div>

      <div v-if="activeTab === 'modulos'">
          <div v-if="loadingModulos" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
          </div>
          <div v-else class="cards-list">
            <div v-if="modulos.length === 0" class="empty-state">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/></svg>
              </div>
              <p class="empty-title">Nenhum módulo cadastrado</p>
              <p class="empty-subtitle">Módulos agrupam componentes curriculares em unidades pedagógicas</p>
              <button @click="openNovoModulo" class="empty-cta">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
                Criar primeiro módulo
              </button>
            </div>
            <div v-for="m in modulos" :key="m.id" class="comp-card">
              <div class="comp-card-accent"></div>
              <div class="comp-avatar">{{ (m.nome_modulo || '?').charAt(0).toUpperCase() }}</div>
              <div class="comp-content">
                <div class="comp-name">{{ m.nome_modulo || '-' }}</div>
                <div class="comp-meta">
                  <span class="item-badge item-badge--primary">{{ m.qtd_componentes || 0 }} comp.</span>
                  <span class="item-badge item-badge--muted">{{ m.qtd_planos || 0 }} planos</span>
                  <span class="comp-desc" v-if="m.descricao">{{ m.descricao.replace(/<[^>]*>/g, '').substring(0,80) }}</span>
                  <span class="comp-date">{{ m.criado_em ? new Date(m.criado_em).toLocaleDateString('pt-BR') : '' }}</span>
                </div>
              </div>
              <div class="comp-actions">
                <button @click.stop="openEditarModulo(m)" class="comp-action-btn comp-action-edit" title="Editar módulo">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63Z"/></svg>
                </button>
                <button @click.stop="confirmDeleteModulo(m.id)" class="comp-action-btn comp-action-delete" title="Excluir módulo">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16Z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <ModalModulo v-model="showModalModulo" :isEdit="isEditModulo" :moduloId="moduloEditData?.id" :initialData="moduloEditData" :componentes="componentes" :idEntidade="getEntidadeAtivaId()" @saved="handleSavedModulo" />
          <ModalConfirmacao
            v-model="showConfirmDeleteModulo"
            title="Excluir Módulo Educacional"
            message="Tem certeza que quer excluir este módulo? Esta operação não pode ser desfeita."
            type="danger"
            confirmText="Excluir Módulo"
            :loading="isDeletingModulo"
            @confirm="handleDeleteModulo"
          />
      </div>

      <div v-if="activeTab === 'cursos'">
        <div v-if="loadingCursos" class="py-16 flex flex-col items-center justify-center gap-3">
          <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
          <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>
        <div v-else class="cards-list">
          <div v-if="cursos.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256"><path d="M231.65,194.55,198.46,36.75a16,16,0,0,0-19-12.39L132.65,34.61A16.08,16.08,0,0,0,121,53.4l.33,1.49L112,56.56V48a16,16,0,0,0-16-16H40A16,16,0,0,0,24,48V200a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V166.23l47.06,10.51a16.09,16.09,0,0,0,19-12.39Z"/></svg>
            </div>
            <p class="empty-title">Nenhum curso cadastrado</p>
            <p class="empty-subtitle">Cursos organizam módulos em uma grade curricular completa</p>
            <button @click="openNovoCurso" class="empty-cta">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
              Criar primeiro curso
            </button>
          </div>
          <div v-for="c in cursos" :key="c.id" class="comp-card">
            <div class="comp-card-accent"></div>
            <div class="comp-avatar">{{ (c.nome_curso || '?').charAt(0).toUpperCase() }}</div>
            <div class="comp-content">
              <div class="comp-name">{{ c.nome_curso || '-' }}</div>
              <div class="comp-meta">
                <span v-if="c.nome_area" class="item-badge item-badge--secondary" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.3);">
                  {{ c.nome_area }}
                </span>
                <span class="item-badge item-badge--primary">{{ c.qtd_modulos || 0 }} módulos</span>
                <span class="comp-desc" v-if="c.descricao">{{ c.descricao.replace(/<[^>]*>/g, '').substring(0,80) }}</span>
                <span class="comp-date">{{ c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '' }}</span>
              </div>
            </div>
            <div class="comp-actions">
              <button @click.stop="openEditarCurso(c)" class="comp-action-btn comp-action-edit" title="Editar curso">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63Z"/></svg>
              </button>
              <button @click.stop="confirmDeleteCurso(c.id)" class="comp-action-btn comp-action-delete" title="Excluir curso">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16Z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <ModalCurso v-model="showModalCurso" :isEdit="isEditCurso" :cursoId="cursoEditData?.id" :initialData="cursoEditData" :modulos="modulos" :areas="areas" :idEntidade="getEntidadeAtivaId()" @saved="handleSavedCurso" />
        <ModalConfirmacao
          v-model="showConfirmDeleteCurso"
          title="Excluir Curso Educacional"
          message="Tem certeza que quer excluir este curso? Esta operação não pode ser desfeita."
          type="danger"
          confirmText="Excluir Curso"
          :loading="isDeletingCurso"
          @confirm="handleDeleteCurso"
        />
      </div>

      <div v-if="activeTab === 'ciclos'">
        <div v-if="loadingCiclos" class="py-16 flex flex-col items-center gap-4">
          <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
          <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando ciclos...</span>
        </div>
        <div v-else class="cards-list">
          <div v-if="ciclos.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Z"/></svg>
            </div>
            <p class="empty-title">Nenhum ciclo cadastrado</p>
            <p class="empty-subtitle">Ciclos definem os períodos de turmas com datas de início e fim</p>
            <button @click="openNovoCicloGlobal" class="empty-cta">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
              Agendar primeiro ciclo
            </button>
          </div>
          <div v-for="c in ciclos" :key="c.id" class="ciclo-card">
            <div class="comp-card-accent"></div>
            <div class="ciclo-year-badge">{{ c.data_ini ? new Date(c.data_ini).getFullYear() : '—' }}</div>
            <div class="comp-content">
              <div class="comp-name">{{ c.descricao || 'Ciclo Sem Nome' }}</div>
              <div class="comp-meta">
                <span class="comp-desc">Módulo: {{ c.aca_modulo?.nome_modulo || '-' }}</span>
              </div>
            </div>
            <div class="ciclo-dates">
              <span class="ciclo-dates-label">Período</span>
              <span class="ciclo-dates-value">
                {{ c.data_ini ? new Date(c.data_ini).toLocaleDateString('pt-BR') : '-' }}
                →
                {{ c.data_fim ? new Date(c.data_fim).toLocaleDateString('pt-BR') : '-' }}
              </span>
            </div>
            <button @click="openEditarCiclo(c)" class="ciclo-adjust-btn">Ajustar</button>
            <div class="comp-actions" style="margin-left: 0;">
              <button @click.stop="confirmDeleteCiclo(c.id)" class="comp-action-btn comp-action-delete" title="Excluir ciclo">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16Z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <ModalCiclo v-model="showModalCiclo" :isEdit="isEditCiclo" :cicloId="cicloEditData?.id || cicloEditData?.id_ciclo" :initialData="cicloEditData" :modulos="modulos" :programas="programas" :idEntidade="getEntidadeAtivaId()" @saved="handleSavedCiclo" />
        <ModalConfirmacao
          v-model="showConfirmDeleteCiclo"
          title="Excluir Ciclo Acadêmico"
          message="Tem certeza que quer excluir este ciclo permanentemente? O calendário atrelado a ele será excluído."
          type="danger"
          confirmText="Excluir Ciclo"
          :loading="isDeletingCiclo"
          @confirm="handleDeleteCiclo"
        />
      </div>

      <div v-if="activeTab === 'programas'">
        <div v-if="loadingProgramas" class="py-16 flex flex-col items-center justify-center gap-3">
          <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
          <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>
        <div v-else class="cards-list">
          <div v-if="programas.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256"><path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92Z"/></svg>
            </div>
            <p class="empty-title">Nenhum programa cadastrado</p>
            <p class="empty-subtitle">Programas são ofertas de cursos com turmas e ciclos definidos</p>
            <button @click="openNovoPrograma" class="empty-cta">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
              Criar primeiro programa
            </button>
          </div>
          <div v-for="p in programas" :key="p.id" class="comp-card">
            <div class="comp-card-accent"></div>
            <div class="comp-avatar">{{ (p.descricao || '?').charAt(0).toUpperCase() }}</div>
            <div class="comp-content">
              <div class="comp-name">{{ p.descricao || '-' }}</div>
              <div class="comp-meta">
                <span class="item-badge item-badge--muted">{{ p.nome_curso }}</span>
                <span class="item-badge item-badge--primary">{{ p.qtd_ciclos || 0 }} ciclos</span>
                <span class="comp-date">{{ p.criado_em ? new Date(p.criado_em).toLocaleDateString('pt-BR') : '' }}</span>
              </div>
            </div>
            <div class="comp-actions">
              <button @click.stop="openEditarPrograma(p)" class="comp-action-btn comp-action-edit" title="Editar programa">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63Z"/></svg>
              </button>
            </div>
          </div>
        </div>
        <ModalPrograma v-model="showModalPrograma" :isEdit="isEditPrograma" :programaId="programaEditData?.id" :initialData="programaEditData" :cursos="cursos" :idEntidade="getEntidadeAtivaId()" @saved="handleSavedPrograma" />
      </div>
    </div>
  </div>
</template>



<style scoped>
/* ─── Page Wrap ────────────────────────────────────────────── */
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ─── Top Row: Tabs + Button ────────────────────────────────── */
.page-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

/* ─── Tabs (pill style) ─────────────────────────────────────── */
.tabs-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
}

.tab-btn {
  padding: 7px 16px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.35);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.tab-btn:hover {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.04);
}
.tab-btn--active {
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.15);
  box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.25);
}
.tab-btn--active:hover {
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.2);
}

/* ─── Add Button ────────────────────────────────────────────── */
.add-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}
.add-btn:hover {
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.45);
  transform: translateY(-1px);
}
.add-btn:active {
  transform: translateY(0);
}

/* ─── Cards List ────────────────────────────────────────────── */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── Component Card ────────────────────────────────────────── */
.comp-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
  cursor: default;
}
.comp-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  background: rgba(139, 92, 246, 0.04);
  transform: translateX(2px);
}

/* Accent left bar */
.comp-card-accent {
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, #7c3aed, #a78bfa);
  opacity: 0;
  transition: opacity 0.2s ease, top 0.2s ease, bottom 0.2s ease;
}
.comp-card:hover .comp-card-accent {
  opacity: 1;
  top: 15%;
  bottom: 15%;
}

/* Avatar */
.comp-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease;
  letter-spacing: -0.02em;
}
.comp-card:hover .comp-avatar {
  background: rgba(139, 92, 246, 0.18);
  border-color: rgba(139, 92, 246, 0.3);
}

/* Content */
.comp-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comp-name {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comp-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comp-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.28);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.comp-date {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.18);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
  flex-shrink: 0;
}

/* Actions (hidden, revealed on hover) */
.comp-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.18s ease, transform 0.18s ease;
  flex-shrink: 0;
}
.comp-card:hover .comp-actions {
  opacity: 1;
  transform: translateX(0);
}

.comp-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.comp-action-edit {
  background: rgba(139, 92, 246, 0.08);
  color: rgba(139, 92, 246, 0.6);
  border-color: rgba(139, 92, 246, 0.12);
}
.comp-action-edit:hover {
  background: rgba(139, 92, 246, 0.18);
  color: #c4b5fd;
  border-color: rgba(139, 92, 246, 0.3);
}

.comp-action-delete {
  background: rgba(239, 68, 68, 0.06);
  color: rgba(239, 68, 68, 0.4);
  border-color: rgba(239, 68, 68, 0.08);
}
.comp-action-delete:hover {
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.25);
}

/* ─── Empty State ───────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 32px;
  border: 1px dashed rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.01);
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(139, 92, 246, 0.5);
}

.empty-title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  margin: 4px 0 0;
}

.empty-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  max-width: 300px;
  line-height: 1.6;
  margin: 0;
}

.empty-cta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
  padding: 9px 20px;
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.15s ease;
}
.empty-cta:hover {
  background: rgba(139, 92, 246, 0.18);
  border-color: rgba(139, 92, 246, 0.35);
  color: #c4b5fd;
}
/* ─── Item Badges ────────────────────────────────────────────── */
.item-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  flex-shrink: 0;
}
.item-badge--primary {
  background: rgba(139, 92, 246, 0.12);
  color: #a78bfa;
}
.item-badge--muted {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.35);
}

/* ─── Ciclo Card (variant of comp-card with date column) ─────── */
.ciclo-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
  cursor: default;
}
.ciclo-card:hover {
  border-color: rgba(139, 92, 246, 0.25);
  background: rgba(139, 92, 246, 0.04);
  transform: translateX(2px);
}
.ciclo-card:hover .comp-card-accent {
  opacity: 1;
  top: 15%;
  bottom: 15%;
}
.ciclo-card:hover .comp-actions {
  opacity: 1;
  transform: translateX(0);
}

.ciclo-year-badge {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  text-align: center;
  line-height: 1.2;
}

.ciclo-dates {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
  flex-shrink: 0;
  padding: 0 4px;
}
.ciclo-dates-label {
  font-size: 8px;
  font-weight: 900;
  color: rgba(139, 92, 246, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.ciclo-dates-value {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ciclo-adjust-btn {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ciclo-adjust-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: #c4b5fd;
}
</style>

