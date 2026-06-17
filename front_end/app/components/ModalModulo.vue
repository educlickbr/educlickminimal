<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-panel modal-panel--lg">
      <!-- Accent top bar -->
      <div class="modal-accent-bar"></div>
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/></svg>
        </div>
        <div class="modal-header-text">
          <h3 class="modal-title">{{ isEdit ? 'Editar' : 'Novo' }} Módulo</h3>
          <p class="modal-subtitle">Configuração pedagógica
            <span v-if="totalCargaModulo > 0" class="ml-2 text-primary font-black">· Total: {{ toHHMM(totalCargaModulo) }}</span>
          </p>
        </div>
        <button @click="$emit('update:modelValue', false)" class="modal-close-btn">&times;</button>
      </div>

      <!-- Tabs Navigation -->
      <div class="modal-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="['modal-tab-btn', activeTab === tab.key ? 'modal-tab-btn--active' : '']"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'componentes' && componentesDoModulo.length > 0"
            class="modal-tab-badge"
          >{{ componentesDoModulo.length }}</span>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">

        <!-- TAB: GERAL -->
        <div v-if="activeTab === 'geral'" class="flex flex-col gap-5">
          <!-- Row: Nome + Carga Horária -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Nome do Módulo</label>
              <input 
                v-model="formModulo.nome_modulo" 
                placeholder="Ex: Fundamentos de IA"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                Carga Horária Total
                <span class="text-secondary/30 font-bold normal-case tracking-normal">(Calculado)</span>
              </label>
              <div class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-div-10 text-sm font-black text-primary tabular-nums opacity-80 cursor-not-allowed">
                {{ toHHMM(totalCargaModulo) || '00:00' }}
              </div>
              <p class="text-[9px] text-secondary/40 font-bold px-1 italic">Obs: A carga horária é a soma dos componentes na aba seguinte.</p>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Descrição / Objetivo</label>
            <RichTextEditor
              v-model="formModulo.descricao"
              placeholder="Descreva o que será abordado neste módulo..."
            />
          </div>
        </div>

        <!-- TAB: COMPONENTES -->
        <div v-if="activeTab === 'componentes'" class="flex flex-col gap-6">
          <!-- Aviso se módulo ainda não foi salvo -->
          <div v-if="!isEdit && !savedModuloId" class="py-12 text-center bg-div-10/30 rounded-xl border border-dashed border-secondary/10">
            <Icon name="ph:info-duotone" class="w-10 h-10 text-secondary/20 mx-auto mb-3" />
            <p class="text-xs text-secondary/60 font-medium">Salve o módulo primeiro para gerenciar os componentes.</p>
          </div>

          <div v-else class="flex flex-col gap-6">
            <!-- Formulário para adicionar componente -->
            <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
              <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Icon name="ph:plus-circle-bold" />
                Adicionar Componente ao Módulo
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1.5 md:col-span-2">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Componente Curricular</label>
                  <select 
                    v-model="formMC.id_componente"
                    class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                  >
                    <option :value="null" disabled>Selecione um componente...</option>
                    <option 
                      v-for="comp in componentesDisponiveis" 
                      :key="comp.id" 
                      :value="comp.id"
                    >
                      {{ comp.nome_componente }}
                    </option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Carga Horária (h:m)</label>
                  <div class="flex items-center gap-1">
                    <input 
                      type="number"
                      v-model="formMC.horas"
                      placeholder="00"
                      min="0"
                      class="w-14 px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary text-center outline-none"
                    />
                    <span class="text-secondary/40 font-bold">:</span>
                    <input 
                      type="number"
                      v-model="formMC.minutos"
                      placeholder="00"
                      min="0"
                      max="59"
                      class="w-14 px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary text-center outline-none"
                    />
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="formMC.obrigatorio" class="w-3.5 h-3.5 accent-primary rounded" />
                  <span class="text-[10px] font-bold text-secondary/60 uppercase tracking-widest">Componente obrigatório</span>
                </label>
                <button 
                  @click="handleAddComponente"
                  :disabled="loadingMC || !formMC.id_componente"
                  class="px-4 py-1.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all"
                >
                  {{ loadingMC ? 'Adicionando...' : 'Adicionar' }}
                </button>
              </div>
            </div>

            <!-- Lista de componentes já vinculados -->
            <div class="flex flex-col gap-3">
              <p class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">
                Componentes do Módulo ({{ componentesDoModulo.length }})
              </p>

              <div v-if="loadingComponentesModulo" class="py-4 flex justify-center">
                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
              </div>

              <div v-else-if="componentesDoModulo.length === 0" class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-div-5 rounded-lg border border-secondary/5">
                Nenhum componente associado a este módulo.
              </div>

              <div 
                v-for="(mc, index) in componentesDoModulo" 
                :key="mc.id_componente"
                class="flex items-center gap-0 rounded-lg border border-secondary/5 bg-div-10 group hover:border-primary/20 transition-all overflow-hidden"
              >
                <!-- Index -->
                <div class="w-10 shrink-0 h-full flex items-center justify-center bg-div-10/50 border-r border-secondary/5">
                  <span class="text-[10px] font-black text-secondary/30 tabular-nums">{{ index + 1 }}</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 px-4 py-3">
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-black text-primary truncate">{{ mc.nome_componente }}</p>
                    <span v-if="mc.obrigatorio" class="shrink-0 text-[8px] font-black bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Obrig.</span>
                  </div>
                  <div class="flex items-center gap-3 mt-0.5">
                    <p v-if="mc.carga_horaria" class="text-[10px] font-black text-secondary/60 tabular-nums">
                      {{ Math.floor(mc.carga_horaria / 60).toString().padStart(2, '0') }}:{{ (mc.carga_horaria % 60).toString().padStart(2, '0') }}
                      <span class="text-[8px] text-secondary/20 font-bold ml-1 uppercase">({{ mc.carga_horaria }} min)</span>
                    </p>
                  </div>
                </div>

                <!-- Ação: Remover -->
                <button 
                  @click="handleRemoveComponente(mc.id_componente)"
                  class="w-11 h-full flex items-center justify-center text-secondary/30 hover:text-red-400 hover:bg-red-500/5 transition-all border-l border-secondary/5"
                  title="Remover"
                  style="min-height: 44px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: PLANOS DE AULA -->
        <div v-if="activeTab === 'planos'" class="flex flex-col gap-6">
          <div v-if="!isEdit && !savedModuloId" class="py-12 text-center bg-div-10/30 rounded-xl border border-dashed border-secondary/10">
            <Icon name="ph:info-duotone" class="w-10 h-10 text-secondary/20 mx-auto mb-3" />
            <p class="text-xs text-secondary/60 font-medium">Salve o módulo primeiro para gerenciar os planos de aula.</p>
          </div>
          
          <div v-else class="flex flex-col gap-6">
            <!-- Form Novo Plano -->
            <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
              <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Icon name="ph:plus-circle-bold" />
                {{ editingPlanoId ? 'Editar' : 'Adicionar' }} Plano de Aula
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Componente Curricular</label>
                  <select 
                    v-model="formPlano.id_componente"
                    class="w-full px-3 py-2 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                  >
                    <option :value="null" disabled>Selecione um componente...</option>
                    <option v-for="comp in componentesParaPlano" :key="comp.id" :value="comp.id">
                      {{ comp.nome_componente }}
                    </option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Título do Plano</label>
                  <input 
                    v-model="formPlano.titulo_plano" 
                    placeholder="Ex: Introdução ao Minimax"
                    class="w-full px-3 py-2 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Ementa / Conteúdo</label>
                <RichTextEditor
                  v-model="formPlano.ementa"
                  placeholder="Detalhe o conteúdo e os requisitos da aula..."
                />
              </div>
              <div class="flex justify-end gap-2">
                <button 
                  v-if="editingPlanoId" 
                  @click="resetPlanoForm"
                  class="px-3 py-1.5 rounded bg-div-10 text-[10px] font-black text-secondary uppercase tracking-widest"
                >Cancelar</button>
                <button 
                  @click="handleSavePlano"
                  :disabled="loadingPlano"
                  class="px-4 py-1.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
                >
                  {{ loadingPlano ? 'Salvando...' : (editingPlanoId ? 'Atualizar Plano' : 'Adicionar Plano') }}
                </button>
              </div>
            </div>

            <!-- Lista de Planos -->
            <div class="flex flex-col gap-3">
              <p class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">Planos Cadastrados ({{ planos.length }})</p>
              <div v-if="loadingPlanos" class="py-4 flex justify-center"><LoadingOverlay :show="true" /></div>
              <div v-else-if="planos.length === 0" class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-div-5 rounded-lg border border-secondary/5">
                Nenhum plano associado a este módulo.
              </div>
              <div 
                v-for="p in planos" :key="p.id"
                class="flex items-center justify-between p-3 rounded-lg border border-secondary/5 bg-div-10 group hover:border-primary/20 transition-all"
              >
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">{{ p.nome_componente }}</span>
                    <h5 class="text-[11px] font-bold text-primary truncate">{{ p.titulo_plano }}</h5>
                  </div>
                  <p class="text-[10px] text-secondary/50 truncate mt-0.5">{{ p.ementa?.replace(/<[^>]*>/g, '') || 'Sem ementa' }}</p>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="editPlano(p)" class="p-2 text-secondary/40 hover:text-primary transition-colors rounded">
                    <Icon name="ph:pencil-simple-bold" class="w-4 h-4" />
                  </button>
                  <button @click="confirmDeletePlano(p.id!)" class="p-2 text-secondary/40 hover:text-danger hover:bg-danger/10 transition-colors rounded" title="Excluir Plano">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="activeTab === 'geral'" class="modal-footer">
        <button @click="$emit('update:modelValue', false)" class="modal-btn-cancel">Cancelar</button>
        <button @click="handleSaveModulo" :disabled="loadingModulo" class="modal-btn-save">
          {{ loadingModulo ? 'Processando...' : 'Salvar Módulo' }}
        </button>
      </div>
    </div>
    
    <ModalConfirmacao
      v-model="showConfirmDeletePlano"
      title="Excluir Plano de Aula"
      message="Tem certeza que quer excluir este plano de aula? As referências vinculadas a ele também serão excluídas."
      type="danger"
      confirmText="Excluir Plano"
      :loading="isDeletingPlano"
      @confirm="handleDeletePlano"
    />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import { useToast } from '~/composables/useToast'

