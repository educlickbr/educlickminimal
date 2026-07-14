<script setup lang="ts">
interface WeeklyRow {
  id_turma: string
  nome_turma: string
  seg: number
  ter: number
  qua: number
  qui: number
  sex: number
  sab: number
  dom: number
  total_semana: number
}

interface WeeklyTotals {
  seg: number
  ter: number
  qua: number
  qui: number
  sex: number
  sab: number
  dom: number
  total_semana: number
}

interface WeeklyItem {
  week_year: number
  week_iso: number
  week_start: string
  week_end: string
  rows: WeeklyRow[]
  totals: WeeklyTotals
}

interface SummaryByWeekItem {
  week_year: number
  week_iso: number
  week_start: string
  week_end: string
  total_semana: number
}

interface SummaryByTurmaItem {
  id_turma: string
  nome_turma: string
  total_periodo: number
}

interface WeeklyReportData {
  weeks?: WeeklyItem[]
  summary?: {
    by_week?: SummaryByWeekItem[]
    by_turma?: SummaryByTurmaItem[]
    total_geral_periodo?: number
  }
}

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  report: WeeklyReportData | null
  areaLabel: string
  anoSemestre: string
  tipoCandidatura: string
}>()

const emit = defineEmits(['close', 'print'])

const weeks = computed(() => props.report?.weeks || [])
const summaryByWeek = computed(() => props.report?.summary?.by_week || [])
const summaryByTurma = computed(() => props.report?.summary?.by_turma || [])
const totalGeral = computed(() => props.report?.summary?.total_geral_periodo || 0)

const resumoCards = computed(() => ({
  semanas: weeks.value.length,
  turmas: summaryByTurma.value.length,
  totalInscricoes: totalGeral.value,
  mediaSemanal: weeks.value.length ? Math.round(totalGeral.value / weeks.value.length) : 0
}))

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

const getWeekDates = (weekStart: string): string[] => {
  const base = new Date(`${weekStart}T00:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[330] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative z-10 w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-xl border border-white/10 bg-[#16161E] shadow-2xl">
      <div class="border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-white">Panorama Semanal de Inscrições</h3>
          <p class="text-sm text-secondary mt-1">{{ areaLabel }} • {{ anoSemestre }} • {{ tipoCandidatura }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded border border-primary/40 bg-primary/10 text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
            @click="emit('print')"
            :disabled="loading || !weeks.length"
          >
            Imprimir PDF
          </button>
          <button class="text-secondary hover:text-white transition-colors" @click="emit('close')" aria-label="Fechar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div class="px-5 py-4 border-b border-white/10 bg-black/20">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Semanas</p>
            <p class="text-2xl font-black text-white mt-1">{{ resumoCards.semanas }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Turmas no Período</p>
            <p class="text-2xl font-black text-white mt-1">{{ resumoCards.turmas }}</p>
          </div>
          <div class="rounded-lg border border-primary/20 bg-primary/10 px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-primary/90 font-bold">Total de Inscrições</p>
            <p class="text-2xl font-black text-primary mt-1">{{ resumoCards.totalInscricoes }}</p>
          </div>
          <div class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
            <p class="text-[10px] uppercase tracking-wider text-emerald-200 font-bold">Média por Semana</p>
            <p class="text-2xl font-black text-emerald-300 mt-1">{{ resumoCards.mediaSemanal }}</p>
          </div>
        </div>
      </div>

      <div class="px-5 py-4 space-y-4">
        <div v-if="loading" class="rounded-lg border border-white/10 bg-[#0f0f15] px-4 py-8 flex items-center justify-center gap-3 text-sm text-secondary">
          <svg class="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Carregando relatório semanal...
        </div>

        <div v-else-if="!weeks.length" class="rounded-lg border border-white/10 bg-[#0f0f15] px-4 py-8 text-sm text-secondary text-center">
          Nenhuma inscrição encontrada para este recorte.
        </div>

        <div v-for="week in weeks" v-else :key="`${week.week_year}-${week.week_iso}`" class="rounded-xl border border-white/10 bg-[#0f0f15] overflow-hidden">
          <div class="px-4 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h4 class="text-base font-bold text-white">Semana {{ week.week_iso }}/{{ week.week_year }}</h4>
              <p class="text-[11px] text-secondary mt-1">{{ formatDate(week.week_start) }} a {{ formatDate(week.week_end) }}</p>
            </div>
            <span class="px-2 py-1 rounded bg-primary/15 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
              Total: {{ week.totals?.total_semana || 0 }}
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="bg-primary/10 border-b border-primary/20 text-primary">
                  <th class="px-3 py-2 text-left">Turma</th>
                  <th v-for="(label, i) in ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']" :key="label" class="px-2 py-2 text-center">
                    <div class="flex flex-col items-center leading-tight gap-0.5">
                      <span class="text-[10px] font-semibold opacity-70">{{ getWeekDates(week.week_start)[i] }}</span>
                      <span>{{ label }}</span>
                    </div>
                  </th>
                  <th class="px-2 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in week.rows" :key="`${week.week_iso}-${row.id_turma}`" class="border-b border-white/5 text-secondary">
                  <td class="px-3 py-2 text-left font-semibold text-white">{{ row.nome_turma }}</td>
                  <td class="px-2 py-2 text-center">{{ row.seg || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ row.ter || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ row.qua || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ row.qui || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ row.sex || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ row.sab || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ row.dom || 0 }}</td>
                  <td class="px-2 py-2 text-center font-bold text-primary">{{ row.total_semana || 0 }}</td>
                </tr>
                <tr class="bg-primary/5 border-t border-primary/20 font-bold">
                  <td class="px-3 py-2 text-left text-white">Total da Semana</td>
                  <td class="px-2 py-2 text-center">{{ week.totals?.seg || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ week.totals?.ter || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ week.totals?.qua || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ week.totals?.qui || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ week.totals?.sex || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ week.totals?.sab || 0 }}</td>
                  <td class="px-2 py-2 text-center">{{ week.totals?.dom || 0 }}</td>
                  <td class="px-2 py-2 text-center text-primary">{{ week.totals?.total_semana || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="!loading && summaryByWeek.length" class="rounded-xl border border-white/10 bg-[#0f0f15] overflow-hidden">
          <div class="px-4 py-3 border-b border-white/10">
            <h4 class="text-sm font-bold text-white">Resumo por Semana</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="bg-white/5 border-b border-white/10 text-secondary">
                  <th class="px-3 py-2 text-left">Semana</th>
                  <th class="px-3 py-2 text-left">Intervalo</th>
                  <th class="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="week in summaryByWeek" :key="`summary-${week.week_year}-${week.week_iso}`" class="border-b border-white/5">
                  <td class="px-3 py-2 text-white">{{ week.week_iso }}/{{ week.week_year }}</td>
                  <td class="px-3 py-2 text-secondary">{{ formatDate(week.week_start) }} a {{ formatDate(week.week_end) }}</td>
                  <td class="px-3 py-2 text-right font-bold text-primary">{{ week.total_semana || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
