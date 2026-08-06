<script setup lang="ts">
import { ref } from 'vue'
import type { UseAtribuicaoReturn } from '~/composables/atribuicao/useAtribuicao'
import AtribuicaoCicloCard from '~/components/atribuicao/AtribuicaoCicloCard.vue'
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
  if (ok) { showModal.value = false; showToast('Atribuição salva!', 'success') }
  else showToast('Erro ao salvar atribuição', 'error')
}

async function remover(idAtribuicao: string) {
  const ok = await props.ctx.removerAtribuicao(idAtribuicao)
  if (ok) showToast('Atribuição removida', 'success')
  else showToast('Erro ao remover atribuição', 'error')
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
</script>

<template>
  <div class="page-wrap flex flex-col h-full">
    <!-- ── Topo: filtros ─────────────────────────────── -->
    <div class="page-top-row shrink-0">
      <div class="flex items-end gap-5 flex-wrap w-full">

        <!-- Ano/Semestre -->
        <div class="filter-group">
          <label class="filter-label">Ano/Semestre</label>
          <div class="filter-select-wrap">
            <select
              v-model="ctx.anoSemestreSelecionado.value"
              @change="ctx.fetchDadosIniciais()"
              class="filter-select"
            >
              <option value="">Todos</option>
              <option v-for="as in ctx.anoSemestres.value" :key="as.id" :value="as.id">
                {{ as.nome }}
              </option>
            </select>
            <svg class="filter-caret" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Programa -->
        <div class="filter-group" style="flex:1; min-width:220px">
          <label class="filter-label">Programa / Oferta</label>
          <div class="filter-select-wrap">
            <select
              v-model="ctx.programaSelecionado.value"
              class="filter-select"
              :disabled="ctx.programas.value.length === 0"
            >
              <option :value="null" disabled>— Selecione um Programa —</option>
              <option v-for="p in ctx.programas.value" :key="p.id" :value="p.id">
                {{ p.descricao }}
              </option>
            </select>
            <svg class="filter-caret" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Counter -->
        <div class="filter-counter">
          {{ ctx.totalAtribuicoes.value }} atribuição{{ ctx.totalAtribuicoes.value !== 1 ? 'ões' : '' }}
        </div>
      </div>
    </div>

    <!-- Loading inicial -->
    <div v-if="ctx.loading.value" class="flex-1 flex items-center justify-center">
      <div class="mini-spinner" />
    </div>

    <!-- Sem programa -->
    <div v-else-if="!ctx.programaSelecionado.value" class="empty-state">
      <div class="empty-icon-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      </div>
      <p class="empty-title">Selecione um programa</p>
      <p class="empty-sub">Escolha uma oferta para atribuir docentes aos componentes</p>
    </div>

    <!-- Loading ciclos -->
    <div v-else-if="ctx.loadingCiclos.value" class="flex-1 flex items-center justify-center">
      <div class="mini-spinner" />
    </div>

    <!-- Ciclos vazios -->
    <div v-else-if="ctx.ciclos.value.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path d="M3 7h18M3 12h18M3 17h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-title">Nenhum ciclo encontrado</p>
      <p class="empty-sub">Este programa não possui ciclos com módulos e componentes</p>
    </div>

    <!-- ── Lista de Ciclos ─────────────────────────── -->
    <div v-else class="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1 flex flex-col gap-4">
      <AtribuicaoCicloCard
        v-for="ciclo in ctx.ciclos.value"
        :key="ciclo.id_ciclo"
        :ciclo="ciclo"
        @atribuir="abrirModal"
        @remover="remover"
      />
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div
          v-if="toastVisible"
          class="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-xs font-bold shadow-2xl border"
          :class="toastType === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'"
        >{{ toastMsg }}</div>
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
/* ── Layout ──────────────────────────────────────────── */
.page-wrap { padding: 0.25rem 1.5rem 1rem; height: 100%; }
.page-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }

/* ── Filtros ─────────────────────────────────────────── */
.filter-group { display: flex; flex-direction: column; gap: 5px; min-width: 140px; }
.filter-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(255,255,255,0.3); }
.filter-select-wrap { position: relative; }
.filter-select {
  width: 100%; padding: 9px 32px 9px 12px;
  border-radius: 10px; border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03); color: rgba(232,230,240,0.85);
  font-size: 11px; font-weight: 700; outline: none; cursor: pointer;
  appearance: none; transition: border-color 0.15s ease;
}
.filter-select:hover { border-color: rgba(139,92,246,0.25); }
.filter-select:focus { border-color: rgba(139,92,246,0.45); }
.filter-caret {
  position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
  pointer-events: none; color: rgba(255,255,255,0.15);
}
.filter-counter {
  font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
  padding-bottom: 10px;
}

/* ── Spinner ─────────────────────────────────────────── */
.mini-spinner {
  width: 22px; height: 22px;
  border: 2px solid rgba(255,255,255,0.06);
  border-top-color: rgba(139,92,246,0.6);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Empty States ────────────────────────────────────── */
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; }
.empty-icon-wrap {
  width: 60px; height: 60px;
  border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.12); margin-bottom: 16px;
}
.empty-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.25); }
.empty-sub { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.12); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.04em; }

/* ── Toast ───────────────────────────────────────────── */
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s ease; }
.toast-slide-enter-from { opacity: 0; transform: translateY(1rem); }
.toast-slide-leave-to { opacity: 0; transform: translateY(0.5rem); }
</style>
