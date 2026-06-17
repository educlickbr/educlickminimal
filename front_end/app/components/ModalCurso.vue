<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-panel modal-panel--lg">
      <!-- Accent top bar -->
      <div class="modal-accent-bar"></div>
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M231.65,194.55,198.46,36.75a16,16,0,0,0-19-12.39L132.65,34.61A16.08,16.08,0,0,0,121,53.4l.33,1.49L112,56.56V48a16,16,0,0,0-16-16H40A16,16,0,0,0,24,48V200a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V166.23l47.06,10.51a16.09,16.09,0,0,0,19-12.39Z"/></svg>
        </div>
        <div class="modal-header-text">
          <h3 class="modal-title">{{ isEdit ? 'Editar' : 'Novo' }} Curso</h3>
          <p class="modal-subtitle">Configuração da Grade Curricular</p>
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
          <span v-if="tab.key === 'grade' && modulosDoCurso.length > 0" class="modal-tab-badge">{{ modulosDoCurso.length }}</span>
          <span v-if="tab.key === 'areas' && areasDisponiveis.length > 0" class="modal-tab-badge">{{ areasDisponiveis.length }}</span>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">

        <!-- TAB: GERAL -->
        <div v-if="activeTab === 'geral'" class="flex flex-col gap-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Nome do Curso</label>
              <input 
                v-model="formCurso.nome_curso" 
                placeholder="Ex: Engenharia de Software"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Área Educacional</label>
              <select 
                v-model="formCurso.id_area"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
              >
                <option :value="null">Selecione uma área...</option>
                <option v-for="a in areasDisponiveis" :key="a.id" :value="a.id">
                  {{ a.nome_area }}
                </option>
              </select>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Descrição do Curso</label>
            <RichTextEditor
              v-model="formCurso.descricao"
              placeholder="Descreva os objetivos e o público-alvo deste curso..."
            />
          </div>
        </div>

        <!-- TAB: ÁREAS (GERENCIAMENTO) -->
        <div v-if="activeTab === 'areas'" class="flex flex-col gap-6">
           <!-- Formulário de Nova Área -->
           <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
              <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Icon name="ph:plus-circle-bold" />
                {{ formArea.id ? 'Editar Área' : 'Nova Área Educacional' }}
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1.5 md:col-span-2">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Nome da Área</label>
                  <input 
                    v-model="formArea.nome_area"
                    placeholder="Ex: Exatas, Saúde, Humanas..."
                    class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                  />
                </div>
                <div class="flex flex-col gap-1.5 justify-end">
                   <div class="flex gap-2">
                      <button 
                        @click="handleSaveArea"
                        :disabled="loadingArea || !formArea.nome_area.trim()"
                        class="flex-1 px-4 py-2.5 rounded bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all"
                      >
                        {{ loadingArea ? 'Savin...' : (formArea.id ? 'Atualizar' : 'Criar Área') }}
                      </button>
                      <button 
                        v-if="formArea.id"
                        @click="resetFormArea"
                        class="px-3 py-2.5 rounded border border-secondary/10 text-secondary hover:bg-white/5 transition-all"
                      >
                        <Icon name="ph:x-bold" />
                      </button>
                   </div>
                </div>
              </div>
           </div>

           <!-- Lista de Áreas -->
           <div class="flex flex-col gap-3">
              <p class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">
                Áreas Cadastradas ({{ areasDisponiveis.length }})
              </p>
              
              <div v-if="loadingListAreas" class="py-4 flex justify-center">
                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
              </div>

              <div v-else-if="areasDisponiveis.length === 0" class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-div-5 rounded-lg border border-secondary/5">
                Nenhuma área cadastrada para esta entidade.
              </div>

              <div 
                v-for="a in areasDisponiveis" 
                :key="a.id"
                class="flex items-center justify-between px-4 py-3 rounded-lg border border-secondary/5 bg-div-10 group hover:border-primary/20 transition-all"
              >
                  <span class="text-xs font-black text-primary">{{ a.nome_area }}</span>
                  <div class="flex items-center gap-2">
                    <button @click="editArea(a)" class="p-1.5 text-secondary/30 hover:text-primary transition-all">
                      <Icon name="ph:pencil-simple-bold" />
                    </button>
                    <button @click="handleDeleteArea(a.id)" class="p-1.5 text-secondary/30 hover:text-red-400 transition-all">
                      <Icon name="ph:trash-bold" />
                    </button>
                  </div>
              </div>
           </div>
        </div>

        <!-- TAB: GRADE (MÓDULOS) -->
        <div v-if="activeTab === 'grade'" class="flex flex-col gap-6">
          <!-- Aviso se curso ainda não foi salvo -->
          <div v-if="!isEdit && !savedCursoId" class="py-12 text-center bg-div-10/30 rounded-xl border border-dashed border-secondary/10">
            <Icon name="ph:info-duotone" class="w-10 h-10 text-secondary/20 mx-auto mb-3" />
            <p class="text-xs text-secondary/60 font-medium">Salve o curso primeiro para gerenciar a grade curricular.</p>
          </div>

          <div v-else class="flex flex-col gap-6">
            <!-- Formulário para adicionar módulo -->
            <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
              <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Icon name="ph:plus-circle-bold" />
                Adicionar Módulo à Grade
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="flex flex-col gap-1.5 md:col-span-3">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Módulo Acadêmico</label>
                  <select 
                    v-model="formCM.id_modulo"
                    class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                  >
                    <option :value="null" disabled>Selecione um módulo disponível...</option>
                    <option 
                      v-for="m in modulosDisponiveis" 
                      :key="m.id" 
                      :value="m.id"
                    >
                      {{ m.nome_modulo }}
                    </option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Ordem (Posição)</label>
                  <input 
                    type="number"
                    v-model="formCM.ordem"
                    class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                  />
                </div>
              </div>
              <div class="flex justify-end">
                <button 
                  @click="handleAddModulo"
                  :disabled="loadingCM || !formCM.id_modulo"
                  class="px-6 py-1.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all"
                >
                  {{ loadingCM ? 'Vinculando...' : 'Vincular Módulo' }}
                </button>
              </div>
            </div>

            <!-- Lista de módulos vinculados -->
            <div class="flex flex-col gap-3">
              <p class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">
                Módulos na Grade Curricular ({{ modulosDoCurso.length }})
              </p>

              <div v-if="loadingModulosCurso" class="py-4 flex justify-center">
                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
              </div>

              <div v-else-if="modulosDoCurso.length === 0" class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-div-5 rounded-lg border border-secondary/5">
                Nenhum módulo vinculado a este curso.
              </div>

              <div 
                v-for="mc in modulosDoCurso" 
                :key="mc.id_modulo"
                class="flex items-center gap-0 rounded-lg border border-secondary/5 bg-div-10 group hover:border-primary/20 transition-all overflow-hidden"
              >
                <!-- Ordem Badge -->
                <div class="w-10 shrink-0 h-full flex items-center justify-center bg-div-10/50 border-r border-secondary/5">
                  <span class="text-[10px] font-black text-secondary/30 tabular-nums">{{ mc.ordem ?? 0 }}</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 px-4 py-3">
                  <p class="text-xs font-black text-primary truncate">{{ mc.nome_modulo }}</p>
                  <div class="flex items-center gap-3 mt-0.5">
                    <p v-if="mc.carga_horaria" class="text-[9px] text-secondary/40 font-bold">
                      Carga: {{ mc.carga_horaria }} min
                    </p>
                    <p class="text-[9px] text-secondary/30 font-bold italic truncate">{{ mc.descricao?.replace(/<[^>]*>/g, '').substring(0, 80) }}...</p>
                  </div>
                </div>

                <!-- Ação: Remover -->
                <button 
                  @click="handleRemoveModulo(mc.id_modulo)"
                  class="w-11 h-full flex items-center justify-center text-secondary/30 hover:text-red-400 hover:bg-red-500/5 transition-all border-l border-secondary/5"
                  title="Remover da Grade"
                  style="min-height: 48px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div v-if="activeTab === 'geral'" class="modal-footer">
        <button @click="$emit('update:modelValue', false)" class="modal-btn-cancel">Cancelar</button>
        <button @click="handleSaveCurso" :disabled="loadingCurso" class="modal-btn-save">
          {{ loadingCurso ? 'Processando...' : 'Salvar Curso' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import { useToast } from '~/composables/useToast'

interface Modulo {
  id: string
  nome_modulo: string
}

interface ModuloCurso {
  id_modulo: string
  nome_modulo: string
  descricao?: string | null
  carga_horaria?: number | null
  ordem?: number
}

const props = defineProps<{
  modelValue: boolean
  isEdit?: boolean
  cursoId?: string | null
  initialData?: any | null
  idEntidade?: string | null
  modulos: Modulo[] // Módulos disponíveis para escolha
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const store = useAppStore()
const toast = useToast()

const tabs = [
  { key: 'areas', label: '1. Áreas' },
  { key: 'geral', label: '2. Informações Gerais' },
  { key: 'grade', label: '3. Grade Curricular' }
]
const activeTab = ref('geral')

const savedCursoId = ref<string | null>(null)
const currentCursoId = computed(() => props.cursoId || savedCursoId.value)

// ============================================================
// Curso — Dados Gerais
// ============================================================
const loadingCurso = ref(false)
const formCurso = reactive({
  nome_curso: '',
  descricao: '',
  id_area: null as string | null
})

// ============================================================
// Áreas — Gestão
// ============================================================
const loadingArea = ref(false)
const loadingListAreas = ref(false)
const areasDisponiveis = ref<any[]>([])
const formArea = reactive({
  id: null as string | null,
  nome_area: '',
  descricao: ''
})

function resetFormArea() {
  formArea.id = null
  formArea.nome_area = ''
  formArea.descricao = ''
}

function editArea(area: any) {
  formArea.id = area.id
  formArea.nome_area = area.nome_area
  formArea.descricao = area.descricao || ''
}

async function fetchAreas() {
  const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
  if (!id_entidade) return

  loadingListAreas.value = true
  try {
    const data = await $fetch('/api/areas', {
      method: 'GET',
      params: { id_entidade }
    }) as any
    areasDisponiveis.value = data?.itens || []
  } catch (e) {
    console.error('Erro ao buscar áreas', e)
  } finally {
    loadingListAreas.value = false
  }
}

async function handleSaveArea() {
  const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
  if (!id_entidade) return

  loadingArea.value = true
  try {
    const res = await $fetch('/api/areas', {
      method: 'POST',
      body: {
        ...formArea,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast(formArea.id ? 'Área atualizada!' : 'Área criada!', { type: 'success' })
      resetFormArea()
      await fetchAreas()
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loadingArea.value = false
  }
}

async function handleDeleteArea(id: string) {
  if (!confirm('Tem certeza? Isso pode afetar cursos vinculados.')) return
  
  try {
    const { error } = await (store as any).$client
      .from('aca_area')
      .delete()
      .eq('id', id)

    if (error) throw error
    toast.showToast('Área removida', { type: 'success' })
    await fetchAreas()
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  }
}

// ============================================================
// Grade Curricular — Tab Grade
// ============================================================
const loadingModulosCurso = ref(false)
const loadingCM = ref(false)
const modulosDoCurso = ref<ModuloCurso[]>([])

const formCM = reactive({
  id_modulo: null as string | null,
  ordem: 0
})

const modulosDisponiveis = computed(() => {
  const idsNoCurso = new Set(modulosDoCurso.value.map(m => m.id_modulo))
  return props.modulos.filter(m => !idsNoCurso.has(m.id))
})

async function fetchModulosDoCurso() {
  if (!currentCursoId.value) return
  loadingModulosCurso.value = true
  try {
    const data = await $fetch('/api/curso_modulo', {
      method: 'GET',
      params: { 
        id_curso: currentCursoId.value,
        _t: Date.now()
      }
    }) as any
    modulosDoCurso.value = Array.isArray(data?.itens) ? data.itens : []
    // Define ordem padrão para o próximo inserido
    formCM.ordem = modulosDoCurso.value.length + 1
  } catch (e) {
    console.error('Erro ao buscar módulos do curso', e)
  } finally {
    loadingModulosCurso.value = false
  }
}

async function handleAddModulo() {
  if (!formCM.id_modulo) return
  if (!currentCursoId.value) {
    return toast.showToast('Salve o curso primeiro', { type: 'error' })
  }

  loadingCM.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/curso_modulo', {
      method: 'POST',
      body: {
        id_curso: currentCursoId.value,
        id_modulo: formCM.id_modulo,
        ordem: formCM.ordem,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast('Módulo adicionado à grade!', { type: 'success' })
      formCM.id_modulo = null
      await fetchModulosDoCurso()
    } else {
      throw new Error(res?.message || 'Erro ao vincular módulo')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loadingCM.value = false
  }
}

async function handleRemoveModulo(id_modulo: string) {
  if (!currentCursoId.value) return

  try {
    const res = await $fetch('/api/curso_modulo', {
      method: 'DELETE',
      body: {
        id_curso: currentCursoId.value,
        id_modulo
      }
    }) as any

    if (res?.success) {
      toast.showToast('Módulo removido da grade', { type: 'success' })
      await fetchModulosDoCurso()
    } else {
      throw new Error(res?.message || 'Erro ao remover módulo')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  }
}

// ============================================================
// Save do Curso
// ============================================================
async function handleSaveCurso() {
  if (!formCurso.nome_curso.trim()) {
    return toast.showToast('O nome do curso é obrigatório', { type: 'error' })
  }

  loadingCurso.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    const res = await $fetch('/api/cursos', {
      method: 'POST',
      body: {
        id: props.cursoId,
        id_entidade,
        nome_curso: formCurso.nome_curso,
        descricao: formCurso.descricao,
        id_area: formCurso.id_area,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast('Curso salvo com sucesso!', { type: 'success' })
      if (res.id) savedCursoId.value = res.id
      emit('saved')
      if (!props.isEdit) activeTab.value = 'grade'
    } else {
      throw new Error(res?.message || 'Erro ao salvar curso')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loadingCurso.value = false
  }
}

// Watchers
watch(() => props.modelValue, async (val) => {
  if (val) {
    activeTab.value = props.isEdit ? 'geral' : 'areas'
    savedCursoId.value = null
    await fetchAreas()
    
    if (props.initialData) {
      formCurso.nome_curso = props.initialData.nome_curso || ''
      formCurso.descricao = props.initialData.descricao || ''
      formCurso.id_area = props.initialData.id_area || null
      if (props.cursoId) await fetchModulosDoCurso()
    } else {
      formCurso.nome_curso = ''
      formCurso.descricao = ''
      formCurso.id_area = null
      modulosDoCurso.value = []
    }
    formCM.id_modulo = null
    resetFormArea()
  }
}, { immediate: true })

watch(activeTab, async (tab) => {
  if (tab === 'grade' && currentCursoId.value) {
    await fetchModulosDoCurso()
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
textarea::placeholder { color: var(--field-placeholder) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):hover,
textarea:hover { background: var(--field-bg-hover) !important; }
select:hover { background-color: var(--field-bg-select-hover) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus,
select:focus, textarea:focus {
  border-color: var(--field-border-focus) !important;
  box-shadow: var(--field-shadow-focus) !important;
  outline: none !important;
}
.modal-overlay { position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);padding:16px;animation:fadeIn 0.15s ease; }
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-panel { position:relative;background:#0f0f17;border:1px solid rgba(139,92,246,0.18);border-radius:16px;width:100%;max-width:680px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(139,92,246,0.1);animation:slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1); }
.modal-panel--lg{max-width:900px;max-height:92vh;}
@keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.modal-accent-bar{height:3px;background:linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed);flex-shrink:0;}
.modal-header{display:flex;align-items:center;gap:14px;padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
.modal-header-icon{width:40px;height:40px;border-radius:10px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.2);color:#a78bfa;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.modal-header-text{flex:1;}
.modal-title{font-size:13px;font-weight:800;color:#e8e6f0;letter-spacing:0.01em;}
.modal-subtitle{font-size:10px;font-weight:700;color:rgba(139,92,246,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-top:2px;}
.modal-close-btn{width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;}
.modal-close-btn:hover{background:rgba(255,255,255,0.1);color:#fff;}
.modal-tabs{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);padding:0 20px;flex-shrink:0;}
.modal-tab-btn{padding:12px 16px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.3);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all 0.15s ease;display:flex;align-items:center;gap:6px;}
.modal-tab-btn:hover{color:rgba(255,255,255,0.6);}
.modal-tab-btn--active{color:#a78bfa;border-bottom-color:#8b5cf6;}
.modal-tab-badge{font-size:9px;font-weight:900;background:rgba(139,92,246,0.18);color:#a78bfa;padding:1px 6px;border-radius:999px;}
.modal-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);flex-shrink:0;}
.modal-btn-cancel{padding:10px 22px;border-radius:9px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.45);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;transition:all 0.15s ease;}
.modal-btn-cancel:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.modal-btn-save{padding:10px 28px;border-radius:9px;border:none;background:linear-gradient(135deg,#7c3aed,#8b5cf6);color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;transition:all 0.15s ease;box-shadow:0 4px 14px rgba(139,92,246,0.35);display:flex;align-items:center;gap:6px;}
.modal-btn-save:hover{background:linear-gradient(135deg,#6d28d9,#7c3aed);box-shadow:0 6px 20px rgba(139,92,246,0.5);}
.modal-btn-save:disabled{opacity:0.5;cursor:not-allowed;}
</style>
