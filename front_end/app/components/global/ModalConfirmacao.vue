<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  type?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-panel" :class="`border-${type || 'danger'}`">
      <div class="modal-accent-bar" :class="`bg-${type || 'danger'}`"></div>
      
      <div class="modal-body flex flex-col items-center">
        <!-- SVG Icon Centralizado -->
        <div class="mb-4 text-danger" v-if="(type || 'danger') === 'danger'">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/></svg>
        </div>
        <div class="mb-4 text-warning" v-if="type === 'warning'">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,104v40a8,8,0,0,0,16,0V104a8,8,0,0,0-16,0Zm20,68a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/></svg>
        </div>

        <h3 class="modal-title font-bold text-xl text-white mb-2">{{ title }}</h3>
        <p class="modal-message text-sm text-secondary/60">{{ message }}</p>
      </div>

      <div class="modal-footer">
        <button @click="handleCancel" class="modal-btn-cancel" :disabled="loading">
          {{ cancelText || 'Cancelar' }}
        </button>
        <button @click="handleConfirm" class="modal-btn-confirm" :class="`btn-${type || 'danger'}`" :disabled="loading">
          {{ loading ? 'Aguarde...' : (confirmText || 'Confirmar') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.85); padding: 16px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

.modal-panel {
  position: relative; background: #13131a;
  border-radius: 16px; width: 100%; max-width: 420px; overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7);
  animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);
}
.border-danger { border: 1px solid var(--color-danger); }
.border-warning { border: 1px solid var(--color-warning); }
.border-info { border: 1px solid rgba(59, 130, 246, 0.5); }

@keyframes slideUp {
  from { opacity:0; transform: translateY(16px) scale(0.98) }
  to   { opacity:1; transform: translateY(0) scale(1) }
}
.modal-accent-bar { height: 4px; flex-shrink: 0; }
.bg-danger { background: var(--color-danger); }
.bg-warning { background: var(--color-warning); }
.bg-info { background: linear-gradient(90deg, #3b82f6, #93c5fd, #3b82f6); }

.modal-body { padding: 32px 24px 24px; text-align: center; }

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.15); flex-shrink: 0;
}
.modal-btn-cancel {
  padding: 10px 22px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45);
  font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-btn-confirm {
  padding: 10px 28px; border-radius: 9px; border: none;
  font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease; color: #fff;
}
.btn-danger { background: var(--color-danger); opacity: 0.9; }
.btn-danger:hover { opacity: 1; filter: brightness(1.2); }
.btn-warning { background: var(--color-warning); opacity: 0.9; color: #111; }
.btn-warning:hover { opacity: 1; filter: brightness(1.2); }
.btn-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.btn-info:hover { filter: brightness(1.2); }
.modal-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
