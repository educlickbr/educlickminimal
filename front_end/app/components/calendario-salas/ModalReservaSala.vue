<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
	modelValue: boolean
	slotData: any
	day: Date
	existingReserva?: any
	allHorarios: any[]
	allReservas: any[]
	idEntidade: string
	userId: string
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void
	(e: 'refresh'): void
}>()

const isLoading = ref(false)
const isSaving = ref(false)
const mode = ref<'create' | 'edit'>('create')
const tipo = ref<'aula' | 'evento'>('evento')

// Evento
const eventoModo = ref<'existente' | 'rapido'>('existente')
const selectedEventoId = ref<string | null>(null)
const eventoNome = ref('')
const eventosDisponiveis = ref<any[]>([])

// Aula
const selectedAulaId = ref<string | null>(null)
const aulasDisponiveis = ref<any[]>([])
const isLoadingAulas = ref(false)

const observacoes = ref('')
const scope = ref<'horario' | 'periodo' | 'dia'>('horario')

watch(() => props.modelValue, (val) => { if (val) initModal() })

const initModal = async () => {
	scope.value = 'horario'
	if (props.existingReserva) {
		mode.value = 'edit'
		tipo.value = props.existingReserva.tipo === 'aula' ? 'aula' : 'evento'
		observacoes.value = props.existingReserva.observacoes || ''
		if (tipo.value === 'evento') {
			selectedEventoId.value = props.existingReserva.id_evento || null
			eventoNome.value = props.existingReserva.evento_nome || ''
			eventoModo.value = selectedEventoId.value ? 'existente' : 'rapido'
		} else {
			selectedAulaId.value = props.existingReserva.id_aula
		}
	} else {
		mode.value = 'create'; tipo.value = 'evento'
		eventoModo.value = 'existente'; selectedEventoId.value = null
		eventoNome.value = ''; observacoes.value = ''
		selectedAulaId.value = null
	}
	await loadOptions()
}

const loadOptions = async () => {
	if (tipo.value === 'evento') await fetchEventos()
	else await fetchAulas()
}
watch(tipo, async () => { if (props.modelValue) await loadOptions() })

const fetchEventos = async () => {
	const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	isLoading.value = true
	try {
		const data = await $fetch('/api/calendario-salas/eventos', { params: { id_entidade: props.idEntidade, start: dayStr, end: dayStr } })
		eventosDisponiveis.value = (data as any[]) || []
	} finally { isLoading.value = false }
}

const fetchAulas = async () => {
	const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	isLoadingAulas.value = true
	try {
		const data = await $fetch('/api/calendario-salas/aulas', { params: { id_entidade: props.idEntidade, start: dayStr, end: dayStr } })
		aulasDisponiveis.value = (data as any[]) || []
	} finally { isLoadingAulas.value = false }
}

const compatAula = (aula: any): 'ok' | 'partial' | 'mismatch' => {
	if (!props.slotData) return 'mismatch'
	const slotIni = props.slotData.hora_ini || ''
	const slotFim = props.slotData.hora_fim || ''
	const aIni = aula.hora_ini?.substring(0, 5) || ''
	const aFim = aula.hora_fim?.substring(0, 5) || ''
	if (aIni === slotIni) return 'ok'
	if (aIni <= slotIni && aFim >= slotFim) return 'partial'
	return 'mismatch'
}
const compatLabel = (c: string) => c === 'ok' ? '✅ Encaixa' : c === 'partial' ? '⚠️ Janela maior' : '❌ Horário diferente'
const compatBadge = (c: string) => c === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : c === 'partial' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'

const targetSlots = computed(() => {
	if (!props.slotData) return []
	const salaId = props.slotData.sala_id
	if (scope.value === 'horario') return [props.slotData]
	if (scope.value === 'periodo') return props.allHorarios.filter((h: any) => h.sala_id === salaId && h.turno_nome === props.slotData.turno_nome && !h.is_intervalo)
	if (scope.value === 'dia') return props.allHorarios.filter((h: any) => h.sala_id === salaId && !h.is_intervalo)
})

