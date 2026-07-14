<script setup lang="ts">
interface PendenciaPublicacao {
  id_aluno: string
  nome_aluno: string
  ra?: string | null
  total_criterios: number
  total_criterios_preenchidos: number
  falta_avaliacao: boolean
  falta_coordenador: boolean
  falta_pedagogo: boolean
  elegivel_publicacao: boolean
  publicado: boolean
}

const props = defineProps<{
  isOpen: boolean
  pendencias: PendenciaPublicacao[]
}>()

const emit = defineEmits(['close'])

const totalFaltaAvaliacao = computed(() => props.pendencias.filter((item) => item.falta_avaliacao).length)
const totalFaltaCoordenador = computed(() => props.pendencias.filter((item) => item.falta_coordenador).length)
const totalFaltaPedagogo = computed(() => props.pendencias.filter((item) => item.falta_pedagogo).length)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[320] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl border border-white/10 bg-[#16161E] shadow-2xl">
      <div class="border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-white">Pendências para publicação em lote</h3>
          <p class="text-sm text-secondary mt-1">Todos os alunos do contexto selecionado precisam estar avaliados e validados.</p>
        </div>
        <button class="text-secondary hover:text-white transition-colors" @click="emit('close')" aria-label="Fechar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="px-5 py-4 border-b border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/20">
        <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3">
          <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Critérios Pendentes</p>
          <p class="text-2xl font-black text-amber-400 mt-1">{{ totalFaltaAvaliacao }}</p>
        </div>
        <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3">
          <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Sem Coordenação</p>
          <p class="text-2xl font-black text-blue-400 mt-1">{{ totalFaltaCoordenador }}</p>
        </div>
        <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3">
          <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Sem Pedagogo(a)</p>
          <p class="text-2xl font-black text-rose-400 mt-1">{{ totalFaltaPedagogo }}</p>
        </div>
      </div>

      <div class="max-h-[55vh] overflow-y-auto px-5 py-4 space-y-3">
        <div v-if="!pendencias.length" class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Nenhuma pendência encontrada.
        </div>

        <div v-for="item in pendencias" :key="item.id_aluno" class="rounded-lg border border-white/10 bg-[#0f0f15] px-4 py-3">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div>
              <p class="text-sm font-bold text-white">{{ item.nome_aluno }}</p>
              <p class="text-[11px] text-secondary mt-1">RA: {{ item.ra || '—' }}</p>
              <p v-if="item.falta_avaliacao" class="text-[11px] text-secondary mt-1">
                Critérios preenchidos: {{ item.total_criterios_preenchidos }} de {{ item.total_criterios }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-if="item.falta_avaliacao" class="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider text-amber-400">Falta avaliação</span>
              <span v-if="item.falta_coordenador" class="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider text-blue-400">Falta coordenação</span>
              <span v-if="item.falta_pedagogo" class="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider text-rose-400">Falta pedagogo(a)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-white/10 px-5 py-4 flex justify-end">
        <button @click="emit('close')" class="px-4 py-2 rounded-lg bg-primary hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-colors">
          Entendi
        </button>
      </div>
    </div>
  </div>
</template>