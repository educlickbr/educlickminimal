<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  cicloId: string
  componenteNome: string
  idModuloComponente: string
  idComponente: string | null
  docentesElegiveis: any[]
  docentesAtuais: any[]
  jaTemTitular: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', idDocente: string, tipo: string): void
}>()

// ── Busca ──────────────────────────────────────────────
const busca = ref('')
const docentesFiltrados = computed(() => {
  const q = busca.value.toLowerCase().trim()
  if (!q) return props.docentesElegiveis
  return props.docentesElegiveis.filter(
    (d: any) =>
      (d.nome || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q),
  )
})

// ── Tipo por docente ───────────────────────────────────
const tiposPorDocente = ref<Record<string, string>>({})

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      busca.value = ''
      tiposPorDocente.value = {}
      const primeiro = props.docentesElegiveis[0]
      if (primeiro) {
        tiposPorDocente.value[primeiro.id] = props.jaTemTitular ? 'substituto' : 'titular'
      }
    }
  },
)

const selectedId = ref<string | null>(null)

watch(() => props.modelValue, (v) => { if (!v) selectedId.value = null })

function toggleSelect(id: string) {
  selectedId.value = selectedId.value === id ? null : id
  if (!tiposPorDocente.value[id]) {
    tiposPorDocente.value[id] = props.jaTemTitular ? 'substituto' : 'titular'
  }
}

function getTipo(docId: string): string {
  return tiposPorDocente.value[docId] || 'substituto'
}

function setTipo(docId: string, tipo: string) {
  tiposPorDocente.value[docId] = tipo
}

function confirmar() {
  if (!selectedId.value) return
  emit('save', selectedId.value, getTipo(selectedId.value))
}

// ── Helpers ────────────────────────────────────────────
function tipoConfig(tipo: string) {
  switch (tipo) {
    case 'titular':    return { cls: 'tipo--titular',    label: 'Titular',    dot: '#10b981' }
    case 'substituto': return { cls: 'tipo--substituto', label: 'Substituto', dot: '#f59e0b' }
    case 'auxiliar':   return { cls: 'tipo--auxiliar',   label: 'Auxiliar',   dot: '#0284c7' }
    default:           return { cls: 'tipo--default',    label: tipo,         dot: 'var(--color-secondary)' }
  }
}

