<script setup lang="ts">
interface ResumoConceitosTurma {
  id_turma: string
  nome_turma: string
  cod_turma?: string | null
  id_avaliacao?: string | null
  id_criterio?: string | null
  contagens: Record<string, number>
}

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  items: ResumoConceitosTurma[]
  etapa: string
  anoSemestre: string
}>()

const emit = defineEmits(['close'])

// Ordem de exibição e cores dos conceitos finais
const CONCEITOS = [
  { key: 'Aprovado(a)',               label: 'Aprovado(a)',               cor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'Aprovado(a) com Ressalvas', label: 'Aprovado(a) com Ressalvas', cor: 'text-amber-400   bg-amber-500/10   border-amber-500/20'   },
  { key: 'Não Aprovado(a)',           label: 'Não Aprovado(a)',           cor: 'text-red-400     bg-red-500/10     border-red-500/20'     },
]

const totalGeral = computed(() => {
  let total = 0
  for (const item of props.items) {
    for (const v of Object.values(item.contagens)) total += v
  }
  return total
})

const contagemGeral = computed<Record<string, number>>(() => {
  const acc: Record<string, number> = {}
  for (const item of props.items) {
    for (const [k, v] of Object.entries(item.contagens)) {
      acc[k] = (acc[k] || 0) + v
    }
  }
  return acc
})

const totalItem = (item: ResumoConceitosTurma) =>
  Object.values(item.contagens).reduce((s, v) => s + v, 0)

const barWidth = (count: number, total: number) =>
  total ? `${Math.round((count / total) * 100)}%` : '0%'
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[330] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#16161E] shadow-2xl">

      <!-- Cabeçalho -->
      <div class="border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-white">Resumo de Conceitos Finais</h3>
          <p class="text-sm text-secondary mt-1">{{ etapa }} • {{ anoSemestre }}</p>
        </div>
        <button class="text-secondary hover:text-white transition-colors" @click="emit('close')" aria-label="Fechar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Totalizadores gerais -->
      <div class="px-5 py-4 border-b border-white/10 bg-black/20">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Total avaliados</p>
            <p class="text-2xl font-black text-white mt-1">{{ totalGeral }}</p>
          </div>
          <div
            v-for="c in CONCEITOS"
            :key="c.key"
            class="rounded-lg border px-3 py-3"
            :class="c.cor"
          >
            <p class="text-[10px] uppercase tracking-wider font-bold opacity-80">{{ c.label }}</p>
            <p class="text-2xl font-black mt-1">{{ contagemGeral[c.key] || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Corpo -->
      <div class="px-5 py-4 space-y-4">

        <!-- Loading -->
        <div
          v-if="loading"
          class="rounded-lg border border-white/10 bg-[#0f0f15] px-4 py-8 flex items-center justify-center gap-3 text-sm text-secondary"
        >
          <svg class="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Carregando resumo de conceitos...
        </div>

        <!-- Vazio -->
        <div
          v-else-if="!items.length"
          class="rounded-lg border border-white/10 bg-[#0f0f15] px-4 py-8 text-sm text-secondary text-center"
        >
          Nenhuma turma encontrada para o contexto selecionado.
        </div>

        <!-- Cards por turma -->
        <div
          v-for="item in items"
          v-else
          :key="item.id_turma"
          class="rounded-xl border border-white/10 bg-[#0f0f15] overflow-hidden"
        >
          <!-- Cabeçalho do card -->
          <div class="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-bold text-white">{{ item.nome_turma }}</p>
              <p v-if="item.cod_turma" class="text-[11px] text-secondary mt-0.5">{{ item.cod_turma }}</p>
            </div>
            <span
              v-if="!item.id_avaliacao"
              class="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-secondary"
            >
              Sem avaliação
            </span>
            <span
              v-else-if="!item.id_criterio"
              class="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider text-amber-300"
            >
              Sem Conceito Final
            </span>
            <span
              v-else
              class="text-[11px] text-secondary"
            >
              {{ totalItem(item) }} avaliados
            </span>
          </div>

          <!-- Sem dados -->
          <div v-if="!item.id_criterio" class="px-4 py-4 text-[12px] text-secondary">
            Não há Conceito Final configurado ou nenhum conceito registrado.
          </div>

          <!-- Contagens -->
          <div v-else class="px-4 py-4 space-y-3">
            <div
              v-for="c in CONCEITOS"
              :key="c.key"
              class="flex items-center gap-3"
            >
              <div class="w-40 shrink-0 text-[11px] font-medium text-secondary">{{ c.label }}</div>
              <div class="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="{
                    'bg-emerald-500': c.key === 'Aprovado(a)',
                    'bg-amber-500':   c.key === 'Aprovado(a) com Ressalvas',
                    'bg-red-500':     c.key === 'Não Aprovado(a)',
                  }"
                  :style="{ width: barWidth(item.contagens[c.key] || 0, totalItem(item)) }"
                ></div>
              </div>
              <div class="w-8 text-right text-sm font-black" :class="{
                'text-emerald-400': c.key === 'Aprovado(a)',
                'text-amber-400':   c.key === 'Aprovado(a) com Ressalvas',
                'text-red-400':     c.key === 'Não Aprovado(a)',
              }">
                {{ item.contagens[c.key] || 0 }}
              </div>
            </div>

            <!-- Sem conceito atribuído -->
            <div v-if="totalItem(item) === 0" class="text-[11px] text-secondary/60 italic">
              Nenhum conceito final registrado ainda.
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
