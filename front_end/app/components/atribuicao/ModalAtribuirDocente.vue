<script setup lang="ts">
import { ref, computed } from 'vue'

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
  // Define tipo default ao selecionar
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
    case 'titular':    return { cls: 'tipo--titular',    label: 'Titular',    dot: '#34d399' }
    case 'substituto': return { cls: 'tipo--substituto', label: 'Substituto', dot: '#fbbf24' }
    case 'auxiliar':   return { cls: 'tipo--auxiliar',   label: 'Auxiliar',   dot: '#38bdf8' }
    default:           return { cls: 'tipo--default',    label: tipo,         dot: 'rgba(255,255,255,0.2)' }
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
        class="modal-overlay"
        @click.self="emit('update:modelValue', false)"
      >
        <div class="modal-panel">

          <!-- Accent bar gradient -->
          <div class="modal-accent-bar" />

          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a2 2 0 0 0-2 2v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="modal-title">Atribuir Docente</h3>
              <p class="modal-subtitle">{{ componenteNome }}</p>
            </div>
            <button @click="emit('update:modelValue', false)" class="modal-close-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body custom-scrollbar">

            <!-- Aviso jaTemTitular -->
            <div v-if="jaTemTitular" class="aviso-titular">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Este componente já tem um Titular. Você pode adicionar Substituto ou Auxiliar.
            </div>

            <!-- Busca -->
            <div class="search-wrap">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                v-model="busca"
                type="text"
                placeholder="Buscar docente por nome ou email..."
                class="search-input"
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
                    <div class="papel-select-wrap">
                      <select
                        :value="getTipo(doc.id)"
                        @change="(e: any) => setTipo(doc.id, e.target.value)"
                        class="papel-select"
                      >
                        <option value="titular" :disabled="jaTemTitular">Titular</option>
                        <option value="substituto">Substituto</option>
                        <option value="auxiliar">Auxiliar</option>
                      </select>
                      <svg class="papel-caret" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2.5 3.5l2.5 3 2.5-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Checkbox -->
                <div class="docente-check" :class="selectedId === doc.id ? 'docente-check--active' : ''">
                  <svg v-if="selectedId === doc.id" width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3.5 5-5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <div v-if="docentesFiltrados.length === 0" class="docentes-empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="opacity-30 mb-2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a2 2 0 0 0-2 2v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                Nenhum docente encontrado
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button @click="emit('update:modelValue', false)" class="btn-cancelar">
              Cancelar
            </button>
            <button
              :disabled="!selectedId || saving"
              @click="confirmar"
              class="btn-confirmar"
              :class="(!selectedId || saving) ? 'btn-confirmar--disabled' : ''"
            >
              <span v-if="saving" class="flex items-center gap-2">
                <div class="mini-spinner-sm" />
                Salvando...
              </span>
              <span v-else>Atribuir Docente</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  background: rgba(0,0,0,0.82); backdrop-filter: blur(4px);
}

/* ── Painel ──────────────────────────────────────────── */
.modal-panel {
  position: relative;
  background: #13131a; border: 1px solid rgba(139,92,246,0.2);
  border-radius: 18px; width: 100%; max-width: 580px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08);
  animation: slideUp 0.2s ease;
}

.modal-accent-bar {
  height: 2px; flex-shrink: 0;
  background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, transparent 100%);
}

/* ── Header ──────────────────────────────────────────── */
.modal-header {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
}
.modal-header-icon {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  color: #a78bfa; display: flex; align-items: center; justify-content: center;
}
.modal-title { font-size: 14px; font-weight: 900; color: rgba(232,230,240,0.92); }
.modal-subtitle { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); margin-top: 1px; }
.modal-close-btn {
  width: 32px; height: 32px; border-radius: 9px; border: none; flex-shrink: 0;
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.15s ease;
}
.modal-close-btn:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.7); }

/* ── Body ────────────────────────────────────────────── */
.modal-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }

