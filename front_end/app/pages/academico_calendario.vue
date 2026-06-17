<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import { useToast } from '~/composables/useToast'
import ModalFeriado from '../components/ModalFeriado.vue'
import ModalEvento from '../components/ModalEvento.vue'
import ModalConfirmacao from '../components/ModalConfirmacao.vue'

definePageMeta({
  layout: 'base'
})

const store = useAppStore()
const toast = useToast()

const tabs = [
  { key: 'feriados', label: 'Feriados' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'calendario', label: 'Calendário' }
]

const activeTab = ref('feriados')
const loading = ref(false)
const loadingFeriados = ref(false)
const loadingEventos = ref(false)

// Lists
const feriados = ref<any[]>([])
const eventos = ref<any[]>([])
const calendario = ref<any[]>([])

// Modals State
const showModalFeriado = ref(false)
const isEditFeriado = ref(false)
const feriadoEditData = ref<any>(null)

const showModalEvento = ref(false)
const isEditEvento = ref(false)
const eventoEditData = ref<any>(null)

// Programas & Calendário Dinâmico
const selectedProgramaId = ref<string | null>(null)
const selectedPrograma = ref<any>(null)
const programas = ref<any[]>([])
const loadingProgramas = ref(false)
const viewMode = ref<'mensal' | 'semanal'>('mensal')
const calCurrentDate = ref(new Date())
const calendarEvents = ref<any[]>([])

// Drag & Drop state
const draggingItem   = ref<any>(null)
const dragTargetDate = ref<string | null>(null)

const showModalConfirm = ref(false)
const confirmConfig = ref({
  title: '',
  message: '',
  type: 'danger' as 'danger' | 'warning',
  onConfirm: () => {}
})

// Timeline State (Eventos)
const expandedMonths = ref<Record<string, boolean>>({})

// Year Filter
const currentFilterYear = new Date().getUTCFullYear()
const selectedYear = ref(currentFilterYear)
const availableYears = computed(() => {
   return [currentFilterYear - 1, currentFilterYear, currentFilterYear + 1, currentFilterYear + 2]
})

// Helpers
function getEntidadeAtivaId(): string | null {
  const entidades = (store as any).entidades || []
  // Prioriza a entidade do tipo empresa com produto academico (igual a academico_oferta)
  for (const ent of entidades) {
    if (ent.tipo === 'empresa' && Array.isArray(ent.produtos)) {
      if (ent.produtos.some((p: any) => p.slug === 'academico')) {
        return ent.id
      }
    }
  }
  // Fallback: primeira entidade
  if (entidades[0]?.id) return entidades[0].id
  return (store as any).company?.id || null
}

// Actions: Feriados
async function fetchFeriados() {
  loadingFeriados.value = true
  try {
    const res = await $fetch('/api/feriados', {
      params: { 
        id_entidade: getEntidadeAtivaId(),
        ano: selectedYear.value
      }
    }) as any
    if (res?.success) {
      feriados.value = res.itens || []
    }
  } catch (e: any) {
    toast.showToast('Erro ao buscar feriados', { type: 'error' })
  } finally {
    loadingFeriados.value = false
  }
}

function openNovoFeriado() {
  isEditFeriado.value = false
  feriadoEditData.value = null
  showModalFeriado.value = true
}

function openEditarFeriado(item: any) {
  isEditFeriado.value = true
  feriadoEditData.value = item
  showModalFeriado.value = true
}

function confirmDeleteFeriado(item: any) {
  confirmConfig.value = {
    title: 'Excluir Feriado?',
    message: `Deseja realmente excluir o feriado <b>${item.nome}</b>?`,
    type: 'danger',
    onConfirm: () => deleteFeriado(item.id)
  }
  showModalConfirm.value = true
}

async function deleteFeriado(id: string) {
  try {
    const res = await $fetch('/api/feriados', {
      method: 'DELETE',
      body: { id }
    }) as any
    if (res?.success) {
      toast.showToast('Feriado excluído!', { type: 'success' })
      fetchFeriados()
    }
  } catch (e: any) {
    toast.showToast('Erro ao excluir feriado', { type: 'error' })
  }
}

// Actions: Eventos
async function fetchEventos() {
  loadingEventos.value = true
  try {
    const res = await $fetch('/api/eventos', {
      params: { 
        id_entidade: getEntidadeAtivaId(),
        ano: selectedYear.value
      }
    }) as any
    if (res?.success) {
      eventos.value = res.itens || []
      
      // Auto-expand current month IF no months are expanded yet
      if (Object.keys(expandedMonths.value).length === 0) {
           const currentMonthKey = new Date().toISOString().slice(0, 7)
           expandedMonths.value[currentMonthKey] = true
      }
    }
  } catch (e: any) {
    toast.showToast('Erro ao buscar eventos', { type: 'error' })
  } finally {
    loadingEventos.value = false
  }
}

function openNovoEvento() {
  isEditEvento.value = false
  eventoEditData.value = null
  showModalEvento.value = true
}

function openEditarEvento(item: any) {
  isEditEvento.value = true
  eventoEditData.value = item
  showModalEvento.value = true
}

function confirmDeleteEvento(item: any) {
  confirmConfig.value = {
    title: 'Excluir Evento?',
    message: `Deseja realmente excluir o evento <b>${item.nome_evento}</b>?`,
    type: 'danger',
    onConfirm: () => deleteEvento(item.id)
  }
  showModalConfirm.value = true
}

async function deleteEvento(id: string) {
  try {
    const res = await $fetch('/api/eventos', {
      method: 'DELETE',
      body: { id }
    }) as any
    if (res?.success) {
      toast.showToast('Evento excluído!', { type: 'success' })
      fetchEventos()
    }
  } catch (e: any) {
    toast.showToast('Erro ao excluir evento', { type: 'error' })
  }
}

