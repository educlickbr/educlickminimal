<script setup lang="ts">
interface DashboardContextoItem {
  id_turma: string
  turma_nome: string
  cod_turma?: string | null
  id_avaliacao?: string | null
  possui_avaliacao: boolean
  status_resumo: string
  concluida: boolean
  total_alunos: number
  total_avaliadas: number
  total_nao_avaliadas: number
  total_validadas_coordenador: number
  total_nao_validadas_coordenador: number
  total_validadas_pedagogo: number
  total_nao_validadas_pedagogo: number
  total_validadas_ambos: number
  total_nao_validadas_ambos: number
  total_publicadas: number
  total_nao_publicadas: number
  total_elegiveis_publicacao: number
  total_nao_elegiveis_publicacao: number
}

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  items: DashboardContextoItem[]
  etapa: string
  anoSemestre: string
  selectedTurmaId?: string | null
}>()

const emit = defineEmits(['close'])

const resumo = computed(() => ({
  total: props.items.length,
  concluidas: props.items.filter((item) => item.concluida).length,
  pendentes: props.items.filter((item) => item.possui_avaliacao && !item.concluida).length,
  semAvaliacao: props.items.filter((item) => !item.possui_avaliacao).length,
}))

const getStatusClasses = (item: DashboardContextoItem) => {
  if (!item.possui_avaliacao) return 'bg-white/5 border-white/10 text-secondary'
  if (item.concluida) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
  return 'bg-amber-500/10 border-amber-500/20 text-amber-300'
}