const checkConflict = (s: 'horario' | 'periodo' | 'dia'): boolean => {
	const salaId = props.slotData?.sala_id
	let slots: any[] = []
	if (s === 'horario') slots = [props.slotData]
	else if (s === 'periodo') slots = props.allHorarios.filter((h: any) => h.sala_id === salaId && h.turno_nome === props.slotData?.turno_nome && !h.is_intervalo)
	else slots = props.allHorarios.filter((h: any) => h.sala_id === salaId && !h.is_intervalo)
	const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	const exList = props.allReservas.filter((r: any) => r.data === dayStr)
	for (const slot of slots) {
		const c = exList.find((r: any) => r.id_sala === slot.sala_id && r.id_horario === slot.horario_id)
		if (c && (!props.existingReserva || c.id !== props.existingReserva.id)) return true
	}
	return false
}
const isPeriodoDisabled = computed(() => checkConflict('periodo'))
const isDiaDisabled = computed(() => checkConflict('dia'))

// ── Save ──
const save = async () => {
	if (tipo.value === 'evento') {
		if (eventoModo.value === 'existente' && !selectedEventoId.value) { useToast().showToast('Selecione um evento', { type: 'error' }); return }
		if (eventoModo.value === 'rapido' && !eventoNome.value.trim()) { useToast().showToast('Informe o nome do evento', { type: 'error' }); return }
	}
	if (tipo.value === 'aula' && !selectedAulaId.value) { useToast().showToast('Selecione uma aula', { type: 'error' }); return }

	isSaving.value = true
	try {
		let eventoId = selectedEventoId.value

		if (tipo.value === 'evento' && eventoModo.value === 'rapido') {
			const dayStr2 = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
			const created = await $fetch('/api/calendario-salas/eventos', {
				method: 'POST',
				body: { id_entidade: props.idEntidade, nome_evento: eventoNome.value.trim(), data: dayStr2, user_id: props.userId },
			}) as any
			eventoId = created.id
		}

		const slots = targetSlots.value || []
		const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
		const payload = slots.map((s: any) => ({
			id_entidade: props.idEntidade, id_sala: s.sala_id, id_horario: s.horario_id,
			data: dayStr, status: 'reservado', tipo: tipo.value,
			id_evento: tipo.value === 'evento' ? eventoId : null,
			id_aula: tipo.value === 'aula' ? selectedAulaId.value : null,
			observacoes: observacoes.value,
			reserva_escopo: scope.value,
		}))
		await $fetch('/api/calendario-salas/reservas', { method: 'POST', body: { reservas: payload, user_id: props.userId } })
		useToast().showToast('Reserva salva com sucesso', { type: 'success' })
		emit('refresh'); emit('update:modelValue', false)
	} catch (e: any) { useToast().showToast('Erro ao salvar: ' + e.message, { type: 'error' })
	} finally { isSaving.value = false }
}

// ── Delete ──
const showConfirmDelete = ref(false)
const deleteScope = ref<'horario' | 'periodo' | 'dia'>('horario')

const handleDeleteClick = () => { showConfirmDelete.value = true; deleteScope.value = 'horario' }

const handleDeleteScopeClick = (scope: 'horario' | 'periodo' | 'dia', enabled: boolean) => {
	if (enabled) deleteScope.value = scope
}

const getDeleteTargetIds = (): string[] => {
	const reserva = props.existingReserva
	if (!reserva) return []

	if (deleteScope.value === 'horario') return [reserva.id]

	const grupoId = reserva.reserva_grupo_id
	if (!grupoId) return [reserva.id]

	const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	const targets = props.allReservas.filter((r: any) => {
		if (r.reserva_grupo_id !== grupoId) return false
		if (r.data !== dayStr) return false
		if (deleteScope.value === 'periodo') {
			const slotH = props.allHorarios.find((h: any) => h.horario_id === r.id_horario)
			const currH = props.allHorarios.find((h: any) => h.horario_id === reserva.id_horario)
			return slotH?.turno_nome === currH?.turno_nome
		}
		return true
	})
	return targets.map((r: any) => r.id)
}

