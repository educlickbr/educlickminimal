<template>
  <!-- Overlay: preto sólido sem blur -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @mousedown.self="$emit('update:modelValue', false)"
      >
        <Transition name="modal-slide">
          <div v-if="modelValue" class="modal-panel" role="dialog" aria-modal="true">

            <!-- Accent top bar -->
            <div class="modal-accent-bar"></div>

            <!-- Header -->
            <div class="modal-header">
              <div class="modal-header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,96a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,96Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,128Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,160Z"/>
                </svg>
              </div>
              <div class="flex flex-col gap-0.5">
                <h3 class="modal-title">{{ isEdit ? 'Editar' : 'Novo' }} Componente</h3>
                <p class="modal-subtitle">Componente educacional / curricular</p>
              </div>
              <button
                @click="$emit('update:modelValue', false)"
                class="modal-close-btn"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
                </svg>
              </button>
            </div>

            <!-- Form -->
            <form id="form-componente" @submit.prevent="handleSubmit" class="modal-body">
              <div class="field-group">
                <label class="field-label">Nome do Componente <span class="field-required">*</span></label>
                <input
                  v-model="form.nome_componente"
                  required
                  placeholder="Ex: Matemática, Língua Portuguesa..."
                  class="field-input"
                  autocomplete="off"
                />
              </div>

              <div class="field-group">
                <label class="field-label">
                  Descrição
                  <span class="field-optional">opcional</span>
                </label>
                <textarea
                  v-model="form.descricao"
                  rows="4"
                  placeholder="Descreva o objetivo ou ementa deste componente..."
                  class="field-input field-textarea"
                ></textarea>
              </div>
            </form>

            <!-- Footer -->
            <div class="modal-footer">
              <button
                type="button"
                @click="$emit('update:modelValue', false)"
                class="btn-cancel"
              >Cancelar</button>
              <button
                type="submit"
                form="form-componente"
                class="btn-save"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
                </svg>
                {{ isEdit ? 'Salvar Alterações' : 'Criar Componente' }}
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface ComponenteForm {
  nome_componente: string
  descricao: string | null
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    isEdit?: boolean
    initialData?: { nome_componente?: string; descricao?: string } | null
  }>(),
  {
    isEdit: false,
    initialData: null
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [value: ComponenteForm]
}>()

const form = reactive<ComponenteForm>({
  nome_componente: '',
  descricao: null
})

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      form.nome_componente = val.nome_componente || ''
      form.descricao = val.descricao || null
    } else {
      form.nome_componente = ''
      form.descricao = null
    }
  },
  { immediate: true }
)

function handleSubmit(): void {
  emit('save', { ...form })
  // Reset apenas se não for edição (novo registro)
  if (!props.isEdit) {
    form.nome_componente = ''
    form.descricao = null
  }
}
</script>

<style scoped>
/* ─── Overlay ─────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.85);
}

/* ─── Panel ────────────────────────────────────────────────── */
.modal-panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: #0f0f17;
  border: 1px solid rgba(139, 92, 246, 0.18);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.08),
    0 24px 64px rgba(0, 0, 0, 0.7),
    0 4px 24px rgba(139, 92, 246, 0.12);
}

/* Accent bar no topo */
.modal-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd55);
  flex-shrink: 0;
}

/* ─── Header ───────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

.modal-header-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  flex-shrink: 0;
}

.modal-title {
  font-size: 13px;
  font-weight: 800;
  color: #e8e6f0;
  letter-spacing: 0.01em;
  margin: 0;
}

.modal-subtitle {
  font-size: 10px;
  font-weight: 600;
  color: rgba(139, 92, 246, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
}

.modal-close-btn {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
}

/* ─── Body / Form ──────────────────────────────────────────── */
.modal-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-required {
  color: #a78bfa;
  font-size: 11px;
}

.field-optional {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.field-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--field-border);
  background: var(--field-bg);
  color: var(--field-text);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}
.field-input::placeholder {
  color: var(--field-placeholder);
}
.field-input:hover {
  background: var(--field-bg-hover);
}
.field-input:focus {
  border-color: var(--field-border-focus);
  box-shadow: var(--field-shadow-focus);
}

.field-textarea {
  resize: none;
  line-height: 1.6;
  font-family: inherit;
}

/* ─── Footer ───────────────────────────────────────────────── */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.btn-cancel {
  padding: 9px 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.65);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 22px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  border: 1px solid rgba(139, 92, 246, 0.5);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}
.btn-save:hover {
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.45);
  transform: translateY(-1px);
}
.btn-save:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

/* ─── Animations ───────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.modal-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.modal-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}
.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>