// Actions: Programas & Calendário
async function fetchProgramas() {
    loadingProgramas.value = true
    try {
        let id_entidade = getEntidadeAtivaId()
        if (!id_entidade) {
            await (store as any).initSession()
            id_entidade = getEntidadeAtivaId()
        }
        if (!id_entidade) return
        
        const res = await $fetch('/api/programas', {
            params: { id_entidade, limit: 100 }
        }) as any
        
        // A RPC aca_get_programas_paginado retorna { itens, qtd_total } sem campo 'success'
        if (Array.isArray(res?.itens)) {
            programas.value = res.itens
        } else if (res?.success && Array.isArray(res?.itens)) {
            programas.value = res.itens
        }
    } catch (e) {
        toast.showToast('Erro ao buscar programas', { type: 'error' })
    } finally {
        loadingProgramas.value = false
    }
}

async function selectPrograma(p: any) {
    selectedProgramaId.value = p.id
    selectedPrograma.value = p
    await fetchCalendarEvents()
}

async function onProgramaChange() {
    const id = selectedProgramaId.value
    if (!id) return
    const p = programas.value.find((x: any) => x.id === id)
    selectedPrograma.value = p || null
    calendarEvents.value = []
    await fetchCalendarEvents()
}

async function fetchCalendarEvents() {
    if (!selectedProgramaId.value) return
    loading.value = true
    try {
        const id_entidade = getEntidadeAtivaId()
        const res = await $fetch('/api/programas/calendario', {
            params: { id_entidade, id_programa: selectedProgramaId.value }
        }) as any
        
        if (res?.success) {
            calendarEvents.value = res.itens || []
        }
    } catch (e) {
        toast.showToast('Erro ao buscar calendário do programa', { type: 'error' })
    } finally {
        loading.value = false
    }
}

function clearSelection() {
    selectedProgramaId.value = null
    selectedPrograma.value = null
    calendarEvents.value = []
}

// ─── Drag & Drop ───────────────────────────────────────────
function onDragStart(item: any) {
    draggingItem.value = item
}

function onDragEnd() {
    draggingItem.value = null
    dragTargetDate.value = null
}

async function onDrop(newDate: string) {
    if (!draggingItem.value) return
    if (newDate === draggingItem.value.data) {
        draggingItem.value = null
        dragTargetDate.value = null
        return
    }

    // Bloqueia drop em dia com feriado
    const hasFeriado = (eventsMap.value[newDate] || []).some((e: any) => e._tipo === 'feriado')
    if (hasFeriado) {
        toast.showToast('Não é possível mover para um feriado', { type: 'error' })
        draggingItem.value = null
        dragTargetDate.value = null
        return
    }

    // Se for aula cancelada, reagenda (cria cópia). Se for normal, move.
    if (draggingItem.value.status === 'cancelada') {
        await reagendarAulaCancelada(draggingItem.value, newDate)
    } else {
        await moveAula(draggingItem.value.id, newDate)
    }
}

async function moveAula(idAula: string, newDate: string) {
    // Optimistic update local
    const item = calendarEvents.value.find((e: any) => e.id === idAula)
    const oldDate = item?.data
    if (item) item.data = newDate

    try {
        const res = await $fetch('/api/programas/aula', {
            method: 'PATCH',
            body: { id: idAula, nova_data: newDate, id_entidade: getEntidadeAtivaId(), action: 'mover' }
        }) as any

        if (!res?.success) throw new Error(res?.message || 'Erro desconhecido')
        toast.showToast('Aula movida com sucesso', { type: 'success' })
    } catch (e: any) {
        // Rollback
        if (item && oldDate) item.data = oldDate
        toast.showToast('Erro ao mover aula: ' + e.message, { type: 'error' })
    } finally {
        draggingItem.value = null
        dragTargetDate.value = null
    }
}

async function reagendarAulaCancelada(itemOrigem: any, newDate: string) {
    try {
        const res = await $fetch('/api/programas/aula', {
            method: 'PATCH',
            body: { id: itemOrigem.id, nova_data: newDate, id_entidade: getEntidadeAtivaId(), action: 'reagendar' }
        }) as any

        if (!res?.success) throw new Error(res?.message || 'Erro desconhecido')
        
        // Adiciona a nova aula localmente para optimistic update
        const novaAula = {
            ...itemOrigem,
            id: res.novo_id,
            data: newDate,
            status: 'reagendada',
            id_aula_origem: itemOrigem.id
        }
        calendarEvents.value.push(novaAula)
        
        toast.showToast('Reposição agendada com sucesso', { type: 'success' })
    } catch (e: any) {
        toast.showToast('Erro ao reagendar: ' + e.message, { type: 'error' })
    } finally {
        draggingItem.value = null
        dragTargetDate.value = null
    }
}

function handleCancelarAula(item: any) {
    confirmConfig.value = {
        title: 'Cancelar Aula',
        message: 'Tem certeza que deseja cancelar esta aula? Ela ficará visível no calendário como cancelada, e você poderá arrastá-la depois para marcar uma reposição.',
        type: 'danger',
        onConfirm: () => confirmCancelarAula(item.id)
    }
    showModalConfirm.value = true
}

async function confirmCancelarAula(idAula: string) {
    const item = calendarEvents.value.find((e: any) => e.id === idAula)
    const oldStatus = item?.status
    if (item) item.status = 'cancelada'

    try {
        const res = await $fetch('/api/programas/aula', {
            method: 'PATCH',
            body: { id: idAula, id_entidade: getEntidadeAtivaId(), action: 'cancelar' }
        }) as any

        if (!res?.success) throw new Error(res?.message || 'Erro desconhecido')
        toast.showToast('Aula cancelada.', { type: 'success' })
    } catch (e: any) {
        if (item && oldStatus) item.status = oldStatus
        toast.showToast('Erro ao cancelar: ' + e.message, { type: 'error' })
    }
}

function getOrigemDataText(idOrigem: string) {
    if (!idOrigem) return ''
    const origem = calendarEvents.value.find((e: any) => e.id === idOrigem)
    if (origem && origem.data) {
        const [y, m, d] = origem.data.split('-')
        return `${d}/${m}/${y}`
    }
    return 'data desconhecida'
}