const getProgressWidth = (value: number, total: number) => {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[330] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#16161E] shadow-2xl">
      <div class="border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-white">Panorama de todas as turmas</h3>
          <p class="text-sm text-secondary mt-1">{{ etapa }} • {{ anoSemestre }}</p>
        </div>
        <button class="text-secondary hover:text-white transition-colors" @click="emit('close')" aria-label="Fechar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="px-5 py-4 border-b border-white/10 bg-black/20">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Turmas no Contexto</p>
            <p class="text-2xl font-black text-white mt-1">{{ resumo.total }}</p>
          </div>
          <div class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-emerald-200 font-bold">Concluídas</p>
            <p class="text-2xl font-black text-emerald-300 mt-1">{{ resumo.concluidas }}</p>
          </div>
          <div class="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-amber-200 font-bold">Pendentes</p>
            <p class="text-2xl font-black text-amber-300 mt-1">{{ resumo.pendentes }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Sem Avaliação</p>
            <p class="text-2xl font-black text-secondary mt-1">{{ resumo.semAvaliacao }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div v-for="item in items" :key="`resumo_${item.id_turma}`" class="rounded-lg border px-3 py-3" :class="getStatusClasses(item)">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-white">{{ item.turma_nome }}</p>
                <p class="text-[11px] mt-1 opacity-80">{{ item.cod_turma || 'Sem código' }}</p>
              </div>
              <span v-if="item.id_turma === selectedTurmaId" class="px-2 py-1 rounded bg-primary/15 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">Atual</span>
            </div>
            <div class="mt-3 flex items-center justify-between gap-3">
              <span class="text-[11px] font-bold uppercase tracking-wider">{{ item.status_resumo }}</span>
              <span class="text-[11px] opacity-80">{{ item.total_alunos }} alunos</span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-5 py-4 space-y-4">
        <div v-if="loading" class="rounded-lg border border-white/10 bg-[#0f0f15] px-4 py-8 flex items-center justify-center gap-3 text-sm text-secondary">
          <svg class="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Carregando panorama das turmas...
        </div>

        <div v-else-if="!items.length" class="rounded-lg border border-white/10 bg-[#0f0f15] px-4 py-8 text-sm text-secondary text-center">
          Nenhuma turma encontrada para o contexto selecionado.
        </div>

        <div v-for="item in items" v-else :key="item.id_turma" class="rounded-xl border border-white/10 bg-[#0f0f15] overflow-hidden">
          <div class="px-4 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div class="flex items-center flex-wrap gap-2">
                <h4 class="text-base font-bold text-white">{{ item.turma_nome }}</h4>
                <span class="px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider" :class="getStatusClasses(item)">{{ item.status_resumo }}</span>
                <span v-if="item.id_turma === selectedTurmaId" class="px-2 py-1 rounded bg-primary/15 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">Turma atual</span>
              </div>
              <p class="text-[11px] text-secondary mt-1">Código: {{ item.cod_turma || '—' }} <span class="mx-1">•</span> {{ item.total_alunos }} alunos</p>
            </div>

            <div class="text-right">
              <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Publicação em lote</p>
              <p class="text-sm font-bold mt-1" :class="item.total_nao_elegiveis_publicacao === 0 && item.possui_avaliacao ? 'text-emerald-400' : 'text-amber-400'">
                {{ item.total_nao_elegiveis_publicacao === 0 && item.possui_avaliacao ? 'Liberada' : 'Bloqueada' }}
              </p>
            </div>
          </div>

          <div class="px-4 py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div class="rounded-lg border border-white/10 bg-[#16161E] p-3">
              <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Avaliadas</p>
              <p class="text-2xl font-black text-emerald-400 mt-1">{{ item.total_avaliadas }}</p>
              <p class="text-[10px] text-secondary mt-1">{{ item.total_nao_avaliadas }} não</p>
            </div>
            <div class="rounded-lg border border-white/10 bg-[#16161E] p-3">
              <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Coordenação</p>
              <p class="text-2xl font-black text-blue-400 mt-1">{{ item.total_validadas_coordenador }}</p>
              <p class="text-[10px] text-secondary mt-1">{{ item.total_nao_validadas_coordenador }} não</p>
            </div>
            <div class="rounded-lg border border-white/10 bg-[#16161E] p-3">
              <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Pedagogo(a)</p>
              <p class="text-2xl font-black text-rose-400 mt-1">{{ item.total_validadas_pedagogo }}</p>
              <p class="text-[10px] text-secondary mt-1">{{ item.total_nao_validadas_pedagogo }} não</p>
            </div>
            <div class="rounded-lg border border-white/10 bg-[#16161E] p-3">
              <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Publicadas</p>
              <p class="text-2xl font-black text-primary mt-1">{{ item.total_publicadas }}</p>
              <p class="text-[10px] text-secondary mt-1">{{ item.total_nao_publicadas }} não</p>
            </div>
          </div>

          <div class="px-4 pb-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div class="rounded-lg border border-white/10 bg-[#16161E] p-4 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-white">Validadas pelos dois</p>
                <span class="text-sm font-black text-primary">{{ item.total_validadas_ambos }}</span>
              </div>
              <div class="h-2 rounded-full bg-white/5 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" :style="{ width: getProgressWidth(item.total_validadas_ambos, item.total_alunos) }"></div>
              </div>
              <p class="text-[11px] text-secondary">{{ item.total_nao_validadas_ambos }} ainda não estão prontas pelos dois validadores.</p>
            </div>

            <div class="rounded-lg border border-white/10 bg-[#16161E] p-4 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-white">Elegíveis para publicar</p>
                <span class="text-sm font-black text-emerald-400">{{ item.total_elegiveis_publicacao }}</span>
              </div>
              <div class="h-2 rounded-full bg-white/5 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" :style="{ width: getProgressWidth(item.total_elegiveis_publicacao, item.total_alunos) }"></div>
              </div>
              <p class="text-[11px] text-secondary">{{ item.total_nao_elegiveis_publicacao }} ainda bloqueiam a publicação em lote.</p>
            </div>

            <div class="rounded-lg border border-white/10 bg-[#16161E] p-4 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-white">Publicadas</p>
                <span class="text-sm font-black text-emerald-400">{{ item.total_publicadas }}</span>
              </div>
              <div class="h-2 rounded-full bg-white/5 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-500 to-lime-300 rounded-full" :style="{ width: getProgressWidth(item.total_publicadas, item.total_alunos) }"></div>
              </div>
              <p class="text-[11px] text-secondary">{{ item.total_nao_publicadas }} ainda não publicadas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>