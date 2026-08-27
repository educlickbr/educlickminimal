<script setup lang="ts">
import { startOfWeek, addWeeks, subWeeks, format, addDays } from 'date-fns'
import { useAppStore } from '~~/stores/app'
import { useCalendarioSalas } from '~/composables/calendario-salas/useCalendarioSalas'
import CalendarioGrid from '~/components/calendario-salas/CalendarioGrid.vue'
import CalendarioSalasTabSalas from '~/components/calendario-salas/CalendarioSalasTabSalas.vue'
import CalendarioSalasTabHorarios from '~/components/calendario-salas/CalendarioSalasTabHorarios.vue'
import CalendarioReservaModal from '~/components/calendario-salas/ModalReservaSala.vue'

definePageMeta({
	layout: 'base',
})

const appStore = useAppStore()
const route = useRoute()
const { showToast } = useToast()

const fallbackId = '00ca60ea-6667-482d-8a96-09b877707b08'
const idEntidade = computed(() =>
	(route.query.id_entidade as string) || fallbackId,
)

const {
	horarios,
	reservas,
	isLoadingHorarios,
	isLoadingReservas,
	availableSalas,
	fetchHorarios,
	fetchReservas,
	getReservaForSlot,
} = useCalendarioSalas()

// ── Tabs ──
const tabs = [
	{ id: 'salas', label: 'Salas' },
	{ id: 'horarios', label: 'Horários' },
	{ id: 'calendario', label: 'Calendário' },
]
const activeTab = ref('salas')

// ── UI State ──
const currentDate = ref(new Date())
const selectedSala = ref<string>('all')
const dateInput = ref<HTMLInputElement | null>(null)

const weekDays = computed(() => {
	const start = startOfWeek(currentDate.value, { weekStartsOn: 1 })
	return Array.from({ length: 7 }).map((_, i) => addDays(start, i))
})

const filteredHorarios = computed(() => {
	if (selectedSala.value === 'all') return horarios.value
	return horarios.value.filter((h: any) => h.sala_nome === selectedSala.value)
})

// ── Modal State ──
const showReservationModal = ref(false)
const selectedSlot = ref<any>(null)
const selectedDay = ref(new Date())
const selectedExistingReserva = ref<any>(null)

// ── Handlers ──
const navigateWeek = (direction: 'prev' | 'next' | 'today') => {
	if (direction === 'today') currentDate.value = new Date()
	else if (direction === 'next') currentDate.value = addWeeks(currentDate.value, 1)
	else currentDate.value = subWeeks(currentDate.value, 1)
}

const handleCellClick = (slot: any, day: Date) => {
	const reserva = getReservaForSlot(slot.slot_key, day)

	selectedSlot.value = slot
	selectedDay.value = day
	selectedExistingReserva.value = reserva || null
	showReservationModal.value = true
}

const fetchReservasWrapper = () => {
	if (!weekDays.value.length) return
	const start = format(weekDays.value[0]!, 'yyyy-MM-dd')
	const end = format(weekDays.value[6]!, 'yyyy-MM-dd')

	fetchReservas(idEntidade.value, start, end).catch((e: any) => {
		showToast('Erro ao carregar reservas: ' + e.message, { type: 'error' })
	})
}

// ── Lifecycle ──
onMounted(async () => {
	try {
		await fetchHorarios(idEntidade.value)
	} catch (e: any) {
		showToast('Erro ao carregar horários: ' + e.message, { type: 'error' })
	}
	if (activeTab.value === 'calendario') fetchReservasWrapper()
})

watch(currentDate, () => {
	if (activeTab.value === 'calendario') fetchReservasWrapper()
})

watch(activeTab, (tab) => {
	if (tab === 'calendario' && horarios.value.length > 0) {
		fetchReservasWrapper()
	}
})
</script>

