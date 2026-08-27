<script setup lang="ts">
import { ref } from 'vue'
import { isSameDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

const props = defineProps<{
	horarios: any[]
	weekDays: Date[]
	reservas: any[]
	isLoading: boolean
}>()

const emit = defineEmits<{
	(e: 'cell-click', slot: any, day: Date): void
}>()

const hoveredInfo = ref<any>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const getReservaForSlot = (slotKey: string, day: Date) => {
	const targetDate = formatInTimeZone(day, 'America/Sao_Paulo', 'yyyy-MM-dd')
	return props.reservas.find(
		(r: any) => r.slot_key === slotKey && r.data === targetDate,
	)
}

const handleMouseEnter = (event: MouseEvent, slot: any, day: Date) => {
	const reserva = getReservaForSlot(slot.slot_key, day)
	if (!reserva) return
	hoveredInfo.value = reserva
	const target = event.currentTarget as HTMLElement
	const rect = target.getBoundingClientRect()
	tooltipPos.value = { x: rect.right + 10, y: rect.top }
}

const handleMouseLeave = () => {
	hoveredInfo.value = null
}

const handleCellClick = (slot: any, day: Date) => {
	if (!slot.is_intervalo) {
		emit('cell-click', slot, day)
	}
}

const getTipoLabel = (tipo: string) => (tipo === 'aula' ? 'Aula' : 'Evento')
const getTipoCor = (tipo: string) => (tipo === 'aula' ? 'bg-secondary' : 'bg-primary')
const getTipoBadge = (tipo: string) =>
	tipo === 'aula'
		? 'bg-div-30 text-secondary border-divider'
		: 'bg-primary/10 text-primary border-primary/20'
</script>

<template>
	<div
		class="flex-1 min-h-0 overflow-auto bg-secondary-surface border border-divider rounded-xl relative custom-scrollbar"
	>
		<!-- Date Headers Sticky -->
		<div
			class="border-b border-divider sticky top-0 bg-secondary-surface z-20 grid"
			style="grid-template-columns: 200px repeat(7, minmax(140px, 1fr))"
		>
			<div
				class="p-4 flex flex-col justify-center items-center border-r border-divider font-bold text-secondary/60 text-[10px] uppercase tracking-widest bg-secondary-surface sticky left-0 z-30 shadow-md"
			>
				Sala / Horário
			</div>
			<div
				v-for="day in weekDays"
				:key="day.toString()"
				class="p-3 text-center border-r border-divider last:border-0 bg-secondary-surface"
				:class="isSameDay(day, new Date()) ? 'bg-primary/5' : ''"
			>
				<div class="text-[10px] uppercase font-bold text-secondary/60 mb-1">
					{{ format(day, 'EEE', { locale: ptBR }) }}
				</div>
				<div
					class="text-xl font-black"
					:class="isSameDay(day, new Date()) ? 'text-primary' : 'text-text'"
				>
					{{ format(day, 'dd/MM') }}
				</div>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="isLoading && !horarios.length" class="flex justify-center py-20">
			<div class="w-8 h-8 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
		</div>

		<!-- Grid Rows -->
		<template v-else>
			<div
				v-for="slot in horarios"
				:key="slot.slot_key"
				class="border-b border-divider hover:bg-div-15 transition-colors grid"
				style="grid-template-columns: 200px repeat(7, minmax(140px, 1fr))"
			>
				<!-- Left Header Sticky: Sala + Horário -->
				<div
					class="sticky left-0 bg-secondary-surface border-r border-divider p-4 flex flex-col justify-center z-10 shadow-md"
					:style="{ borderLeft: `4px solid ${slot.sala_cor || '#8b5cf6'}` }"
				>
					<span class="text-sm font-bold text-text mb-1">{{ slot.sala_nome }}</span>
					<span class="text-xs font-medium text-secondary/60">{{ slot.horario_total }}</span>
				</div>

				<!-- Day Cells -->
				<div
					v-for="day in weekDays"
					:key="slot.slot_key + day.toString()"
					class="border-r border-divider last:border-0 p-1 min-h-[80px] relative"
				>
					<button
						@click="handleCellClick(slot, day)"
						@mouseenter="handleMouseEnter($event, slot, day)"
						@mouseleave="handleMouseLeave"
						class="w-full min-h-[80px] rounded-lg flex flex-col items-center justify-center p-2 transition-all relative group"
						:class="slot.is_intervalo ? 'cursor-default opacity-40' : 'hover:bg-div-15 cursor-pointer'"
					>
						<template v-if="getReservaForSlot(slot.slot_key, day)">
							<div
								class="absolute inset-1 rounded-lg border-l-4 flex flex-col items-start justify-center px-3 shadow-sm z-0 overflow-hidden bg-div-15 border-divider"
								:style="
									getReservaForSlot(slot.slot_key, day)?.tipo === 'aula'
										? { borderLeftColor: '#8c878d' }
										: { borderLeftColor: slot.sala_cor || '#8b5cf6', backgroundColor: `${slot.sala_cor}15` }
								"
							>
								<div class="flex items-center gap-1.5 mb-0.5">
									<span
										class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border"
										:class="getTipoBadge(getReservaForSlot(slot.slot_key, day)?.tipo)"
									>
										{{ getTipoLabel(getReservaForSlot(slot.slot_key, day)?.tipo) }}
									</span>
								</div>
								<span class="text-xs font-bold w-full z-10 relative line-clamp-2 text-left text-text">
									{{
										getReservaForSlot(slot.slot_key, day)?.tipo === 'aula'
											? (getReservaForSlot(slot.slot_key, day)?.aula_titulo || 'Aula')
											: (getReservaForSlot(slot.slot_key, day)?.evento_nome
												|| getReservaForSlot(slot.slot_key, day)?.evento_descricao
												|| 'Evento')
									}}
								</span>
								<span
									v-if="getReservaForSlot(slot.slot_key, day)?.observacoes"
									class="text-[10px] text-left w-full truncate z-10 relative mt-0.5 text-secondary/60"
								>
									{{ getReservaForSlot(slot.slot_key, day)?.observacoes }}
								</span>
							</div>
						</template>
						<template v-else-if="slot.is_intervalo">
							<span class="text-xs text-amber-500/60 font-bold uppercase tracking-wider">Intervalo</span>
						</template>
						<template v-else>
							<span class="opacity-0 group-hover:opacity-100 text-secondary/60 text-xs font-bold transition-opacity">
								+
							</span>
						</template>
					</button>
				</div>
			</div>
		</template>
	</div>

	<!-- Tooltip -->
	<Teleport to="body">
		<div
			v-if="hoveredInfo"
			class="fixed z-50 bg-secondary-surface border border-divider rounded-xl shadow-2xl p-4 w-72 pointer-events-none transition-opacity duration-200"
			:style="{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }"
		>
			<div class="flex items-center gap-2 mb-2 pb-2 border-b border-divider">
				<div class="w-1.5 h-4 rounded" :class="getTipoCor(hoveredInfo.tipo)" />
				<span class="text-xs font-black text-text uppercase tracking-widest">
					{{ getTipoLabel(hoveredInfo.tipo) }}
				</span>
			</div>

			<h4 class="text-sm font-bold text-text mb-2 leading-tight">
				{{
					hoveredInfo.tipo === 'aula'
						? (hoveredInfo.aula_titulo || 'Aula')
						: (hoveredInfo.evento_nome || hoveredInfo.evento_descricao || 'Evento')
				}}
			</h4>

			<div v-if="hoveredInfo.docente_nome" class="flex items-center gap-1.5 mb-1.5">
				<span class="text-[11px] text-secondary/50 uppercase tracking-wider font-bold">Prof:</span>
				<span class="text-xs text-text">{{ hoveredInfo.docente_nome }}</span>
			</div>

			<div v-if="hoveredInfo.observacoes" class="text-xs text-secondary bg-div-15 border border-divider p-2 rounded-lg leading-relaxed mt-2">
				{{ hoveredInfo.observacoes }}
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.12); border-radius: 4px; }
</style>
