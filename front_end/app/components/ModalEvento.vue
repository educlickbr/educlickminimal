<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-panel">
      <!-- Accent top bar -->
      <div class="modal-accent-bar"></div>
      
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-header-icon text-violet-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" opacity="0.2"></path>
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H136v48a8,8,0,0,1-16,0V128a8,8,0,0,1,8-8h56A8,8,0,0,1,192,128Z"></path>
          </svg>
        </div>
        <div class="modal-header-text">
          <h3 class="modal-title">{{ isEdit ? 'Editar' : 'Novo' }} Evento Acadêmico</h3>
          <p class="modal-subtitle">Cronograma e Marcos Escolares</p>
        </div>
        <button @click="$emit('update:modelValue', false)" class="modal-close-btn">&times;</button>
      </div>

      <!-- Content -->
      <div class="p-6 flex flex-col gap-5">
        <!-- Event Name -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Nome do Evento</label>
          <input 
            v-model="formEvento.nome_evento" 
            placeholder="Ex: Reunião de Pais, Workshop de Tecnologia..."
            class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
          />
        </div>

        <!-- Dates and Scale -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Data de Início</label>
            <input 
              v-model="formEvento.data_inicio" 
              type="date"
              class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Duração (Dias)</label>
            <input 
              v-model="formEvento.duracao" 
              type="number"
              min="1"
              class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
            />
          </div>
        </div>

        <!-- Previsto / Outcome -->
        <div class="p-3 bg-secondary/5 rounded-lg border border-secondary/10 flex justify-between items-center">
            <span class="text-[9px] font-black text-secondary uppercase tracking-widest">Término Previsto</span>
            <span class="text-xs font-mono font-bold text-primary">{{ formatDataFim }}</span>
        </div>

        <!-- Flags -->
        <div class="flex flex-col gap-3 p-4 bg-div-15 rounded-xl border border-secondary/5">
            <div class="flex items-center justify-between">
                <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-bold text-text">Sobrepor Calendário?</span>
                    <span class="text-[9px] text-secondary font-medium tracking-tight">Cancela as aulas normais nestes dias</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="formEvento.sobrescrever_calendario" class="sr-only peer">
                    <div class="w-10 h-5 bg-gray-200/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="$emit('update:modelValue', false)" class="modal-btn-cancel">Cancelar</button>
        <button 
          @click="handleSave" 
          :disabled="loading || !formEvento.nome_evento.trim() || !formEvento.data_inicio" 
          class="modal-btn-save"
        >
          <div v-if="loading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar Evento' : 'Criar Evento') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  isEdit?: boolean
  eventoId?: string | null
  initialData?: any | null
  idEntidade?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const store = useAppStore()
const toast = useToast()
const loading = ref(false)

const formEvento = reactive({
  id: null as string | null,
  nome_evento: '',
  data_inicio: '',
  duracao: 1,
  sobrescrever_calendario: false,
  descricao: ''
})

// Calcula data_fim com base no início e duração
const calculatedDataFim = computed(() => {
  if (!formEvento.data_inicio) return ''
  const date = new Date(formEvento.data_inicio + 'T12:00:00') // Usar T12:00:00 para evitar problemas de timezone
  date.setDate(date.getDate() + (parseInt(formEvento.duracao as any) || 1) - 1)
  return date.toISOString().slice(0, 10)
})

const formatDataFim = computed(() => {
  if (!calculatedDataFim.value) return '-'
  return calculatedDataFim.value.split('-').reverse().join('/')
})

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.initialData) {
      formEvento.id = props.eventoId || props.initialData.id
      formEvento.nome_evento = props.initialData.nome_evento || ''
      formEvento.data_inicio = props.initialData.data_inicio?.slice(0, 10) || ''
      formEvento.sobrescrever_calendario = !!props.initialData.sobrescrever_calendario
      formEvento.descricao = props.initialData.descricao || ''
      
      // Calcular duração retroativamente
      if (props.initialData.data_inicio && props.initialData.data_fim) {
          const start = new Date(props.initialData.data_inicio + 'T12:00:00')
          const end = new Date(props.initialData.data_fim + 'T12:00:00')
          const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          formEvento.duracao = diff > 0 ? diff : 1
      } else {
          formEvento.duracao = 1
      }
    } else {
      formEvento.id = null
      formEvento.nome_evento = ''
      formEvento.data_inicio = new Date().toISOString().slice(0, 10)
      formEvento.duracao = 1
      formEvento.sobrescrever_calendario = false
      formEvento.descricao = ''
    }
  }
}, { immediate: true })

async function handleSave() {
  if (!formEvento.nome_evento.trim() || !formEvento.data_inicio) return

  loading.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    
    const res = await $fetch('/api/eventos', {
      method: 'POST',
      body: {
        ...formEvento,
        data_fim: calculatedDataFim.value,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast(formEvento.id ? 'Evento atualizado!' : 'Evento criado com sucesso!', { type: 'success' })
      emit('saved')
      emit('update:modelValue', false)
    }
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao salvar evento', { type: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Estilos compartilhados de ModalArea.vue */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.85);
  padding: 16px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.modal-panel {
  position: relative;
  background: #0f0f17;
  border: 1px solid rgba(139,92,246,0.18);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1);
  animation: slideUp 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}
@keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

.modal-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
  flex-shrink: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.modal-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(139,92,246,0.12);
  border: 1px solid rgba(139,92,246,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-header-text { flex: 1; }
.modal-title { font-size: 13px; font-weight: 800; color: #e8e6f0; letter-spacing: 0.01em; }
.modal-subtitle { font-size: 10px; font-weight: 700; color: rgba(139,92,246,0.55); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }

.modal-close-btn {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
  font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s ease;
}
.modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.2);
}

.modal-btn-cancel {
  padding: 10px 22px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45);
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }

.modal-btn-save {
  padding: 10px 28px; border-radius: 9px; border: none;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: #fff;
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(139,92,246,0.35);
  display: flex; align-items: center; gap: 8px;
}
.modal-btn-save:hover { background: linear-gradient(135deg, #6d28d9, #7c3aed); box-shadow: 0 6px 20px rgba(139,92,246,0.5); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