<template>
	<div class="h-full flex flex-col page-wrap">
		<!-- Tabs Navigation -->
		<div class="page-top-row shrink-0">
			<nav class="ds-tabs-nav">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					@click="activeTab = tab.id"
					class="ds-tab-btn"
					:class="{ 'ds-tab-btn--active': activeTab === tab.id }"
				>{{ tab.label }}</button>
			</nav>
		</div>

		<!-- ═══ ABA: SALAS ═══ -->
		<CalendarioSalasTabSalas
			v-if="activeTab === 'salas'"
			:idEntidade="idEntidade"
			@refresh="fetchReservasWrapper"
		/>

		<!-- ═══ ABA: HORÁRIOS ═══ -->
		<CalendarioSalasTabHorarios
			v-if="activeTab === 'horarios'"
			:idEntidade="idEntidade"
			@refresh="fetchReservasWrapper"
		/>

		<!-- ═══ ABA: CALENDÁRIO ═══ -->
		<template v-if="activeTab === 'calendario'">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">

				<div class="flex items-center gap-3 w-full md:w-auto flex-wrap">
					<!-- Sala Filter -->
					<div class="w-full md:w-48">
						<BaseSelect
							v-model="selectedSala"
							:options="[
								{ id: 'all', nome: 'Todas as Salas' },
								...availableSalas.map((s) => ({ id: s, nome: s })),
							]"
							labelKey="nome"
							valueKey="id"
							placeholder="Filtrar por sala"
						/>
					</div>

					<div class="h-8 w-px bg-divider mx-1 hidden md:block" />

					<!-- Date Picker -->
					<div class="relative">
						<input
							ref="dateInput"
							type="date"
							:value="format(currentDate, 'yyyy-MM-dd')"
							@input="(e) => (currentDate = new Date((e.target as HTMLInputElement).value))"
							class="absolute inset-0 w-0 h-0 opacity-0"
							style="visibility: hidden"
						/>
						<button
							@click="() => dateInput?.showPicker()"
							class="bg-field-bg border border-field-border rounded-xl px-4 py-2.5 text-xs font-bold text-field-text flex items-center gap-2 h-[42px] hover:border-primary/50 transition-colors w-full"
						>
							<Icon name="ph:calendar-blank-light" class="w-4 h-4 text-secondary" />
							<span>{{ format(currentDate, 'dd/MM/yyyy') }}</span>
						</button>
					</div>

					<!-- Navigation -->
					<div class="flex items-center bg-div-15 rounded-xl border border-divider h-[42px]">
						<button
							@click="navigateWeek('prev')"
							class="px-3 text-secondary hover:text-text border-r border-divider h-full flex items-center transition-colors"
							title="Semana anterior"
						>
							<Icon name="ph:caret-left-bold" class="w-4 h-4" />
						</button>
						<button
							@click="navigateWeek('today')"
							class="px-4 text-[10px] font-black uppercase tracking-widest text-text h-full flex items-center hover:bg-div-30 transition-colors"
						>
							Hoje
						</button>
						<button
							@click="navigateWeek('next')"
							class="px-3 text-secondary hover:text-text border-l border-divider h-full flex items-center transition-colors"
							title="Próxima semana"
						>
							<Icon name="ph:caret-right-bold" class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			<!-- Grid -->
			<CalendarioGrid
				v-if="!isLoadingHorarios"
				:horarios="filteredHorarios"
				:week-days="weekDays"
				:reservas="reservas"
				:is-loading="isLoadingReservas"
				@cell-click="handleCellClick"
			/>
			<div v-else class="flex-1 flex items-center justify-center">
				<div class="flex flex-col items-center gap-3">
					<div class="w-8 h-8 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
					<p class="text-xs text-secondary/60 font-bold uppercase tracking-widest">Carregando salas...</p>
				</div>
			</div>
		</template>

		<!-- Modal Reserva -->
		<CalendarioReservaModal
			v-model="showReservationModal"
			:slotData="selectedSlot"
			:day="selectedDay"
			:existingReserva="selectedExistingReserva"
			:allHorarios="horarios"
			:allReservas="reservas"
			:idEntidade="idEntidade"
			:userId="appStore.user_expandido_id || ''"
			@refresh="fetchReservasWrapper"
		/>
	</div>
</template>

<style scoped>
.page-wrap {
	padding: 0.25rem 1.5rem 1rem;
}
.page-top-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.75rem;
	flex-wrap: wrap;
	gap: 1rem;
}
</style>
