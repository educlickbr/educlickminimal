<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  isEdit: boolean
  initialData?: any
  idEntidade: string | null
}>()

const emit = defineEmits(['update:modelValue', 'saved'])
const toast = useToast()

const loading = ref(false)

const form = ref({
  id: null as string | null,
  nome_interno: '',
  label: '',
  placeholder: '',
  tipo_pergunta: 'text',
  opcoes: [] as string[]
})

const tiposPergunta = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Caixa de Seleção' },
  { value: 'radio', label: 'Múltipla Escolha (Opção Única)' },
  { value: 'checkbox', label: 'Múltipla Escolha (Múltiplas Opções)' },
  { value: 'date', label: 'Data' },
  { value: 'file', label: 'Arquivo / Upload' },
]

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.isEdit && props.initialData) {
      form.value = {
        id: props.initialData.id,
        nome_interno: props.initialData.nome_interno,
        label: props.initialData.label,
        placeholder: props.initialData.placeholder || '',
        tipo_pergunta: props.initialData.tipo_pergunta || 'text',
        opcoes: Array.isArray(props.initialData.opcoes) ? [...props.initialData.opcoes] : [],
      }
    } else {
      form.value = {
        id: null,
        nome_interno: '',
        label: '',
        placeholder: '',
        tipo_pergunta: 'text',
        opcoes: []
      }
    }
  }
}, { immediate: true })

function fechar() {
  emit('update:modelValue', false)
}

function autoFillNomeInterno() {
  if (!props.isEdit && !form.value.nome_interno && form.value.label) {
     form.value.nome_interno = form.value.label
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '')
  }
}

function addOption() {
  form.value.opcoes.push('')
}

function removeOption(idx: number) {
  form.value.opcoes.splice(idx, 1)
}

async function salvar() {
  if (!form.value.label || !form.value.nome_interno || !form.value.tipo_pergunta) {
    toast.showToast('Preencha os campos obrigatórios', { type: 'error' })
    return
  }

  if (!props.idEntidade) {
    toast.showToast('Entidade não identificada', { type: 'error' })
    return
  }

  loading.value = true
  try {
    const res = await $fetch('/api/perguntas', {
      method: 'POST',
      body: {
        id: form.value.id,
        id_entidade: props.idEntidade,
        nome_interno: form.value.nome_interno,
        label: form.value.label,
        placeholder: form.value.placeholder,
        tipo_pergunta: form.value.tipo_pergunta,
        opcoes: ['select', 'radio', 'checkbox'].includes(form.value.tipo_pergunta) ? form.value.opcoes : null
      }
    }) as any

    if (res?.success) {
      toast.showToast(`Pergunta ${props.isEdit ? 'atualizada' : 'criada'}!`, { type: 'success' })
      emit('saved')
    } else {
      toast.showToast(res?.message || 'Erro ao salvar', { type: 'error' })
    }
  } catch (e: any) {
    toast.showToast(e.message || 'Erro de comunicação', { type: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="fechar">
    <div class="modal-panel">
      <div class="modal-accent-bar"></div>
      
      <div class="modal-header">
        <div class="modal-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M140,170a12,12,0,1,1-12-12A12,12,0,0,1,140,170ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
          </svg>
        </div>
        <div class="modal-header-text flex-1">
          <h3 class="modal-title">{{ isEdit ? 'Editar Pergunta' : 'Nova Pergunta' }}</h3>
          <p class="modal-subtitle">Configure este campo para seu formulário</p>
        </div>
        <button @click="fechar" class="modal-close-btn">&times;</button>
      </div>

      <div class="modal-body p-6 flex flex-col gap-4">
        <div>
          <label class="block text-xs font-bold text-secondary/60 mb-1">Título/Label da Pergunta <span class="text-red-400">*</span></label>
          <input 
            v-model="form.label" 
            type="text" 
            class="w-full text-sm p-3 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] transition-colors"
            placeholder="Ex: Qual o seu nome completo?"
            @blur="autoFillNomeInterno"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-secondary/60 mb-1">Nome Interno (Único) <span class="text-red-400">*</span></label>
            <input 
              v-model="form.nome_interno" 
              type="text" 
              class="w-full text-sm p-3 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] transition-colors"
              placeholder="Ex: nome_completo"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-secondary/60 mb-1">Tipo de Resposta <span class="text-red-400">*</span></label>
            <select 
              v-model="form.tipo_pergunta" 
              class="w-full text-sm p-3 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] transition-colors appearance-none"
            >
              <option v-for="t in tiposPergunta" :key="t.value" :value="t.value" class="bg-gray-800">{{ t.label }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-secondary/60 mb-1">Placeholder (Texto de Ajuda)</label>
          <input 
            v-model="form.placeholder" 
            type="text" 
            class="w-full text-sm p-3 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white focus:outline-none focus:border-[var(--field-border-focus)] transition-colors"
            placeholder="Ex: Digite igual consta no RG..."
          />
        </div>

        <!-- Options Configuration -->
        <div v-if="['select', 'radio', 'checkbox'].includes(form.tipo_pergunta)" class="bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 p-4 rounded-xl">
          <div class="flex items-center justify-between mb-3">
             <label class="block text-xs font-bold text-primary">Opções da Lista</label>
             <button @click="addOption" type="button" class="text-[10px] uppercase font-black bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors">+ Adicionar Opção</button>
          </div>
          <div v-if="form.opcoes.length === 0" class="text-xs text-secondary/40 italic text-center py-2">
             Nenhuma opção adicionada.
          </div>
          <div v-else class="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
             <div v-for="(opt, idx) in form.opcoes" :key="idx" class="flex items-center gap-2">
                <input v-model="form.opcoes[idx]" type="text" placeholder="Opção (ex: Sim)" class="flex-1 text-xs p-2 rounded bg-black/30 border border-white/10 text-white focus:outline-none focus:border-primary/50" />
                <button @click="removeOption(idx)" type="button" class="text-red-400 hover:text-red-300 w-6 h-6 flex items-center justify-center bg-red-400/10 rounded">&times;</button>
             </div>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button @click="fechar" class="modal-btn-cancel">Cancelar</button>
        <button @click="salvar" class="modal-btn-save" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar Pergunta' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.85); padding: 16px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

.modal-panel {
  position: relative; background: #13131a; border: 1px solid rgba(139,92,246,0.18);
  border-radius: 16px; width: 100%; max-width: 640px; overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1);
  animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);
}
@keyframes slideUp {
  from { opacity:0; transform: translateY(16px) scale(0.98) }
  to   { opacity:1; transform: translateY(0) scale(1) }
}
.modal-accent-bar { height: 3px; background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed); flex-shrink: 0; }
.modal-header { display: flex; align-items: center; gap: 14px; padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.modal-header-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.2); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-title { font-size: 14px; font-weight: 900; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.15em; }
.modal-subtitle { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
.modal-close-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.15); flex-shrink: 0; }
.modal-btn-cancel { padding: 10px 22px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease; }
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-save { padding: 10px 28px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 4px 14px rgba(139,92,246,0.35); }
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
.modal-btn-save:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