interface Componente {
  id: string
  nome_componente: string
}

interface ComponenteModulo {
  id_componente: string
  nome_componente: string
  descricao?: string | null
  carga_horaria?: number | null
  ordem?: number
  obrigatorio?: boolean
}

interface PlanoAula {
  id?: string
  id_componente: string | null
  nome_componente?: string
  titulo_plano: string
  ementa: string | null
}

const props = defineProps<{
  modelValue: boolean
  isEdit?: boolean
  moduloId?: string | null
  initialData?: any | null
  idEntidade?: string | null
  componentes: Componente[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const store = useAppStore()
const toast = useToast()

const tabs = [
  { key: 'geral', label: 'Informações Gerais' },
  { key: 'componentes', label: 'Componentes' },
  { key: 'planos', label: 'Planos de Aula' }
]
const activeTab = ref('geral')

// ID do módulo (pode ser o prop ou o que foi criado agora)
const savedModuloId = ref<string | null>(null)

const currentModuloId = computed(() => props.moduloId || savedModuloId.value)

// ============================================================
// Módulo — Dados Gerais
// ============================================================
const loadingModulo = ref(false)
const { toMinutos, toHHMM, isValid, mascara } = useCargaHoraria()
const cargaHorariaDisplay = ref('')
const cargaInvalida = computed(() => cargaHorariaDisplay.value !== '' && !isValid(cargaHorariaDisplay.value))

const formModulo = reactive({
  nome_modulo: '',
  descricao: '',
  carga_horaria: null as number | null
})

const totalCargaModulo = computed(() => {
  return componentesDoModulo.value.reduce((sum, mc) => sum + (mc.carga_horaria || 0), 0)
})

function onCargaInput(e: Event) {
  // Mantido apenas por compatibilidade técnica caso necessário algum ajuste futuro
  const val = mascara((e.target as HTMLInputElement).value)
  cargaHorariaDisplay.value = val
}

// ============================================================
// Componentes do Módulo — Tab Componentes
// ============================================================
const loadingComponentesModulo = ref(false)
const loadingMC = ref(false)
const loadingAddComponente = ref(false)
const componentesDoModulo = ref<ComponenteModulo[]>([])

const formMC = reactive({
  id_componente: null as string | null,
  horas: null as number | null,
  minutos: null as number | null,
  obrigatorio: true
})

// Componentes que ainda não estão no módulo
const componentesDisponiveis = computed(() => {
  const idsNoModulo = new Set(componentesDoModulo.value.map(mc => mc.id_componente))
  return props.componentes.filter(c => !idsNoModulo.has(c.id))
})

// Todos os componentes disponíveis para seleção nos planos (do módulo + gerais)
const componentesParaPlano = computed(() => {
  if (componentesDoModulo.value.length > 0) {
    return componentesDoModulo.value.map(mc => ({
      id: mc.id_componente,
      nome_componente: mc.nome_componente
    }))
  }
  return props.componentes
})

async function fetchComponentesDoModulo() {
  if (!currentModuloId.value) return
  loadingComponentesModulo.value = true
  try {
    const data = await $fetch('/api/modulo_componente', {
      method: 'GET',
      params: { id_modulo: currentModuloId.value }
    }) as any
    componentesDoModulo.value = Array.isArray(data?.itens) ? data.itens : []
  } catch (e) {
    console.error('Erro ao buscar componentes do módulo', e)
  } finally {
    loadingComponentesModulo.value = false
  }
}

async function handleAddComponente() {
  if (!formMC.id_componente) return
  if (!currentModuloId.value) {
    return toast.showToast('Salve o módulo primeiro', { type: 'error' })
  }

  // Calcula carga horária total em minutos
  const h = parseInt(formMC.horas as any) || 0
  const m = parseInt(formMC.minutos as any) || 0
  const totalMinutos = (h * 60) + m

  if (totalMinutos <= 0) {
    return toast.showToast('Informe a carga horária', { type: 'error' })
  }

  loadingAddComponente.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/modulo_componente', {
      method: 'POST',
      body: {
        id_modulo: currentModuloId.value,
        id_componente: formMC.id_componente,
        carga_horaria: totalMinutos,
        obrigatorio: formMC.obrigatorio,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast('Componente adicionado!', { type: 'success' })
      formMC.id_componente = null
      formMC.horas = null
      formMC.minutos = null
      await fetchComponentesDoModulo()
    } else {
      throw new Error(res?.message || 'Erro ao vincular componente')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loadingAddComponente.value = false
  }
}

async function handleRemoveComponente(id_componente: string) {
  if (!currentModuloId.value) return

  try {
    const res = await $fetch('/api/modulo_componente', {
      method: 'DELETE',
      body: {
        id_modulo: currentModuloId.value,
        id_componente
      }
    }) as any

    if (res?.success) {
      toast.showToast('Componente removido do módulo', { type: 'success' })
      await fetchComponentesDoModulo()
    } else {
      throw new Error(res?.message || 'Erro ao remover componente')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  }
}

// ============================================================
// Planos de Aula — Tab Planos
// ============================================================
const loadingPlanos = ref(false)
const loadingPlano = ref(false)
const planos = ref<PlanoAula[]>([])
const editingPlanoId = ref<string | null>(null)
const formPlano = reactive<PlanoAula>({
  id_componente: null,
  titulo_plano: '',
  ementa: ''
})

const showConfirmDeletePlano = ref(false)
const planoToDelete = ref<string | null>(null)
const isDeletingPlano = ref(false)

async function fetchPlanos() {
  if (!currentModuloId.value) return
  loadingPlanos.value = true
  try {
    const data = await $fetch('/api/plano_aula', {
      method: 'GET',
      params: { id_modulo: currentModuloId.value }
    })
    planos.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erro ao buscar planos', e)
  } finally {
    loadingPlanos.value = false
  }
}

async function handleSavePlano() {
  if (!formPlano.id_componente || !formPlano.titulo_plano.trim()) {
    return toast.showToast('Componente e título são obrigatórios', { type: 'error' })
  }

  loadingPlano.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/plano_aula', {
      method: 'POST',
      body: {
        id: editingPlanoId.value,
        id_entidade,
        id_modulo: currentModuloId.value,
        id_componente: formPlano.id_componente,
        titulo_plano: formPlano.titulo_plano,
        ementa: formPlano.ementa,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast('Plano de aula salvo!', { type: 'success' })
      resetPlanoForm()
      fetchPlanos()
    } else {
      throw new Error(res?.message || 'Erro ao salvar plano')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loadingPlano.value = false
  }
}

function editPlano(p: any) {
  editingPlanoId.value = p.id
  formPlano.id_componente = p.id_componente
  formPlano.titulo_plano = p.titulo_plano
  formPlano.ementa = p.ementa
}

function resetPlanoForm() {
  editingPlanoId.value = null
  formPlano.id_componente = null
  formPlano.titulo_plano = ''
  formPlano.ementa = ''
}

function confirmDeletePlano(id: string) {
  planoToDelete.value = id
  showConfirmDeletePlano.value = true
}

async function handleDeletePlano() {
  if (!planoToDelete.value) return
  isDeletingPlano.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')

    const res = await $fetch('/api/plano_aula', {
      method: 'DELETE',
      body: {
        id: planoToDelete.value,
        id_entidade
      }
    }) as any

    if (res?.success === false) {
      throw new Error(res?.message || 'Erro ao remover plano')
    }
    toast.showToast('Plano de aula removido', { type: 'success' })
    fetchPlanos()
  } catch(e: any) {
    toast.showToast(e.message || 'Erro ao remover plano', { type: 'error' })
  } finally {
    isDeletingPlano.value = false
    showConfirmDeletePlano.value = false
    planoToDelete.value = null
  }
}

// ============================================================
// Save do Módulo
// ============================================================
async function handleSaveModulo() {
  if (!formModulo.nome_modulo.trim()) {
    return toast.showToast('O nome do módulo é obrigatório', { type: 'error' })
  }

  loadingModulo.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/modulos', {
      method: 'POST',
      body: {
        id: props.moduloId,
        id_entidade,
        nome_modulo: formModulo.nome_modulo,
        descricao: formModulo.descricao,
        carga_horaria: totalCargaModulo.value,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast('Módulo salvo com sucesso!', { type: 'success' })
      // Guarda o id do módulo recém criado para as abas filhas
      if (res.id) {
        savedModuloId.value = res.id
      }
      emit('saved')
      if (!props.isEdit) {
        // Novo módulo: muda para aba de componentes
        activeTab.value = 'componentes'
      }
    } else {
      throw new Error(res?.message || 'Erro ao salvar módulo')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loadingModulo.value = false
  }
}

// ============================================================
// Watch — abertura do modal
// ============================================================
watch(() => props.modelValue, async (val) => {
  if (val) {
    activeTab.value = 'geral'
    savedModuloId.value = null

    if (props.initialData) {
      formModulo.nome_modulo = props.initialData.nome_modulo || ''
      formModulo.descricao = props.initialData.descricao || ''
      formModulo.carga_horaria = (props.initialData as any).carga_horaria ?? null
      cargaHorariaDisplay.value = toHHMM((props.initialData as any).carga_horaria)
      if (props.moduloId) {
        fetchPlanos()
        fetchComponentesDoModulo()
      }
    } else {
      formModulo.nome_modulo = ''
      formModulo.descricao = ''
      formModulo.carga_horaria = null
      cargaHorariaDisplay.value = ''
      planos.value = []
      componentesDoModulo.value = []
    }
    resetPlanoForm()
    formMC.id_componente = null
    formMC.horas = null
    formMC.minutos = null
    formMC.obrigatorio = true
  }
}, { immediate: true })

// Carrega componentes quando muda para aba de componentes e o módulo já existe
watch(activeTab, async (tab) => {
  if (tab === 'componentes' && currentModuloId.value) {
    await fetchComponentesDoModulo()
  }
  if (tab === 'planos' && currentModuloId.value) {
    await fetchPlanos()
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

/* ── Form fields: violet-dark tone ── */
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
textarea {
  background: var(--field-bg) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
}
select {
  background-color: var(--field-bg-select) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
  background-position: right 1rem center !important;
  background-repeat: no-repeat !important;
  background-size: 1.2em 1.2em !important;
  padding-right: 2.5rem !important;
}
select option { background: var(--field-bg-option) !important; color: var(--field-text) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"])::placeholder,
textarea::placeholder {
  color: var(--field-placeholder) !important;
}
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):hover,
textarea:hover {
  background: var(--field-bg-hover) !important;
}
select:hover { background-color: var(--field-bg-select-hover) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus,
select:focus, textarea:focus {
  border-color: var(--field-border-focus) !important;
  box-shadow: var(--field-shadow-focus) !important;
  outline: none !important;
}

/* ── Shared Modal primitives ───────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.85);
  padding: 16px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-panel {
  position: relative;
  background: #0f0f17;
  border: 1px solid rgba(139,92,246,0.18);
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1);
  animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);
}
.modal-panel--lg { max-width: 900px; max-height: 92vh; }
@keyframes slideUp { from { opacity:0; transform: translateY(16px) scale(0.98); } to { opacity:1; transform: translateY(0) scale(1); } }

.modal-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
  flex-shrink: 0;
}

.modal-header {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.modal-header-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: rgba(139,92,246,0.12);
  border: 1px solid rgba(139,92,246,0.2);
  color: #a78bfa;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.modal-header-text { flex: 1; }
.modal-title {
  font-size: 13px; font-weight: 800;
  color: #e8e6f0;
  letter-spacing: 0.01em;
}
.modal-subtitle {
  font-size: 10px; font-weight: 600;
  color: rgba(139, 92, 246, 0.55);
  text-transform: uppercase; letter-spacing: 0.1em;
  margin-top: 2px;
}
.modal-close-btn {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: none; background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.4);
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s ease;
}
.modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

.modal-tabs {
  display: flex; gap: 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.2);
  padding: 0 20px;
  flex-shrink: 0;
}
.modal-tab-btn {
  padding: 12px 16px;
  font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: rgba(255,255,255,0.3);
  background: transparent; border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer; transition: all 0.15s ease;
  display: flex; align-items: center; gap: 6px;
}
.modal-tab-btn:hover { color: rgba(255,255,255,0.6); }
.modal-tab-btn--active { color: #a78bfa; border-bottom-color: #8b5cf6; }
.modal-tab-badge {
  font-size: 9px; font-weight: 900;
  background: rgba(139,92,246,0.18);
  color: #a78bfa;
  padding: 1px 6px; border-radius: 999px;
}

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.modal-btn-cancel {
  padding: 10px 22px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.45);
  font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-save {
  padding: 10px 28px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: #fff;
  font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(139,92,246,0.35);
  display: flex; align-items: center; gap: 6px;
}
.modal-btn-save:hover { background: linear-gradient(135deg, #6d28d9, #7c3aed); box-shadow: 0 6px 20px rgba(139,92,246,0.5); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
