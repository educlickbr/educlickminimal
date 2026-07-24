<script setup lang="ts">
import { ref } from 'vue'
import type { UseAtribuicaoReturn } from '~/composables/atribuicao/useAtribuicao'
import ModalAtribuirDocente from '~/components/atribuicao/ModalAtribuirDocente.vue'

const props = defineProps<{
  ctx: UseAtribuicaoReturn
  idEntidade: string
}>()

// ── Modal de atribuição ───────────────────────────────
const showModal = ref(false)
const modalCicloId = ref('')
const modalIdModuloComponente = ref('')
const modalIdComponente = ref<string | null>(null)
const modalComponenteNome = ref('')
const modalDocentes = ref<any[]>([])
const modalDocentesAtuais = ref<any[]>([])
const modalJaTemTitular = ref(false)

function abrirModal(ciclo: any, comp: any) {
  modalCicloId.value = ciclo.id_ciclo
  modalIdModuloComponente.value = comp.id_modulo_componente
  modalIdComponente.value = comp.id_componente || null
  modalComponenteNome.value = comp.componente_nome
  modalDocentes.value = props.ctx.getDocentesElegiveis(comp.id_componente || null)
  modalDocentesAtuais.value = comp.docentes || []
  modalJaTemTitular.value = (comp.docentes || []).some((d: any) => d.tipo === 'titular')
  showModal.value = true
}

async function salvarModal(idDocente: string, tipo: string) {
  const ok = await props.ctx.atribuirDocente(
    modalCicloId.value,
    modalIdModuloComponente.value,
    idDocente,
    tipo,
  )
  if (ok) {
    showModal.value = false
    showToast('Atribuição salva com sucesso!', 'success')
  } else {
    showToast('Erro ao salvar atribuição', 'error')
  }
}

// ── Remover atribuição ────────────────────────────────
async function remover(idAtribuicao: string) {
  const ok = await props.ctx.removerAtribuicao(idAtribuicao)
  if (ok) {
    showToast('Atribuição removida', 'success')
  } else {
    showToast('Erro ao remover atribuição', 'error')
  }
}

// ── Toast ─────────────────────────────────────────────
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('success')
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type: 'success' | 'error') {
  toastMsg.value = msg
  toastType.value = type
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3000)
}

// ── Helpers de estilo ─────────────────────────────────
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
</script>

