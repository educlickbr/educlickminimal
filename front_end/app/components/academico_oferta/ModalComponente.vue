<template>
  <!-- Overlay: preto sólido sem blur -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @mousedown.self="$emit('update:modelValue', false)"
      >
        <Transition name="modal-slide">
          <div v-if="modelValue" class="ds-modal-panel" role="dialog" aria-modal="true">

            <!-- Accent top bar -->
            <div class="ds-modal-accent-bar"></div>

            <!-- Header -->
            <div class="ds-modal-header">
              <div class="ds-modal-header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,96a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,96Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,128Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,160Z"/>
                </svg>
              </div>
              <div class="flex flex-col gap-0.5 flex-1">
                <h3 class="ds-modal-title">{{ isEdit ? 'Editar' : 'Novo' }} Componente</h3>
                <p class="ds-modal-subtitle">Componente educacional / curricular</p>
              </div>
              <button
                @click="$emit('update:modelValue', false)"
                class="ds-modal-close-btn"
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
                <BaseField
                  v-model="form.nome_componente"
                  label="Nome do Componente"
                  required
                  placeholder="Ex: Matemática, Língua Portuguesa..."
                  autocomplete="off"
                />
              </div>

              <div class="field-group">
                <BaseField
                  v-model="form.descricao"
                  label="Descrição"
                  type="textarea"
                  optional
                  placeholder="Descreva o objetivo ou ementa deste componente..."
                  rows="4"
                />
              </div>
            </form>

            <!-- Footer -->
            <div class="ds-modal-footer">
              <button
                type="button"
                @click="$emit('update:modelValue', false)"
                class="ds-btn-cancel"
              >Cancelar</button>
              <button
                type="submit"
                form="form-componente"
                class="ds-btn-save"
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
  color: var(--color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-required {
  color: var(--color-primary);
  font-size: 11px;
}

.field-optional {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-secondary);
  background: var(--color-secondary-surface);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--field-border);
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