const timelineMonths = computed(() => {
    let rawItems: any[] = []
    
    if (activeTab.value === 'feriados') rawItems = feriados.value
    else if (activeTab.value === 'eventos') rawItems = eventos.value
    else if (activeTab.value === 'calendario') rawItems = calendarEvents.value
    
    if (rawItems.length === 0) return []

    let minYear = selectedYear.value
    let maxYear = selectedYear.value

    const allEntries: any[] = []

    rawItems.forEach(item => {
        if (activeTab.value === 'eventos') {
            const start = new Date(item.data_inicio + 'T12:00:00')
            const end = new Date(item.data_fim + 'T12:00:00')
            let curr = new Date(start)
            let isFirstDay = true
            let safeCounter = 0
            while (curr <= end && safeCounter < 366) {
                 const entryDate = curr.toISOString()
                 allEntries.push({
                     ...item,
                     isEvento: true,
                     uniqueKey: `${item.id}_${entryDate}`,
                     displayDate: entryDate,
                     displayName: item.nome_evento,
                     isFirstDay: isFirstDay,
                     originalStart: item.data_inicio
                 })
                 curr.setDate(curr.getDate() + 1)
                 isFirstDay = false
                 safeCounter++
            }
        } else if (activeTab.value === 'feriados') {
            const entryDate = new Date(item.data + 'T12:00:00').toISOString()
            allEntries.push({
                ...item,
                isFeriado: true,
                uniqueKey: `${item.id}_${entryDate}`,
                displayDate: entryDate,
                displayName: item.nome,
                isFirstDay: true,
                originalStart: item.data
            })
        } else if (activeTab.value === 'calendario') {
            // Usa dt_hora_ini (ISO timestamp) para displayDate — mais preciso que data string
            const entryDate = item.dt_hora_ini
                ? new Date(item.dt_hora_ini).toISOString()
                : new Date(item.data + 'T12:00:00Z').toISOString()
            allEntries.push({
                ...item,
                isAula: true,
                uniqueKey: `${item.id}_${entryDate}`,
                displayDate: entryDate,
                displayName: item.nome_modulo,
                isFirstDay: true,
                originalStart: item.data,
                subLabel: item.ciclo_desc
            })
        }
    })

    if (allEntries.length > 0) {
        const years = allEntries.map(e => new Date(e.displayDate).getUTCFullYear())
        minYear = Math.min(minYear, ...years)
        maxYear = Math.max(maxYear, ...years)
    }

    type MonthEntry = {
        key: string;
        monthName: string;
        year: number;
        events: any[];
        isCurrent: boolean;
    }
    const months: MonthEntry[] = []
    for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
            const date = new Date(Date.UTC(y, m, 1))
            const key = date.toISOString().slice(0, 7)
            
            const monthEntries = allEntries.filter(e => e.displayDate.startsWith(key))

            monthEntries.sort((a, b) => new Date(a.displayDate).getTime() - new Date(b.displayDate).getTime())

            months.push({
                key,
                monthName: date.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' }),
                year: y,
                events: monthEntries,
                isCurrent: key === new Date().toISOString().slice(0, 7)
            })
        }
    }
    return months
})

function toggleMonth(key?: string) {
    if (!key) return
    expandedMonths.value[key] = !expandedMonths.value[key]
}

function toggleAllMonths() {
    const monthsKeys = timelineMonths.value.map(m => m.key)
    const allExpanded = monthsKeys.every(k => expandedMonths.value[k])
    
    if (allExpanded) {
        expandedMonths.value = {}
    } else {
        const newExpanded: any = {}
        monthsKeys.forEach(k => newExpanded[k] = true)
        expandedMonths.value = newExpanded
    }
}

function handleAddInMonth(monthKey?: string) {
    if (!monthKey) return
    if (activeTab.value === 'feriados') {
        feriadoEditData.value = { data: `${monthKey}-01` }
        isEditFeriado.value = false
        showModalFeriado.value = true
    } else {
        eventoEditData.value = { data_inicio: `${monthKey}-01` }
        isEditEvento.value = false
        showModalEvento.value = true
    }
}

function getDay(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).getUTCDate()
}

function getWeekDay(dateStr?: string) {
    if (!dateStr) return '-'
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(dateStr)).toUpperCase().slice(0, 3)
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return dateStr.split('-').reverse().join('/')
}

function isOddMonth(key: string) {
    if (!key) return false
    const parts = key.split('-')
    if (parts.length < 2) return false
    return parseInt(parts[1] || '0') % 2 !== 0
}

// ─── Calendar Views ───────────────────────────────────────────
const CAL_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Mapa de data (YYYY-MM-DD) → itens (aulas + feriados + eventos — todos vindos da API unificada)
const eventsMap = computed((): Record<string, any[]> => {
    const map: Record<string, any[]> = {}

    const push = (key: string, item: any) => {
        if (!map[key]) map[key] = []
        map[key]!.push(item)
    }

    const expandMultiDay = (ev: any, idSuffix = '') => {
        if (!ev.data_inicio || !ev.data_fim) return
        let curr = new Date(ev.data_inicio + 'T12:00:00Z')
        const end = new Date(ev.data_fim + 'T12:00:00Z')
        let safe = 0
        while (curr <= end && safe < 366) {
            const d = curr.toISOString().slice(0, 10)
            push(d, { ...ev, _tipo: 'evento', id: `${ev.id}${idSuffix}_${d}` })
            curr = new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth(), curr.getUTCDate() + 1))
            safe++
        }
    }

    // Todos os itens da API: aulas, feriados e eventos
    calendarEvents.value.forEach(item => {
        if (!item.data && item._tipo !== 'evento') return

        if (item._tipo === 'evento') {
            // Eventos multi-day: expandir por dias
            expandMultiDay(item, '_api')
        } else {
            // Aula ou feriado: chave direta pela data
            push(item.data as string, item)
        }
    })

    // Eventos do fetch separado (fallback/complemento, caso a aba de eventos carregue algo)
    eventos.value.forEach(ev => {
        expandMultiDay(ev)
    })

    return map
})

const todayUTCStr = new Date().toISOString().slice(0, 10)