<template>
  <div class="page-wrap flex flex-col h-full">
    <!-- Topo: filtro ano/semestre + programa selector + info -->
    <div class="page-top-row shrink-0">
      <div class="flex items-center gap-4 flex-wrap w-full">
        <!-- Filtro Ano/Semestre -->
        <div class="min-w-[140px]">
          <label class="block text-[10px] font-black text-secondary/50 uppercase tracking-[0.18em] mb-1.5">
            Ano/Semestre
          </label>
          <div class="relative">
            <select
              v-model="ctx.anoSemestreSelecionado.value"
              @change="ctx.fetchDadosIniciais()"
              class="w-full px-3 py-2.5 rounded-xl border border-secondary/10 bg-[#0f0f17] text-xs font-bold text-primary outline-none appearance-none cursor-pointer transition-all hover:border-primary/30 focus:border-primary/50"
            >
              <option value="">Todos</option>
              <option
                v-for="as in ctx.anoSemestres.value"
                :key="as.id"
                :value="as.id"
              >
                {{ as.nome }}
              </option>
            </select>
          </div>
        </div>

        <!-- Programa -->
        <div class="flex-1 min-w-[200px]">
          <label class="block text-[10px] font-black text-secondary/50 uppercase tracking-[0.18em] mb-1.5">
            Programa / Oferta
          </label>
          <div class="relative">
            <select
              v-model="ctx.programaSelecionado.value"
              class="w-full px-4 py-2.5 rounded-xl border border-secondary/10 bg-[#0f0f17] text-sm font-bold text-primary outline-none appearance-none cursor-pointer transition-all hover:border-primary/30 focus:border-primary/50"
              :disabled="ctx.programas.value.length === 0"
            >
              <option :value="null" disabled>
                — Selecione um Programa —
              </option>
              <option
                v-for="p in ctx.programas.value"
                :key="p.id"
                :value="p.id"
              >
                {{ p.descricao }}
              </option>
            </select>
            <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40">
              <Icon name="ph:caret-down-bold" class="w-4 h-4" />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0 self-end pb-1">
          <div class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">
            {{ ctx.totalAtribuicoes.value }} atribuição{{ ctx.totalAtribuicoes.value !== 1 ? 'ões' : '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading inicial -->
    <div
      v-if="ctx.loading.value"
      class="flex-1 flex items-center justify-center"
    >
      <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
    </div>

    <!-- Sem programa selecionado -->
    <div
      v-else-if="!ctx.programaSelecionado.value"
      class="flex-1 flex flex-col items-center justify-center text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-primary/40">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      </div>
      <p class="text-sm font-bold text-white/30">Selecione um programa</p>
      <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">
        Escolha uma oferta para atribuir docentes aos componentes
      </p>
    </div>

    <!-- Loading ciclos -->
    <div
      v-else-if="ctx.loadingCiclos.value"
      class="flex-1 flex items-center justify-center"
    >
      <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
    </div>

    <!-- Ciclos vazios -->
    <div
      v-else-if="ctx.ciclos.value.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Icon name="ph:folder-open" class="w-7 h-7 text-white/20" />
      </div>
      <p class="text-sm font-bold text-white/30">Nenhum ciclo encontrado</p>
      <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">
        Este programa não possui ciclos com módulos e componentes
      </p>
    </div>

    <!-- Lista de ciclos -->
    <div
      v-else
      class="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1 space-y-4"
    >
      <div
        v-for="ciclo in ctx.ciclos.value"
        :key="ciclo.id_ciclo"
        class="bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden"
      >
        <!-- Cabeçalho do ciclo -->
        <div class="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Icon name="ph:book-open" class="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 class="text-xs font-bold text-white/80">{{ ciclo.modulo_nome }}</h3>
              <p class="text-[10px] font-medium text-secondary/50">
                {{ ciclo.ciclo_descricao }}
                <span v-if="ciclo.data_ini"> · {{ ciclo.data_ini.split('-').reverse().join('/') }}</span>
                <span v-if="ciclo.data_fim"> até {{ ciclo.data_fim.split('-').reverse().join('/') }}</span>
              </p>
            </div>
          </div>
          <div class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">
            {{ ciclo.componentes?.length || 0 }} componente{{ ciclo.componentes?.length !== 1 ? 's' : '' }}
          </div>
        </div>

        <!-- Componentes -->
        <div class="divide-y divide-white/5">
          <div
            v-for="comp in ciclo.componentes || []"
            :key="comp.id_modulo_componente"
            class="px-5 py-3 flex items-center gap-4 flex-wrap"
          >
            <!-- Nome do componente -->
            <div class="flex-1 min-w-[140px]">
              <p class="text-xs font-bold text-white/70">{{ comp.componente_nome }}</p>
              <p class="text-[10px] text-secondary/40">
                {{ comp.carga_horaria ? comp.carga_horaria + ' min' : '' }}
                <span v-if="comp.obrigatorio" class="text-emerald-400/60"> · Obrigatório</span>
                <span v-else class="text-amber-400/60"> · Eletivo</span>
              </p>
            </div>

            <!-- Docentes atribuídos -->
            <div class="flex items-center gap-2 flex-wrap min-w-[140px]">
              <template v-if="comp.docentes?.length">
                <span
                  v-for="doc in comp.docentes"
                  :key="doc.id_atribuicao"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                  :class="tipoColor(doc.tipo)"
                >
                  <span>{{ doc.docente_nome }}</span>
                  <span class="opacity-60">·</span>
                  <span class="uppercase text-[9px] tracking-wider">{{ tipoLabel(doc.tipo) }}</span>
                  <button
                    @click="remover(doc.id_atribuicao)"
                    class="ml-0.5 hover:text-red-400 transition-colors"
                    title="Remover atribuição"
                  >
                    <Icon name="ph:x" class="w-3 h-3" />
                  </button>
                </span>
              </template>
              <span v-else class="text-[10px] text-secondary/30 italic">
                Nenhum docente atribuído
              </span>
            </div>

            <!-- Ações: botão para abrir modal -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                @click="abrirModal(ciclo, comp)"
                class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              >
                <span class="flex items-center gap-1">
                  <Icon name="ph:plus-circle" class="w-3.5 h-3.5" />
                  Atribuir
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div
          v-if="toastVisible"
          class="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-xs font-bold shadow-2xl border"
          :class="toastType === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'"
        >
          {{ toastMsg }}
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Atribuir -->
    <ModalAtribuirDocente
      v-model="showModal"
      :cicloId="modalCicloId"
      :idModuloComponente="modalIdModuloComponente"
      :idComponente="modalIdComponente"
      :componenteNome="modalComponenteNome"
      :docentesElegiveis="modalDocentes"
      :docentesAtuais="modalDocentesAtuais"
      :jaTemTitular="modalJaTemTitular"
      :saving="ctx.savingId.value !== null"
      @save="salvarModal"
    />
  </div>
</template>

<style scoped>
.page-wrap {
  padding: 0.25rem 1.5rem 1rem;
  height: 100%;
}

.page-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
