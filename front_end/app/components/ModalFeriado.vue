<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-panel">
      <!-- Accent top bar -->
      <div class="modal-accent-bar"></div>
      
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/>
          </svg>
        </div>
        <div class="modal-header-text">
          <h3 class="modal-title">{{ isEdit ? 'Editar' : 'Novo' }} Feriado / Recesso</h3>
          <p class="modal-subtitle">Gestão de Datas Não Letivas</p>
        </div>
        <button @click="$emit('update:modelValue', false)" class="modal-close-btn">&times;</button>
      </div>

      <!-- Content -->
      <div class="p-6 flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Nome do Feriado</label>
          <input 
            v-model="formFeriado.nome" 
            placeholder="Ex: Tiradentes, Padroeira local..."
            class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Data</label>
            <input 
              v-model="formFeriado.data" 
              type="date"
              class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Opções</label>
            <div class="flex items-center h-full gap-3 px-1">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="formFeriado.recorrente_anual" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span class="text-[10px] font-bold text-secondary uppercase tracking-tight">Recorrente Anual?</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="$emit('update:modelValue', false)" class="modal-btn-cancel">Cancelar</button>
        <button 
          @click="handleSave" 
          :disabled="loading || !formFeriado.nome.trim() || !formFeriado.data" 
          class="modal-btn-save"
        >
          <div v-if="loading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar Feriado' : 'Salvar Feriado') }}
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
  feriadoId?: string | null
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

const formFeriado = reactive({
  id: null as string | null,
  nome: '',
  data: '',
  recorrente_anual: false
})

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.initialData) {
      formFeriado.id = props.feriadoId || props.initialData.id
      formFeriado.nome = props.initialData.nome || ''
      
      // Formatar data se vier com time
      if (props.initialData.data) {
        formFeriado.data = props.initialData.data.slice(0, 10)
      } else {
        formFeriado.data = ''
      }
      
      formFeriado.recorrente_anual = !!props.initialData.recorrente_anual
    } else {
      formFeriado.id = null
      formFeriado.nome = ''
      formFeriado.data = new Date().toISOString().slice(0, 10)
      formFeriado.recorrente_anual = false
    }
  }
}, { immediate: true })

async function handleSave() {
  if (!formFeriado.nome.trim() || !formFeriado.data) return

  loading.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    
    const res = await $fetch('/api/feriados', {
      method: 'POST',
      body: {
        ...formFeriado,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    }) as any

    if (res?.success) {
      toast.showToast(formFeriado.id ? 'Feriado atualizado!' : 'Feriado criado com sucesso!', { type: 'success' })
      emit('saved')
      emit('update:modelValue', false)
    }
  } catch (e: any) {
    toast.showToast(e.message || 'Erro ao salvar feriado', { type: 'error' })
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
  color: #a78bfa;
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