// Visão Mensal: grade de semanas do mês corrente
const calMonthGrid = computed(() => {
    const base = calCurrentDate.value
    const year = base.getUTCFullYear()
    const month = base.getUTCMonth()

    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay  = new Date(Date.UTC(year, month + 1, 0))
    const startDow = firstDay.getUTCDay() // 0=Dom

    let curr = new Date(Date.UTC(year, month, 1 - startDow))
    const weeks: any[][] = []

    while (true) {
        const week: any[] = []
        for (let d = 0; d < 7; d++) {
            const dateStr = curr.toISOString().slice(0, 10)
            week.push({
                dateStr,
                day: curr.getUTCDate(),
                isCurrentMonth: curr.getUTCMonth() === month,
                isToday: dateStr === todayUTCStr,
                events: eventsMap.value[dateStr] || []
            })
            curr = new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth(), curr.getUTCDate() + 1))
        }
        weeks.push(week)
        if (curr > lastDay && weeks.length >= 4) break
        if (weeks.length >= 6) break
    }
    return weeks
})

const calMonthLabel = computed(() => {
    return calCurrentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        .replace(/^./, s => s.toUpperCase())
})

// Visão Semanal: 7 dias da semana contendo calCurrentDate
const calWeekDays = computed(() => {
    const base = calCurrentDate.value
    const dow = base.getUTCDay()
    let weekStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - dow))

    const days: any[] = []
    for (let d = 0; d < 7; d++) {
        const dateStr = weekStart.toISOString().slice(0, 10)
        const dayNum = weekStart.getUTCDate()
        const monthShort = weekStart.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
        days.push({
            dateStr,
            label: CAL_DAYS[d],
            dayNum,
            monthShort,
            isToday: dateStr === todayUTCStr,
            events: eventsMap.value[dateStr] || []
        })
        weekStart = new Date(Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 1))
    }
    return days
})

const calWeekLabel = computed(() => {
    const start = calWeekDays.value[0]
    const end   = calWeekDays.value[6]
    if (!start || !end) return ''
    return `${start.dayNum} – ${end.dayNum} de ${start.monthShort.charAt(0).toUpperCase() + start.monthShort.slice(1)} ${calCurrentDate.value.getUTCFullYear()}`
})

// Navegação
function prevMonth() {
    const d = new Date(calCurrentDate.value)
    d.setUTCMonth(d.getUTCMonth() - 1)
    calCurrentDate.value = d
}
function nextMonth() {
    const d = new Date(calCurrentDate.value)
    d.setUTCMonth(d.getUTCMonth() + 1)
    calCurrentDate.value = d
}
function prevWeek() {
    const d = new Date(calCurrentDate.value)
    d.setUTCDate(d.getUTCDate() - 7)
    calCurrentDate.value = d
}
function nextWeek() {
    const d = new Date(calCurrentDate.value)
    d.setUTCDate(d.getUTCDate() + 7)
    calCurrentDate.value = d
}
function goToToday() {
    calCurrentDate.value = new Date()
}

// Lifecycle & Watchers
watch(() => (store as any).entidades, (newVal) => {
    if (newVal && newVal.length > 0) {
        if (activeTab.value === 'feriados' && feriados.value.length === 0) fetchFeriados()
        if (activeTab.value === 'eventos' && eventos.value.length === 0) fetchEventos()
        if (activeTab.value === 'calendario' && programas.value.length === 0) fetchProgramas()
    }
}, { immediate: true })

watch(activeTab, (val) => {
  if (val === 'feriados') fetchFeriados()
  if (val === 'eventos') fetchEventos()
  if (val === 'calendario') {
    fetchProgramas()
    // Carrega feriados e eventos para exibir no calendário junto com as aulas
    if (feriados.value.length === 0) fetchFeriados()
    if (eventos.value.length === 0) fetchEventos()
  }
})

watch(selectedYear, () => {
    if (activeTab.value === 'feriados') fetchFeriados()
    if (activeTab.value === 'eventos') fetchEventos()
    // Recarrega feriados/eventos no calendário se o ano mudar
    if (activeTab.value === 'calendario') {
        fetchFeriados()
        fetchEventos()
    }
})
</script>