/* Aviso */
.aviso-titular {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 14px; border-radius: 10px;
  background: rgba(251,191,36,0.07); border: 1px solid rgba(251,191,36,0.18);
  color: #fbbf24; font-size: 11px; font-weight: 700;
}

/* Busca */
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.2); pointer-events: none; }
.search-input {
  width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px;
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.8); font-size: 12px; outline: none;
  transition: border-color 0.15s ease;
}
.search-input::placeholder { color: rgba(255,255,255,0.18); }
.search-input:focus { border-color: rgba(139,92,246,0.4); }

/* ── Lista de docentes ───────────────────────────────── */
.docentes-list { display: flex; flex-direction: column; gap: 6px; }

.docente-card {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px 12px 18px;
  border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
  cursor: pointer; overflow: hidden;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}
.docente-card:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
.docente-card--selected {
  border-color: rgba(139,92,246,0.4) !important;
  background: rgba(139,92,246,0.06) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139,92,246,0.15);
}

/* Accent bar lateral no card selecionado */
.docente-card-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, #7c3aed, #a78bfa);
  opacity: 0; transition: opacity 0.15s ease;
}
.docente-card--selected .docente-card-bar { opacity: 1; }

/* Avatar */
.docente-avatar {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  color: #a78bfa; font-size: 14px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
}

/* Info */
.docente-info { flex: 1; min-width: 0; }
.docente-name-row { display: flex; align-items: center; gap: 8px; }
.docente-name { font-size: 13px; font-weight: 800; color: rgba(232,230,240,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.docente-email { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.28); margin-top: 1px; }

/* Badge já atribuído */
.doc-atribuido-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 7px; border-radius: 20px; border: 1px solid transparent;
  font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  flex-shrink: 0;
}
.doc-badge-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
.tipo--titular    { background: rgba(52,211,153,0.08);  border-color: rgba(52,211,153,0.2);  color: #34d399; }
.tipo--substituto { background: rgba(251,191,36,0.08);  border-color: rgba(251,191,36,0.2);  color: #fbbf24; }
.tipo--auxiliar   { background: rgba(56,189,248,0.08);  border-color: rgba(56,189,248,0.2);  color: #38bdf8; }
.tipo--default    { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); }

/* Seletor de papel */
.papel-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.papel-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.3); flex-shrink: 0; }
.papel-select-wrap { position: relative; }
.papel-select {
  appearance: none; padding: 5px 26px 5px 10px; border-radius: 8px;
  background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.2);
  color: #c4b5fd; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
  cursor: pointer; outline: none; transition: border-color 0.15s;
}
.papel-select:focus { border-color: rgba(139,92,246,0.5); }
.papel-select option:disabled { color: rgba(255,255,255,0.2); }
.papel-caret { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: rgba(167,139,250,0.5); pointer-events: none; }

/* Checkbox */
.docente-check {
  width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s ease;
}
.docente-check--active { background: linear-gradient(135deg, #7c3aed, #8b5cf6); border-color: transparent; box-shadow: 0 2px 8px rgba(139,92,246,0.4); }
.docente-check--active svg { color: #fff; }

/* Empty docentes */
.docentes-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 0; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.1em; }

/* ── Footer ──────────────────────────────────────────── */
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
}
.btn-cancelar {
  padding: 9px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
  background: transparent; color: rgba(255,255,255,0.35);
  font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer; transition: all 0.15s ease;
}
.btn-cancelar:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); }

.btn-confirmar {
  padding: 9px 22px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: #fff; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer; transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(139,92,246,0.35);
}
.btn-confirmar:hover:not(.btn-confirmar--disabled) {
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  box-shadow: 0 6px 20px rgba(139,92,246,0.5);
  transform: translateY(-1px);
}
.btn-confirmar--disabled { background: rgba(255,255,255,0.06); box-shadow: none; cursor: not-allowed; color: rgba(255,255,255,0.2); }

/* ── Spinner ─────────────────────────────────────────── */
.mini-spinner-sm { width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transitions ─────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Scrollbar ───────────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
</style>
