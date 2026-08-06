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
const getTipoCor = (tipo: string) => (tipo === 'aula' ? 'bg-[#4B5563]' : 'bg-primary')
const getTipoBadge = (tipo: string) =>
	tipo === 'aula'
		? 'bg-[#4B5563]/20 text-[#9CA3AF] border-[#4B5563]/30'
		: 'bg-primary/20 text-primary border-primary/30'
</script>

<template>
	<div
		class="flex-1 min-h-0 overflow-auto bg-[var(--field-bg-select)] border border-white/5 rounded-xl relative custom-scrollbar"
	>
		<!-- Date Headers Sticky -->
		<div
			class="border-b border-white/10 sticky top-0 bg-[var(--field-bg-select)] z-20 grid"
			style="grid-template-columns: 200px repeat(7, minmax(140px, 1fr))"
		>
			<div
				class="p-4 flex flex-col justify-center items-center border-r border-white/5 font-bold text-secondary/60 text-[10px] uppercase tracking-widest bg-[var(--field-bg-select)] sticky left-0 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.5)]"
			>
				Sala / Horário
			</div>
			<div
				v-for="day in weekDays"
				:key="day.toString()"
				class="p-3 text-center border-r border-white/5 last:border-0 bg-[var(--field-bg-select)]"
				:class="isSameDay(day, new Date()) ? 'bg-primary/5' : ''"
			>
				<div class="text-[10px] uppercase font-bold text-secondary/60 mb-1">
					{{ format(day, 'EEE', { locale: ptBR }) }}
				</div>
				<div
					class="text-xl font-black"
					:class="isSameDay(day, new Date()) ? 'text-primary' : 'text-white'"
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
				class="border-b border-white/5 hover:bg-white/[0.02] transition-colors grid"
				style="grid-template-columns: 200px repeat(7, minmax(140px, 1fr))"
			>
				<!-- Left Header Sticky: Sala + Horário -->
				<div
					class="sticky left-0 bg-[var(--field-bg-select)] border-r border-white/5 p-4 flex flex-col justify-center z-10 shadow-[4px_0_12px_rgba(0,0,0,0.2)]"
					:style="{ borderLeft: `4px solid ${slot.sala_cor || '#8b5cf6'}` }"
				>
					<span class="text-sm font-bold text-white mb-1">{{ slot.sala_nome }}</span>
					<span class="text-xs font-medium text-secondary/60">{{ slot.horario_total }}</span>
				</div>

				<!-- Day Cells -->
				<div
					v-for="day in weekDays"
					:key="slot.slot_key + day.toString()"
					class="border-r border-white/5 last:border-0 p-1 min-h-[80px] relative"
				>
					<button
						@click="handleCellClick(slot, day)"
						@mouseenter="handleMouseEnter($event, slot, day)"
						@mouseleave="handleMouseLeave"
						class="w-full min-h-[80px] rounded-lg flex flex-col items-center justify-center p-2 transition-all relative group"
						:class="slot.is_intervalo ? 'cursor-default opacity-40' : 'hover:bg-white/5 cursor-pointer'"
					>
						<template v-if="getReservaForSlot(slot.slot_key, day)">
							<div
								class="absolute inset-1 rounded-lg border-l-4 flex flex-col items-start justify-center px-3 shadow-lg z-0 overflow-hidden"
								:class="[
									getReservaForSlot(slot.slot_key, day)?.tipo === 'aula'
										? 'bg-[#1A1B26]/90'
										: 'bg-[#1A1B26]',
								]"
								:style="
									getReservaForSlot(slot.slot_key, day)?.tipo === 'aula'
										? { borderLeftColor: '#4B5563' }
										: { borderLeftColor: slot.sala_cor || '#8b5cf6', backgroundColor: `${slot.sala_cor}20` }
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
								<span class="text-xs font-bold w-full z-10 relative line-clamp-2 text-left text-white">
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
							<span class="text-xs text-amber-500/50 font-bold uppercase tracking-wider">Intervalo</span>
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
			class="fixed z-50 bg-[#1A1B26] border border-white/10 rounded-xl shadow-2xl p-4 w-72 pointer-events-none transition-opacity duration-200"
			:style="{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }"
		>
			<div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
				<div class="w-1.5 h-4 rounded" :class="getTipoCor(hoveredInfo.tipo)" />
				<span class="text-xs font-black text-white uppercase tracking-widest">
					{{ getTipoLabel(hoveredInfo.tipo) }}
				</span>
			</div>

			<h4 class="text-sm font-bold text-white mb-2 leading-tight">
				{{
					hoveredInfo.tipo === 'aula'
						? (hoveredInfo.aula_titulo || 'Aula')
						: (hoveredInfo.evento_nome || hoveredInfo.evento_descricao || 'Evento')
				}}
			</h4>

			<div v-if="hoveredInfo.docente_nome" class="flex items-center gap-1.5 mb-1.5">
				<span class="text-[11px] text-secondary/40 uppercase tracking-wider font-bold">Prof:</span>
				<span class="text-xs text-white/80">{{ hoveredInfo.docente_nome }}</span>
			</div>

			<div v-if="hoveredInfo.observacoes" class="text-xs text-secondary/60 bg-black/20 p-2 rounded-lg leading-relaxed mt-2">
				{{ hoveredInfo.observacoes }}
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #16161e; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-corner { background: #16161e; }
</style>
