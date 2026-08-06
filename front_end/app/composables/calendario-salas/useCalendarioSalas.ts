import { ref, computed } from 'vue'
import { formatInTimeZone } from 'date-fns-tz'

export function useCalendarioSalas() {
	const horarios = ref<any[]>([])
	const reservas = ref<any[]>([])
	const isLoadingHorarios = ref(false)
	const isLoadingReservas = ref(false)

	const availableSalas = computed(() => {
		const unique = new Set(horarios.value.map((h: any) => h.sala_nome))
		return Array.from(unique)
	})

	const fetchHorarios = async (idEntidade: string) => {
		isLoadingHorarios.value = true
		try {
			const data = await $fetch('/api/calendario-salas/horarios', {
				params: { id_entidade: idEntidade },
			})
			horarios.value = (data as any[]) || []
		} finally {
			isLoadingHorarios.value = false
		}
	}

	const fetchReservas = async (idEntidade: string, start: string, end: string) => {
		isLoadingReservas.value = true
		try {
			const data = await $fetch('/api/calendario-salas/reservas', {
				params: { id_entidade: idEntidade, start, end },
			})
			reservas.value = (data as any[]) || []
		} finally {
			isLoadingReservas.value = false
		}
	}

	/**
	 * Busca reserva pelo slot_key (salaId_horarioId) + data
	 */
	const getReservaForSlot = (slotKey: string, day: Date) => {
		const targetDate = formatInTimeZone(day, 'America/Sao_Paulo', 'yyyy-MM-dd')
		return reservas.value.find(
			(r: any) => r.slot_key === slotKey && r.data === targetDate,
		)
	}

	return {
		horarios,
		reservas,
		isLoadingHorarios,
		isLoadingReservas,
		availableSalas,
		fetchHorarios,
		fetchReservas,
		getReservaForSlot,
	}
}