// Saber quantos slots têm no mesmo grupo para habilitar/desabilitar escopos
const grupoSlotsCount = computed(() => {
	const reserva = props.existingReserva
	if (!reserva?.reserva_grupo_id) return 1
	const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	return props.allReservas.filter((r: any) =>
		r.reserva_grupo_id === reserva.reserva_grupo_id && r.data === dayStr
	).length
})

// Horários totais por turno (sem intervalo) no dia
const horariosPorTurno = computed(() => {
	const map: Record<string, number> = {}
	for (const h of props.allHorarios) {
		if (!h.is_intervalo) {
			map[h.turno_nome] = (map[h.turno_nome] || 0) + 1
		}
	}
	return map
})

const horariosTotalDia = computed(() =>
	Object.values(horariosPorTurno.value).reduce((a, b) => a + b, 0)
)

const canPeriodo = computed(() => {
	const reserva = props.existingReserva
	if (!reserva?.reserva_grupo_id) return false
	// Só habilita período se os slots do grupo correspondem exatamente a UM turno
	const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	const grupo = props.allReservas.filter((r: any) =>
		r.reserva_grupo_id === reserva.reserva_grupo_id && r.data === dayStr
	)
	// Verifica se todos os slots do grupo são do mesmo turno
	const turnos = new Set(grupo.map((r: any) => {
		const hh = props.allHorarios.find((h: any) => h.horario_id === r.id_horario)
		return hh?.turno_nome
	}))
	if (turnos.size !== 1) return false
	const turno = [...turnos][0]
	// E se a quantidade corresponde ao total do turno
	const total = horariosPorTurno.value[turno] || 0
	return grupo.length >= total && total > 1
})