<template>
  <div class="page-wrap p-6 max-w-7xl mx-auto w-full">
    <!-- Page Top Row: Tabs + Action -->
    <div class="page-top-row">
      <nav class="tabs-nav">
        <button 
          v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.key }"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="flex items-center gap-4">
        <!-- Year Filter -->
        <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-secondary uppercase tracking-widest hidden md:inline-block">Ano Letivo</span>
            <select v-model="selectedYear" class="form-input !py-1.5 !px-3 font-bold text-sm bg-background border-secondary/10">
                <option v-for="yr in availableYears" :key="yr" :value="yr">{{ yr }}</option>
            </select>
        </div>

        <div class="h-6 w-px bg-secondary/20 hidden md:block"></div>

        <button v-if="activeTab === 'feriados'" @click="openNovoFeriado" class="add-btn">
          <Icon name="ph:plus-bold" class="w-3 h-3" />
          Novo Feriado
        </button>
        <button v-else-if="activeTab === 'eventos'" @click="openNovoEvento" class="add-btn">
          <Icon name="ph:plus-bold" class="w-3 h-3" />
          Novo Evento
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <main class="min-h-[400px]">
      <div v-if="(activeTab === 'feriados' && loadingFeriados) || (activeTab === 'eventos' && loadingEventos)" class="py-16 flex flex-col items-center justify-center gap-3">
        <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
        <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
      </div>
      
      <!-- Unified Timeline for Feriados and Eventos -->
      <div v-else-if="activeTab === 'feriados' || activeTab === 'eventos'" class="relative w-full max-w-4xl mx-auto pl-4 md:pl-0 pt-4 pb-32">
        
        <!-- Empty State -->
        <div v-if="timelineMonths.length === 0 || timelineMonths.every(m => m.events.length === 0)" class="empty-state mt-8">
          <div class="empty-icon text-secondary">
            <Icon :name="activeTab === 'feriados' ? 'ph:calendar-x-duotone' : 'ph:star-duotone'" class="w-10 h-10" />
          </div>
          <p class="empty-title italic">Nenhum registro encontrado</p>
          <p class="empty-subtitle">Comece adicionando seu primeiro {{ activeTab === 'feriados' ? 'feriado' : 'evento acadêmico' }}</p>
          <button @click="activeTab === 'feriados' ? openNovoFeriado() : openNovoEvento()" class="empty-cta group">
            <Icon name="ph:plus-bold" class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            Criar Registro
          </button>
        </div>

        <template v-else>
            <!-- Controls (Expand/Collapse) -->
            <div class="flex justify-end mb-4 relative z-20">
                <button 
                  @click="toggleAllMonths"
                  class="p-2 text-secondary hover:text-primary transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-div-10 rounded-lg hover:bg-div-30"
                >
                  <Icon name="ph:arrows-out-line-vertical-duotone" class="w-4 h-4" />
                  <span>Expandir / Recolher</span>
                </button>
            </div>

            <!-- Vertical Timeline Line -->
            <div class="absolute left-0 md:left-1/2 top-10 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent z-0"></div>

            <div class="flex flex-col gap-8 relative z-10">
                <!-- Month Group -->
                <div 
                    v-for="month in timelineMonths" 
                    :key="month.key"
                    class="group relative flex flex-col"
                    :class="{ 'opacity-60 hover:opacity-100 transition-opacity': month.events.length === 0 && !expandedMonths[month.key] && !month.isCurrent }"
                >
                    <!-- Timeline Node (Clickable Quick Add) -->
                    <div 
                        @click.stop="handleAddInMonth(month.key)"
                        class="absolute left-[-9.5px] md:left-1/2 md:-ml-[10px] top-5 w-5 h-5 rounded-full transition-all duration-300 z-20 flex items-center justify-center cursor-pointer hover:scale-125 hover:bg-primary hover:border-primary hover:text-white group/node"
                        :class="[
                            month.events.length > 0 ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)] border border-primary text-white' : 'bg-background border-2 border-secondary/30 text-secondary/30',
                            month.isCurrent ? 'scale-110 bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.8)] border border-primary text-white' : ''
                        ]"
                        title="Adicionar Registro neste Mês"
                    >
                        <Icon name="ph:plus-bold" class="w-2.5 h-2.5" :class="month.events.length === 0 ? 'opacity-100 group-hover/node:text-white' : 'opacity-100 flex'" />
                    </div>

                    <!-- Month Header Card -->
                    <div 
                        class="w-full md:w-[calc(50%-2rem)] mb-2 md:mb-0 transition-all duration-300 relative select-none"
                        :class="[parseInt(String(month.key).split('-')[1] || '0') % 2 !== 0 ? 'md:mr-auto text-left' : 'md:ml-auto text-left']"
                    >   
                        <!-- Connection Line (Desktop) -->
                        <div class="hidden md:block absolute top-[1.6rem] w-[2rem] h-px bg-secondary/10 z-0"
                             :class="parseInt(String(month.key).split('-')[1] || '0') % 2 !== 0 ? '-right-[2rem]' : '-left-[2rem]'"
                        ></div>

                        <div class="rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all hover:bg-div-15 relative z-10 group-hover:translate-x-1 md:group-hover:translate-x-0 bg-background md:bg-transparent"
                            @click="toggleMonth(month.key)">
                            <div class="flex items-center gap-4 flex-1">
                                <div class="flex flex-col">
                                    <h3 class="text-xl font-bold capitalize leading-tight transition-colors" :class="month.isCurrent ? 'text-primary' : 'text-text'">{{ month.monthName }}</h3>
                                    <span class="text-[10px] font-black tracking-widest text-secondary/50">{{ month.year }}</span>
                                </div>
                                <div v-if="month.events.length > 0" class="px-2 py-0.5 rounded text-[10px] font-bold"
                                    :class="month.isCurrent ? 'bg-primary text-white' : 'bg-div-30 text-secondary'">
                                    {{ month.events.length }}
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <!-- Quick Add Button -->
                                <button @click.stop="handleAddInMonth(month.key)"
                                        class="w-8 h-8 flex items-center justify-center rounded-full bg-div-30 text-secondary hover:bg-primary hover:text-white hover:scale-110 transition-all group/btn"
                                        title="Adicionar no mês">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 opacity-70 group-hover/btn:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                                
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-secondary/40 transition-transform duration-300" :class="{ 'rotate-180': expandedMonths[month.key] }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                    </div>

                    <!-- Events List -->
                    <div 
                        v-show="expandedMonths[month.key]"
                        class="flex flex-col gap-3 mt-2 w-full md:w-[calc(50%-2rem)]"
                        :class="[parseInt(String(month.key).split('-')[1] || '0') % 2 !== 0 ? 'md:mr-auto' : 'md:ml-auto']"
                    >
                        <div v-if="month.events.length === 0" class="w-full p-4 opacity-50 text-xs italic text-secondary text-center md:text-left transition-opacity">
                            Nenhum registro neste mês
                        </div>
                        <div 
                            v-for="evt in month.events" 
                            :key="evt.uniqueKey"
                            class="comp-card group/card overflow-hidden hover:-translate-y-0.5"
                        >   
                            <div class="comp-card-accent"></div>
                            
                            <!-- Connection Line for Cards (Desktop) -->
                            <div class="hidden md:block absolute top-1/2 w-[2rem] h-px bg-secondary/10"
                                :class="parseInt(String(month.key).split('-')[1] || '0') % 2 !== 0 ? '-right-[2rem]' : '-left-[2rem]'"
                            ></div>

                            <div class="flex items-center gap-4 w-full relative z-10 bg-surface">
                                <!-- Date Badge -->
                                <div class="flex flex-col items-center justify-center bg-div-15 rounded p-1.5 min-w-[3.2rem] border border-secondary/5">
                                    <span class="text-[9px] font-black uppercase text-secondary tracking-widest">{{ getWeekDay(evt.displayDate) }}</span>
                                    <span class="text-lg font-bold text-primary leading-none">{{ getDay(evt.displayDate) }}</span>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <h4 class="text-sm font-bold truncate text-text">{{ evt.displayName }}</h4>
                                    <p v-if="evt.subLabel" class="text-[10px] text-secondary/40 font-bold uppercase truncate">{{ evt.subLabel }}</p>
                                    <div class="flex flex-wrap items-center gap-2 mt-1">
                                        <span v-if="!evt.isFirstDay" class="text-[8px] font-bold text-secondary/50 uppercase tracking-widest italic">Continuação</span>
                                        <span v-if="evt.sobrescrever_calendario" class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-red-400/10 text-red-400 border border-red-400/20">Sobrepõe Aula</span>
                                        <span v-if="evt.recorrente_anual" class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">Recorrente Anual</span>
                                        <span v-if="evt.is_global" class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><Icon name="ph:globe-hemisphere-west-duotone" class="inline w-3 h-3 mr-1 -mt-0.5"/>Global</span>
                                    </div>
                                </div>

                                <div v-if="evt.isFirstDay && !evt.isAula" class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button @click="evt.isEvento ? openEditarEvento(evt) : openEditarFeriado(evt)" class="comp-action-btn comp-action-edit">
                                        <Icon name="ph:pencil-simple-bold" class="w-4 h-4" />
                                    </button>
                                    <button @click="evt.isEvento ? confirmDeleteEvento(evt) : confirmDeleteFeriado(evt)" class="comp-action-btn comp-action-delete">
                                        <Icon name="ph:trash-bold" class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Bottom Hint -->
                <div class="flex justify-center mt-12 mb-8 opacity-50 relative z-20">
                    <p class="text-[10px] uppercase tracking-widest text-secondary font-bold">-- Fim do Cronograma --</p>
                </div>
            </div>
        </template>
      </div>

      <!-- Tab: Calendário (Programas) -->
      <div v-if="activeTab === 'calendario'" class="flex flex-col gap-6">

        <!-- Selector de Programa -->
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex-1 flex flex-col gap-1.5">
            <label class="text-[10px] font-black text-secondary/50 uppercase tracking-[0.18em]">Oferta / Programa</label>
            <div class="relative">
              <select
                v-model="selectedProgramaId"
                @change="onProgramaChange"
                class="w-full px-4 py-3 rounded-xl border border-secondary/10 bg-div-5 text-sm font-bold text-primary outline-none appearance-none cursor-pointer transition-all hover:border-primary/30 focus:border-primary/50"
              >
                <option :value="null" disabled>— Selecione um Programa —</option>
                <option v-for="p in programas" :key="p.id" :value="p.id">
                  {{ p.descricao }}
                </option>
              </select>
              <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40">
                <Icon name="ph:caret-down-bold" class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- View mode toggle (aparece só quando programa selecionado) -->
          <div v-if="selectedProgramaId" class="flex items-center gap-3 shrink-0">
            <button @click="goToToday" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-div-10 border border-secondary/5 text-secondary/50 hover:text-primary hover:border-primary/30 transition-all">Hoje</button>
            <div class="flex items-center p-1 bg-div-10 rounded-lg border border-secondary/5">
              <button
                @click="viewMode = 'mensal'"
                class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                :class="viewMode === 'mensal' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary/50 hover:text-secondary'"
              >
                Mensal
              </button>
              <button
                @click="viewMode = 'semanal'"
                class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                :class="viewMode === 'semanal' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary/50 hover:text-secondary'"
              >
                Semanal
              </button>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingProgramas" class="py-12 flex flex-col items-center justify-center gap-3">
          <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
          <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando programas...</span>
        </div>

        <!-- Nenhum programa cadastrado -->
        <div v-else-if="programas.length === 0" class="empty-state mt-4">
          <div class="empty-icon text-secondary">
            <Icon name="ph:folder-simple-dashed-duotone" class="w-10 h-10" />
          </div>
          <p class="empty-title italic">Nenhum programa encontrado</p>
          <p class="empty-subtitle">Vá para a aba de Ofertas para criar seu primeiro programa acadêmico.</p>
        </div>

        <!-- Nenhum programa selecionado ainda -->
        <div v-else-if="!selectedProgramaId" class="empty-state mt-4">
          <div class="empty-icon text-primary/50">
            <Icon name="ph:calendar-dots-duotone" class="w-10 h-10" />
          </div>
          <p class="empty-title italic">Selecione um programa acima</p>
          <p class="empty-subtitle">O calendário consolidado de aulas será exibido aqui.</p>
        </div>

        <!-- Calendário carregando -->
        <div v-else-if="loading" class="py-12 flex flex-col items-center justify-center gap-3">
          <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
          <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando calendário...</span>
        </div>

        <!-- Calendário vazio -->
        <div v-else-if="selectedProgramaId && calendarEvents.length === 0" class="empty-state mt-4">
          <div class="empty-icon text-secondary">
            <Icon name="ph:calendar-blank-duotone" class="w-10 h-10" />
          </div>
          <p class="empty-title italic">Nenhum encontro agendado</p>
          <p class="empty-subtitle">Este programa ainda não tem ciclos com calendário gerado.</p>
        </div>

        <!-- VISÃO: MENSAL -->
        <div v-else-if="viewMode === 'mensal'" class="w-full">
          <!-- Navigation -->
          <div class="flex items-center justify-between mb-4">
            <button @click="prevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-10 border border-secondary/5 hover:bg-div-20 hover:border-primary/20 text-secondary/50 hover:text-primary transition-all">
              <Icon name="ph:caret-left-bold" class="w-4 h-4" />
            </button>
            <h3 class="text-sm font-black text-text uppercase tracking-widest">{{ calMonthLabel }}</h3>
            <button @click="nextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-10 border border-secondary/5 hover:bg-div-20 hover:border-primary/20 text-secondary/50 hover:text-primary transition-all">
              <Icon name="ph:caret-right-bold" class="w-4 h-4" />
            </button>
          </div>

          <!-- Grid -->
          <div class="rounded-xl border border-secondary/8 overflow-hidden">
            <!-- Day headers -->
            <div class="grid grid-cols-7 bg-div-10 border-b border-secondary/8">
              <div v-for="d in CAL_DAYS" :key="d" class="py-2 text-center">
                <span class="text-[9px] font-black text-secondary/40 uppercase tracking-[0.18em]">{{ d }}</span>
              </div>
            </div>

            <!-- Week rows -->
            <div v-for="(week, wi) in calMonthGrid" :key="wi" class="grid grid-cols-7" :class="wi < calMonthGrid.length - 1 ? 'border-b border-secondary/8' : ''">
              <div
                v-for="cell in week" :key="cell.dateStr"
                class="min-h-[120px] p-2 border-r border-secondary/8 last:border-r-0 flex flex-col gap-1 transition-colors"
                :class="[
                  !cell.isCurrentMonth ? 'opacity-30' : '',
                  cell.isToday ? 'bg-primary/5' : '',
                  dragTargetDate === cell.dateStr && draggingItem
                    ? ((eventsMap[cell.dateStr] || []).some(e => e._tipo === 'feriado')
                        ? 'ring-2 ring-inset ring-red-500/30 bg-red-500/5'
                        : 'ring-2 ring-inset ring-primary/30 bg-primary/8')
                    : ''
                ]"
                @dragover.prevent="dragTargetDate = cell.dateStr"
                @dragleave="dragTargetDate = null"
                @drop.prevent="onDrop(cell.dateStr)"
              >
                <!-- Date number -->
                <div class="flex justify-end mb-1">
                  <span
                    class="w-6 h-6 flex items-center justify-center rounded text-xs font-bold leading-none"
                    :class="cell.isToday ? 'bg-primary text-white' : 'text-secondary/50'"
                  >{{ cell.day }}</span>
                </div>
                <!-- Events -->
                <template v-for="item in cell.events" :key="item.id">
                  <!-- Aula -->
                  <div
                    v-if="item._tipo === 'aula'"
                    draggable="true"
                    @dragstart="onDragStart(item)"
                    @dragend="onDragEnd"
                    class="px-2 py-1.5 rounded-lg flex flex-col gap-1 cursor-grab active:cursor-grabbing transition-opacity select-none"
                    :class="[
                      draggingItem?.id === item.id ? 'opacity-40 scale-95' : '',
                      item.status === 'cancelada' ? 'bg-secondary/10 border border-dashed border-secondary/30' :
                      item.status === 'reagendada' ? 'bg-emerald-500/15 border border-emerald-500/25' :
                      'bg-primary/15 border border-primary/25'
                    ]"
                  >
                    <!-- Handle -->
                    <div class="flex items-center justify-between gap-1">
                      <Icon name="ph:dots-six-vertical-bold" class="w-3 h-3 flex-shrink-0" :class="item.status === 'cancelada' ? 'text-secondary/40' : item.status === 'reagendada' ? 'text-emerald-500/40' : 'text-primary/40'" />
                      <p class="text-[10px] font-black leading-tight flex-1" :class="[
                        item.status === 'cancelada' ? 'text-secondary/50 line-through' :
                        item.status === 'reagendada' ? 'text-emerald-500' :
                        'text-primary'
                      ]">{{ item.hora_ini }} – {{ item.hora_fim }}</p>
                      <span v-if="item.status === 'cancelada'" class="px-1 py-0.5 rounded bg-secondary/10 text-[7px] font-black uppercase text-secondary/60 tracking-wider">Cancelada</span>
                    </div>
                    <p class="text-[9px] font-bold leading-tight line-clamp-2" :class="item.status === 'cancelada' ? 'text-secondary/60' : 'text-text/70'">{{ item.ciclo_desc }}</p>
                    <div class="mt-0.5 flex items-center gap-1">
                      <button v-if="item.status !== 'cancelada'" @click.stop="handleCancelarAula(item)" class="self-start px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors leading-none">
                        Cancelar
                      </button>
                      <span v-if="item.status === 'reagendada'" :title="`Reposição da aula cancelada no dia ${getOrigemDataText(item.id_aula_origem)}`" class="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-600 tracking-wider leading-none cursor-help">REP.</span>
                    </div>
                  </div>
                  <!-- Feriado -->
                  <div v-else-if="item._tipo === 'feriado'" class="px-2 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20">
                    <p class="text-[9px] font-black text-red-400 leading-tight">🛑 {{ item.nome }}</p>
                  </div>
                  <!-- Evento -->
                  <div v-else-if="item._tipo === 'evento'" class="px-2 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20">
                    <p class="text-[9px] font-black text-amber-400 leading-tight">📅 {{ item.nome_evento }}</p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- VISÃO: SEMANAL -->
        <div v-else-if="viewMode === 'semanal'" class="w-full">
          <!-- Navigation -->
          <div class="flex items-center justify-between mb-4">
            <button @click="prevWeek" class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-10 border border-secondary/5 hover:bg-div-20 hover:border-primary/20 text-secondary/50 hover:text-primary transition-all">
              <Icon name="ph:caret-left-bold" class="w-4 h-4" />
            </button>
            <h3 class="text-sm font-black text-text uppercase tracking-widest">{{ calWeekLabel }}</h3>
            <button @click="nextWeek" class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-10 border border-secondary/5 hover:bg-div-20 hover:border-primary/20 text-secondary/50 hover:text-primary transition-all">
              <Icon name="ph:caret-right-bold" class="w-4 h-4" />
            </button>
          </div>

          <!-- Week Grid -->
          <div class="rounded-xl border border-secondary/8 overflow-hidden">
            <!-- Column headers -->
            <div class="grid grid-cols-7 bg-div-10 border-b border-secondary/8">
              <div
                v-for="day in calWeekDays" :key="day.dateStr"
                class="py-3 text-center border-r border-secondary/8 last:border-r-0"
                :class="day.isToday ? 'bg-primary/10' : ''"
              >
                <p class="text-[9px] font-black uppercase tracking-[0.18em]" :class="day.isToday ? 'text-primary' : 'text-secondary/40'">{{ day.label }}</p>
                <span
                  class="mt-1 mx-auto flex items-center justify-center w-6 h-6 rounded text-sm font-black"
                  :class="day.isToday ? 'bg-primary text-white' : 'text-text'"
                >{{ day.dayNum }}</span>
              </div>
            </div>

            <!-- Event columns -->
            <div class="grid grid-cols-7">
              <div
                v-for="day in calWeekDays" :key="day.dateStr + '_events'"
                class="min-h-[300px] p-2 flex flex-col gap-2 border-r border-secondary/8 last:border-r-0 transition-colors"
                :class="[
                  day.isToday ? 'bg-primary/5' : '',
                  dragTargetDate === day.dateStr && draggingItem
                    ? ((eventsMap[day.dateStr] || []).some(e => e._tipo === 'feriado')
                        ? 'ring-2 ring-inset ring-red-500/30 bg-red-500/5'
                        : 'ring-2 ring-inset ring-primary/30 bg-primary/8')
                    : ''
                ]"
                @dragover.prevent="dragTargetDate = day.dateStr"
                @dragleave="dragTargetDate = null"
                @drop.prevent="onDrop(day.dateStr)"
              >
                <div v-if="day.events.length === 0" class="flex-1 flex items-center justify-center">
                  <span class="text-[9px] text-secondary/15 font-bold">—</span>
                </div>
                <template v-for="item in day.events" :key="item.id">
                  <!-- Aula -->
                  <div
                    v-if="item._tipo === 'aula'"
                    draggable="true"
                    @dragstart="onDragStart(item)"
                    @dragend="onDragEnd"
                    class="p-3 rounded-lg flex flex-col gap-1.5 cursor-grab active:cursor-grabbing transition-opacity select-none"
                    :class="[
                      draggingItem?.id === item.id ? 'opacity-40 scale-95' : '',
                      item.status === 'cancelada' ? 'bg-secondary/10 border border-dashed border-secondary/30' :
                      item.status === 'reagendada' ? 'bg-emerald-500/12 border border-emerald-500/25' :
                      'bg-primary/12 border border-primary/25'
                    ]"
                  >
                    <!-- Handle -->
                    <div class="flex items-center gap-1.5" :class="item.status === 'cancelada' ? 'text-secondary/40' : item.status === 'reagendada' ? 'text-emerald-500/50' : 'text-primary/50'">
                      <Icon name="ph:dots-six-vertical-bold" class="w-3.5 h-3.5 flex-shrink-0" />
                      <span class="text-[11px] font-black tabular-nums" :class="[
                        item.status === 'cancelada' ? 'text-secondary/50 line-through' :
                        item.status === 'reagendada' ? 'text-emerald-500' :
                        'text-primary'
                      ]">{{ item.hora_ini }} – {{ item.hora_fim }}</span>
                      
                      <span v-if="item.status === 'cancelada'" class="ml-auto px-1.5 py-0.5 rounded bg-secondary/10 text-[8px] font-black uppercase text-secondary/60 tracking-wider">Cancelada</span>
                    </div>
                    <p class="text-[10px] font-bold leading-snug line-clamp-2" :class="item.status === 'cancelada' ? 'text-secondary/60' : 'text-text/80'">{{ item.ciclo_desc }}</p>
                    <div class="mt-1 flex items-center gap-1.5">
                      <button v-if="item.status !== 'cancelada'" @click.stop="handleCancelarAula(item)" class="self-start px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors leading-none">
                        Cancelar
                      </button>
                      <span v-if="item.status === 'reagendada'" :title="`Reposição da aula cancelada no dia ${getOrigemDataText(item.id_aula_origem)}`" class="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-600 tracking-wider leading-none cursor-help">REP.</span>
                    </div>
                  </div>
                  <!-- Feriado -->
                  <div v-else-if="item._tipo === 'feriado'" class="p-3 rounded-lg bg-red-500/12 border border-red-500/20 flex flex-col gap-1">
                    <span class="text-[11px] font-black text-red-400">🛑 Feriado</span>
                    <p class="text-[10px] font-bold text-red-300/70 leading-snug">{{ item.nome }}</p>
                  </div>
                  <!-- Evento -->
                  <div v-else-if="item._tipo === 'evento'" class="p-3 rounded-lg bg-amber-500/12 border border-amber-500/20 flex flex-col gap-1">
                    <span class="text-[11px] font-black text-amber-400">📅 Evento</span>
                    <p class="text-[10px] font-bold text-amber-300/70 leading-snug">{{ item.nome_evento }}</p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>


    <!-- Modals -->
    <ModalFeriado v-model="showModalFeriado" :isEdit="isEditFeriado" :initialData="feriadoEditData" :idEntidade="getEntidadeAtivaId()" @saved="fetchFeriados" />
    <ModalEvento v-model="showModalEvento" :isEdit="isEditEvento" :initialData="eventoEditData" :idEntidade="getEntidadeAtivaId()" @saved="fetchEventos" />
    <ModalConfirmacao v-model="showModalConfirm" :title="confirmConfig.title" :message="confirmConfig.message" :type="confirmConfig.type" @confirm="confirmConfig.onConfirm" />
  </div>
</template>

<style scoped>
/* ─── Page Wrap ────────────────────────────────────────────── */
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ─── Top Row: Tabs + Button ────────────────────────────────── */
.page-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

/* ─── Tabs (pill style) ─────────────────────────────────────── */
.tabs-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
}

.tab-btn {
  padding: 7px 16px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.35);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.tab-btn:hover {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.04);
}
.tab-btn--active {
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.15);
  box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.25);
}
.tab-btn--active:hover {
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.2);
}

/* ─── Add Button ────────────────────────────────────────────── */
.add-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}
.add-btn:hover {
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.45);
  transform: translateY(-1px);
}
.add-btn:active {
  transform: translateY(0);
}

/* ─── Cards List ────────────────────────────────────────────── */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── Empty State ───────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 32px;
  border: 1px dashed rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.01);
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  margin: 4px 0 0;
}

.empty-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  max-width: 300px;
  line-height: 1.6;
  margin: 0;
}

.empty-cta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
  padding: 9px 20px;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.15s ease;
}
.empty-cta:hover {
  background: rgba(139, 92, 246, 0.18);
  border-color: rgba(139, 92, 246, 0.35);
  color: #c4b5fd;
}
</style>
