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

// ── Mapa de tipo por docente ───────────────────────────
const tiposPorDocente = ref<Record<string, string>>({})

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      busca.value = ''
      tiposPorDocente.value = {}
      // Seta 'titular' como default se não houver
      if (!props.jaTemTitular) {
        const primeiro = props.docentesElegiveis[0]
        if (primeiro) tiposPorDocente.value[primeiro.id] = 'titular'
      } else {
        const primeiro = props.docentesElegiveis[0]
        if (primeiro) tiposPorDocente.value[primeiro.id] = 'substituto'
      }
    }
  },
)

const selectedId = ref<string | null>(null)

function toggleSelect(id: string) {
  selectedId.value = selectedId.value === id ? null : id
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
function tipoColor(tipo: string) {
  switch (tipo) {
    case 'titular': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    case 'substituto': return 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    case 'auxiliar': return 'bg-sky-500/10 border-sky-500/20 text-sky-400'
    default: return 'bg-white/5 border-white/10 text-white/40'
  }
}

function tipoLabel(tipo: string) {
  switch (tipo) {
    case 'titular': return 'Titular'
    case 'substituto': return 'Substituto'
    case 'auxiliar': return 'Auxiliar'
    default: return tipo
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.85)"
        @click.self="emit('update:modelValue', false)"
      >
        <div
          class="relative bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in"
          style="max-width: 640px; max-height: 90vh;"
        >
          <!-- Accent bar -->
          <div class="h-1 w-full bg-gradient-to-r from-primary/80 to-purple-500/80 shrink-0"></div>

          <!-- Header -->
          <div class="flex items-center gap-3 px-6 py-4 border-b border-white/5 shrink-0">
            <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Icon name="ph:user-plus" class="w-[18px] h-[18px]" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-bold text-white/80">Atribuir Docente</h3>
              <p class="text-xs text-secondary/50">{{ componenteNome }}</p>
            </div>
            <button
              @click="emit('update:modelValue', false)"
              class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-all shrink-0"
            >
              <Icon name="ph:x-bold" class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            <!-- Aviso -->
            <div
              v-if="jaTemTitular"
              class="px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-2"
            >
              <Icon name="ph:warning-circle" class="w-4 h-4 shrink-0" />
              Este componente já tem um Titular. Você pode adicionar um Substituto ou Auxiliar.
            </div>

            <!-- Busca -->
            <div class="relative">
              <Icon name="ph:magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                v-model="busca"
                type="text"
                placeholder="Buscar docente por nome ou email..."
                class="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-[#0a0a0c] border border-white/10 text-white/70 outline-none focus:border-primary/50 transition-all placeholder:text-white/15"
              />
            </div>

            <!-- Lista de docentes -->
            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="doc in docentesFiltrados"
                :key="doc.id"
                @click="toggleSelect(doc.id)"
                class="flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all"
                :class="
                  selectedId === doc.id
                    ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                "
              >
                <!-- Avatar -->
                <div
                  class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"
                >
                  <span class="text-sm font-black text-primary">
                    {{ (doc.nome || '?').charAt(0).toUpperCase() }}
                  </span>
                </div>

                <!-- Info + papel (lado a lado) -->
                <div class="flex-1 min-w-0 flex flex-col gap-1">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-bold text-white/80 truncate">{{ doc.nome }}</p>

                    <!-- Badge se já atribuído -->
                    <span
                      v-if="jaAtribuido(doc.id)"
                      class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0"
                      :class="tipoColor(jaAtribuido(doc.id)!)"
                    >
                      {{ tipoLabel(jaAtribuido(doc.id)!) }}
                    </span>
                  </div>
                  <p class="text-[11px] text-secondary/40 truncate">{{ doc.email }}</p>

                  <!-- Seletor de papel (estilo dropdown) -->
                  <div
                    v-if="selectedId === doc.id"
                    class="flex items-center gap-2 mt-1.5"
                  >
                    <label class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest shrink-0">Papel</label>
                    <div class="relative">
                      <select
                        :value="getTipo(doc.id)"
                        @change="(e: any) => setTipo(doc.id, e.target.value)"
                        @click.stop
                        class="appearance-none w-full pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold bg-[#0a0a0c] border border-white/10 text-white/70 outline-none cursor-pointer hover:border-primary/40 focus:border-primary/60 transition-all"
                      >
                        <option value="titular" :disabled="jaTemTitular">Titular</option>
                        <option value="substituto">Substituto</option>
                        <option value="auxiliar">Auxiliar</option>
                      </select>
                      <Icon name="ph:caret-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <!-- Check -->
                <div
                  class="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all"
                  :class="
                    selectedId === doc.id
                      ? 'bg-primary border-primary'
                      : 'border-white/10'
                  "
                >
                  <Icon v-if="selectedId === doc.id" name="ph:check-bold" class="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div
                v-if="docentesFiltrados.length === 0"
                class="text-center py-10 text-xs font-bold text-white/20"
              >
                Nenhum docente encontrado
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 shrink-0">
            <button
              @click="emit('update:modelValue', false)"
              class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-white/30 hover:text-white/50 transition-all"
            >
              Cancelar
            </button>
            <button
              :disabled="!selectedId || saving"
              @click="confirmar"
              class="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
              :class="
                selectedId && !saving
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
                  : 'bg-white/5 text-white/15 cursor-not-allowed'
              "
            >
              <span v-if="saving" class="flex items-center gap-2">
                <div class="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Salvando
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
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.animate-in {
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