const canDia = computed(() => {
	const reserva = props.existingReserva
	if (!reserva?.reserva_grupo_id) return false
	const dayStr = formatInTimeZone(props.day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	const grupoCount = props.allReservas.filter((r: any) =>
		r.reserva_grupo_id === reserva.reserva_grupo_id && r.data === dayStr
	).length
	return grupoCount >= horariosTotalDia.value && horariosTotalDia.value > 1
})

const confirmRemove = async () => {
	const targetIds = getDeleteTargetIds()
	if (!targetIds.length) return
	isSaving.value = true
	try {
		for (const id of targetIds) {
			await $fetch('/api/calendario-salas/reservas', { method: 'DELETE', params: { id } })
		}
		useToast().showToast(`${targetIds.length} reserva(s) excluída(s)`, { type: 'info' })
		emit('refresh'); emit('update:modelValue', false)
	} catch (e: any) { useToast().showToast('Erro ao excluir: ' + e.message, { type: 'error' })
	} finally { isSaving.value = false; showConfirmDelete.value = false }
}

const close = () => emit('update:modelValue', false)
const dayFormatted = computed(() => props.day ? format(props.day, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '')
</script>

<template>
	<div v-if="modelValue" class="fixed inset-0 z-50 bg-[rgba(0,0,0,0.85)] flex items-center justify-center p-4 animate-fadeIn" @click.self="close">
		<div class="relative bg-[#13131a] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.7)] animate-slideUp border border-primary/18">
			<div class="modal-accent-bar" />
			<div class="modal-header flex items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-black text-white uppercase tracking-widest">{{ mode === 'create' ? 'Nova Reserva' : showConfirmDelete ? 'Excluir Reserva' : 'Editar Reserva' }}</h2>
						<p class="text-xs text-secondary/60 mt-0.5">{{ slotData?.sala_nome }} — {{ dayFormatted }}</p>
					</div>
				</div>
				<button @click="close" class="text-secondary/40 hover:text-white transition-colors p-1">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
				</button>
			</div>

			<!-- Painel de Edição (criação ou edição) -->
			<div v-show="!showConfirmDelete" class="p-6 overflow-y-auto flex-1 space-y-5 max-h-[65vh] custom-scrollbar">
				<!-- Tipo -->
				<div>
					<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Tipo de Reserva</label>
					<div class="flex p-1 bg-black/20 rounded-lg gap-1">
						<button v-for="opt in [{ id: 'evento', label: 'Evento' }, { id: 'aula', label: 'Aula' }]" :key="opt.id"
							@click="tipo = opt.id as 'aula' | 'evento'"
							class="flex-1 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
							:class="tipo === opt.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-secondary/40 hover:text-white'">{{ opt.label }}</button>
					</div>
				</div>

				<!-- EVENTO -->
				<template v-if="tipo === 'evento'">
					<div class="flex p-1 bg-black/20 rounded-lg gap-1">
						<button v-for="opt in [{ id: 'existente', label: 'Evento existente' }, { id: 'rapido', label: 'Criar rápido' }]" :key="opt.id"
							@click="eventoModo = opt.id as 'existente' | 'rapido'"
							class="flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
							:class="eventoModo === opt.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-secondary/40 hover:text-white'">{{ opt.label }}</button>
					</div>
					<div v-if="eventoModo === 'existente'">
						<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Selecionar Evento</label>
						<BaseSelect v-if="!isLoading" v-model="selectedEventoId"
							:options="eventosDisponiveis.map((e: any) => ({ id: e.id, nome: e.nome_evento }))" placeholder="Selecione um evento..." />
						<div v-else class="flex items-center gap-2 text-xs text-secondary/60 py-2">
							<div class="w-4 h-4 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />Carregando eventos...
						</div>
						<p v-if="!isLoading && eventosDisponiveis.length === 0" class="text-xs text-secondary/40 mt-1">Nenhum evento nesta data.</p>
					</div>
					<div v-else>
						<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Nome do Evento</label>
						<input v-model="eventoNome" type="text" placeholder="Ex: Palestra, Reunião..."
							class="w-full rounded-xl px-4 py-3 text-sm bg-[var(--field-bg-select)] border border-[var(--field-border)] text-[var(--field-text)] placeholder-[var(--field-placeholder)] focus:outline-none focus:border-[var(--field-border-focus)] focus:shadow-[var(--field-shadow-focus)] transition-all" />
					</div>
				</template>

				<!-- AULA -->
				<div v-else>
					<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Aulas de {{ dayFormatted }}</label>
					<div v-if="isLoadingAulas" class="flex items-center gap-2 text-xs text-secondary/60 py-4">
						<div class="w-4 h-4 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />Carregando aulas...
					</div>
					<p v-else-if="aulasDisponiveis.length === 0" class="text-xs text-secondary/40 py-2">Nenhuma aula disponível nesta data.</p>
					<div v-else class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
						<label v-for="aula in aulasDisponiveis" :key="aula.id"
							class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
							:class="selectedAulaId === aula.id ? 'border-primary/30 bg-primary/5' : 'border-white/5 hover:border-white/10'">
							<input type="radio" :value="aula.id" v-model="selectedAulaId" class="accent-primary mt-1 shrink-0" />
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-0.5">
									<span class="text-sm font-bold text-white truncate">{{ aula.observacao || 'Aula' }}</span>
									<span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0" :class="compatBadge(compatAula(aula))">{{ compatLabel(compatAula(aula)) }}</span>
								</div>
								<div class="flex items-center gap-2 text-xs text-secondary/60">
									<span>{{ aula.hora_ini?.substring(0, 5) }} — {{ aula.hora_fim?.substring(0, 5) }}</span>
									<span v-if="aula.programa_nome" class="text-secondary/40">•</span>
									<span v-if="aula.programa_nome" class="text-secondary/40 truncate">{{ aula.programa_nome }}</span>
								</div>
								<div v-if="aula.docente_nome" class="text-xs text-secondary/40 mt-0.5">Prof: {{ aula.docente_nome }}</div>
							</div>
						</label>
					</div>
				</div>

				<!-- Observações -->
				<div>
					<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Observações <span class="text-secondary/30">(opcional)</span></label>
					<textarea v-model="observacoes" rows="2" placeholder="Observações..."
						class="w-full rounded-xl px-4 py-3 text-sm bg-[var(--field-bg-select)] border border-[var(--field-border)] text-[var(--field-text)] placeholder-[var(--field-placeholder)] focus:outline-none focus:border-[var(--field-border-focus)] focus:shadow-[var(--field-shadow-focus)] transition-all resize-none" />
				</div>

				<!-- Escopo (só na criação) -->
				<div v-if="mode === 'create'">
					<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-3">Escopo</label>
					<div class="space-y-2">
						<label :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all', scope === 'horario' ? 'border-primary/30 bg-primary/5' : 'border-white/5 hover:border-white/10']">
							<input type="radio" v-model="scope" value="horario" class="accent-primary" />
							<div><span class="text-sm font-bold text-white">Apenas este horário</span><p class="text-xs text-secondary/60">{{ slotData?.horario_total }}</p></div>
						</label>
						<label :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all', scope === 'periodo' ? 'border-primary/30 bg-primary/5' : 'border-white/5 hover:border-white/10', isPeriodoDisabled ? 'opacity-50 cursor-not-allowed' : '']">
							<input type="radio" v-model="scope" value="periodo" class="accent-primary" :disabled="isPeriodoDisabled" />
							<div><span class="text-sm font-bold text-white">Período inteiro</span><p class="text-xs text-secondary/60">{{ slotData?.turno_nome }} nesta sala</p></div>
						</label>
						<label :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all', scope === 'dia' ? 'border-primary/30 bg-primary/5' : 'border-white/5 hover:border-white/10', isDiaDisabled ? 'opacity-50 cursor-not-allowed' : '']">
							<input type="radio" v-model="scope" value="dia" class="accent-primary" :disabled="isDiaDisabled" />
							<div><span class="text-sm font-bold text-white">Dia inteiro</span><p class="text-xs text-secondary/60">Todos horários desta sala</p></div>
						</label>
					</div>
				</div>
				<!-- Botão Excluir (modo edição) -->
				<div v-if="mode === 'edit' && existingReserva" class="pt-2">
					<button @click="handleDeleteClick" class="w-full px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">
						Excluir esta reserva
					</button>
				</div>
			</div>

			<!-- Painel de Exclusão (com escopo) -->
			<div v-show="showConfirmDelete" class="p-6 flex-1 flex flex-col items-center justify-center gap-5">
				<div class="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</div>
				<p class="text-sm font-bold text-white text-center">Excluir {{ grupoSlotsCount }} reserva(s)?</p>
				<div class="flex items-center gap-1 bg-black/20 rounded-lg p-0.5 w-full">
					<button v-for="opt in [
						{ id: 'horario', label: '1 horário', enabled: true },
						{ id: 'periodo', label: 'Período', enabled: canPeriodo },
						{ id: 'dia', label: 'Dia inteiro', enabled: canDia },
					]" :key="opt.id"
						@click="handleDeleteScopeClick(opt.id, opt.enabled)"
						class="flex-1 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
						:class="[
							deleteScope === opt.id ? 'bg-red-500/20 text-red-400' : 'text-secondary/60 hover:text-white',
							!opt.enabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
						]">{{ opt.label }}</button>
				</div>
				<p class="text-xs text-secondary/60 text-center">
					{{ deleteScope === 'horario' ? 'Exclui apenas este horário' : deleteScope === 'periodo' ? 'Exclui todos horários do ' + slotData?.turno_nome : 'Exclui todos horários do dia' }}
				</p>
			</div>

			<div class="p-4 border-t border-white/5 flex items-center justify-end gap-2.5 bg-black/15 shrink-0">
				<template v-if="!showConfirmDelete">
					<button @click="close" class="px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-secondary/60 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
					<button @click="save" :disabled="isSaving" class="px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">{{ isSaving ? 'Salvando...' : 'Salvar' }}</button>
				</template>
				<template v-else>
					<button @click="showConfirmDelete = false" class="px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-secondary/60 hover:text-white hover:bg-white/5 transition-all">Voltar</button>
					<button @click="confirmRemove" :disabled="isSaving" class="px-6 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 disabled:opacity-50">
						{{ isSaving ? 'Excluindo...' : 'Confirmar Exclusão' }}
					</button>
				</template>
			</div>
		</div>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
.animate-fadeIn { animation: fadeIn 0.15s ease; }
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
.animate-slideUp { animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1); }
@keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
</style>