function jaAtribuido(docId: string): string | null {
  const a = props.docentesAtuais.find((d: any) => d.id_docente === docId)
  return a?.tipo || null
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="emit('update:modelValue', false)"
      >
        <div class="ds-modal-panel max-w-xl">

          <!-- Accent bar -->
          <div class="ds-modal-accent-bar" />

          <!-- Header -->
          <div class="ds-modal-header">
            <div class="ds-modal-header-icon">
              <Icon name="ph:user-plus-bold" class="w-5 h-5 text-primary" />
            </div>
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
              <h3 class="ds-modal-title">Atribuir Docente</h3>
              <p class="ds-modal-subtitle truncate">{{ componenteNome }}</p>
            </div>
            <button @click="emit('update:modelValue', false)" class="ds-modal-close-btn">
              &times;
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">

            <!-- Aviso jaTemTitular -->
            <div v-if="jaTemTitular" class="aviso-titular">
              <Icon name="ph:warning-circle-bold" class="w-4 h-4 text-amber-500 shrink-0" />
              <span>Este componente já possui um Titular. Você pode adicionar Substituto ou Auxiliar.</span>
            </div>

            <!-- Busca -->
            <div class="relative">
              <Icon name="ph:magnifying-glass-light" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 pointer-events-none" />
              <input
                v-model="busca"
                type="text"
                placeholder="Buscar docente por nome ou email..."
                class="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold bg-field-bg border border-field-border text-field-text placeholder-secondary/30 outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <!-- Lista de docentes -->
            <div class="docentes-list">
              <div
                v-for="doc in docentesFiltrados"
                :key="doc.id"
                @click="toggleSelect(doc.id)"
                class="docente-card"
                :class="selectedId === doc.id ? 'docente-card--selected' : ''"
              >
                <!-- Accent bar lateral no card selecionado -->
                <div class="docente-card-bar" />

                <!-- Avatar -->
                <div class="docente-avatar">
                  <span>{{ (doc.nome || '?').charAt(0).toUpperCase() }}</span>
                </div>

                <!-- Info + papel -->
                <div class="docente-info">
                  <div class="docente-name-row">
                    <p class="docente-name">{{ doc.nome }}</p>
                    <!-- Badge se já atribuído -->
                    <span
                      v-if="jaAtribuido(doc.id)"
                      class="doc-atribuido-badge"
                      :class="tipoConfig(jaAtribuido(doc.id)!).cls"
                    >
                      <div class="doc-badge-dot" :style="{ background: tipoConfig(jaAtribuido(doc.id)!).dot }" />
                      {{ tipoConfig(jaAtribuido(doc.id)!).label }}
                    </span>
                  </div>
                  <p class="docente-email">{{ doc.email }}</p>

                  <!-- Seletor de papel (aparece ao selecionar) -->
                  <div v-if="selectedId === doc.id" class="papel-row" @click.stop>
                    <label class="papel-label">Papel</label>
                    <div class="relative">
                      <select
                        :value="getTipo(doc.id)"
                        @change="(e: any) => setTipo(doc.id, e.target.value)"
                        class="papel-select"
                      >
                        <option value="titular" :disabled="jaTemTitular">Titular</option>
                        <option value="substituto">Substituto</option>
                        <option value="auxiliar">Auxiliar</option>
                      </select>
                      <Icon name="ph:caret-down-bold" class="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-primary pointer-events-none" />
                    </div>
                  </div>
                </div>

                <!-- Checkbox -->
                <div class="docente-check" :class="selectedId === doc.id ? 'docente-check--active' : ''">
                  <Icon v-if="selectedId === doc.id" name="ph:check-bold" class="w-3 h-3 text-white" />
                </div>
              </div>

              <div v-if="docentesFiltrados.length === 0" class="docentes-empty">
                <Icon name="ph:users-three-duotone" class="w-8 h-8 text-secondary/30 mb-2" />
                Nenhum docente encontrado
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="ds-modal-footer">
            <button @click="emit('update:modelValue', false)" class="ds-btn-cancel">
              Cancelar
            </button>
            <button
              :disabled="!selectedId || saving"
              @click="confirmar"
              class="ds-btn-save"
            >
              <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{{ saving ? 'Salvando...' : 'Atribuir Docente' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Aviso */
.aviso-titular {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 14px; border-radius: 10px;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25);
  color: #f59e0b; font-size: 11px; font-weight: 700;
}

/* Lista de docentes */
.docentes-list { display: flex; flex-direction: column; gap: 6px; }

.docente-card {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px 12px 18px;
  border-radius: 12px; border: 1px solid var(--color-divider);
  background: var(--color-secondary-surface);
  cursor: pointer; overflow: hidden;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}
.docente-card:hover { border-color: rgba(139,92,246,0.3); background: var(--color-secondary-surface-hover); }
.docente-card--selected {
  border-color: var(--color-primary) !important;
  background: rgba(139,92,246,0.06) !important;
  transform: translateY(-1px);
}

.docente-card-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--color-primary);
  opacity: 0; transition: opacity 0.15s ease;
}
.docente-card--selected .docente-card-bar { opacity: 1; }

.docente-avatar {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  color: var(--color-primary); font-size: 14px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
}

.docente-info { flex: 1; min-width: 0; }
.docente-name-row { display: flex; align-items: center; gap: 8px; }
.docente-name { font-size: 13px; font-weight: 800; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.docente-email { font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.6; margin-top: 1px; }

.doc-atribuido-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 7px; border-radius: 20px; border: 1px solid transparent;
  font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  flex-shrink: 0;
}
.doc-badge-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
.tipo--titular    { background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.25); color: #10b981; }
.tipo--substituto { background: rgba(245,158,11,0.10); border-color: rgba(245,158,11,0.25); color: #f59e0b; }
.tipo--auxiliar   { background: rgba(2,132,199,0.10);  border-color: rgba(2,132,199,0.25);  color: #0284c7; }
.tipo--default    { background: var(--color-secondary-surface-hover); border-color: var(--color-divider); color: var(--color-secondary); }

.papel-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.papel-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-secondary); opacity: 0.6; flex-shrink: 0; }
.papel-select {
  appearance: none; padding: 5px 26px 5px 10px; border-radius: 8px;
  background: var(--field-bg); border: 1px solid var(--field-border);
  color: var(--color-primary); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
  cursor: pointer; outline: none; transition: border-color 0.15s;
}
.papel-select:focus { border-color: rgba(139,92,246,0.5); }
.papel-select option:disabled { opacity: 0.4; }

.docente-check {
  width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0;
  border: 2px solid var(--color-divider);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s ease;
}
.docente-check--active { background: var(--color-primary); border-color: transparent; }

.docentes-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 0; font-size: 11px; font-weight: 700; color: var(--color-secondary); opacity: 0.5; text-transform: uppercase; letter-spacing: 0.1em; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 10px; }
</style>
