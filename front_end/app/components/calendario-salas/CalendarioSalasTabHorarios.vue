<script setup lang="ts">
import { useAppStore } from '~~/stores/app'

const props = defineProps<{
	idEntidade: string
}>()

const emit = defineEmits<{
	(e: 'refresh'): void
}>()

const appStore = useAppStore()

const horarios = ref<any[]>([])
const isLoading = ref(false)
const showModal = ref(false)
const editingHorario = ref<any>(null)
const formIndice = ref(1)
const formTurno = ref('Matutino')
const formHoraIni = ref('07:30')
const formHoraFim = ref('08:20')
const formIsIntervalo = ref(false)
const isSaving = ref(false)

const turnos = ['Matutino', 'Vespertino', 'Noturno']

const fetchHorarios = async () => {
	isLoading.value = true
	try {
		const data = await $fetch('/api/calendario-salas/horarios-lista', {
			params: { id_entidade: props.idEntidade },
		})
		horarios.value = (data as any[]) || []
	} finally {
		isLoading.value = false
	}
}

const openNew = () => {
	editingHorario.value = null
	formIndice.value = horarios.value.length + 1
	formTurno.value = 'Matutino'
	formHoraIni.value = '07:30'
	formHoraFim.value = '08:20'
	formIsIntervalo.value = false
	showModal.value = true
}

const openEdit = (h: any) => {
	editingHorario.value = h
	formIndice.value = h.indice
	formTurno.value = h.nome_turno
	formHoraIni.value = h.hora_ini?.substring(0, 5) || '07:30'
	formHoraFim.value = h.hora_fim?.substring(0, 5) || '08:20'
	formIsIntervalo.value = h.is_intervalo || false
	showModal.value = true
}

const save = async () => {
	if (!formHoraIni.value || !formHoraFim.value) return
	isSaving.value = true
	try {
		await $fetch('/api/calendario-salas/horarios', {
			method: 'POST',
			body: {
				id: editingHorario.value?.id || null,
				id_entidade: props.idEntidade,
				indice: formIndice.value,
				nome_turno: formTurno.value,
				hora_ini: formHoraIni.value,
				hora_fim: formHoraFim.value,
				is_intervalo: formIsIntervalo.value,
			},
		})
		showModal.value = false
		await fetchHorarios()
		emit('refresh')
	} catch (e: any) {
		useToast().showToast('Erro ao salvar horário: ' + e.message, { type: 'error' })
	} finally {
		isSaving.value = false
	}
}

const confirmDelete = async (id: string) => {
	if (!confirm('Excluir este horário?')) return
	try {
		await $fetch('/api/calendario-salas/horarios', {
			method: 'DELETE',
			params: { id },
		})
		await fetchHorarios()
		emit('refresh')
	} catch (e: any) {
		useToast().showToast('Erro ao excluir horário: ' + e.message, { type: 'error' })
	}
}

onMounted(fetchHorarios)
</script>

<template>
	<div class="space-y-4">
		<div class="page-top-row">
			<p class="text-xs text-secondary/60">
				Horários globais valem para <strong>todas</strong> as salas.
			</p>
			<button
				@click="openNew"
				class="px-5 py-2.5 rounded-lg bg-primary/12 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
			>
				+ Novo Horário
			</button>
		</div>

		<div v-if="isLoading" class="flex justify-center py-10">
			<div class="w-8 h-8 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
		</div>

		<div v-else-if="horarios.length === 0" class="empty-state">
			<div class="empty-icon-wrap">
				<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<p class="text-sm text-secondary font-bold">Nenhum horário cadastrado</p>
			<p class="text-xs text-secondary/60 mt-1">Clique em "+ Novo Horário" para começar</p>
		</div>

		<div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div
				v-for="h in horarios"
				:key="h.id"
				class="person-card"
			>
				<div class="person-accent-bar" />
				<div class="person-card-inner">
					<div class="person-card-header">
						<div class="person-avatar">
							{{ h.indice }}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<h3 class="text-sm font-bold text-white">{{ h.nome_turno }}</h3>
								<span v-if="h.is_intervalo" class="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
									Intervalo
								</span>
								<span class="person-status" style="background: rgba(139,92,246,0.10); border-color: rgba(139,92,246,0.20); color: #a78bfa;">
									slot #{{ h.indice }}
								</span>
							</div>
							<p class="text-xs text-secondary/60 mt-0.5">
								{{ h.hora_ini?.substring(0, 5) }} — {{ h.hora_fim?.substring(0, 5) }}
							</p>
						</div>
						<div class="person-actions">
							<button @click.stop="openEdit(h)" class="act-btn act-btn--neutral" title="Editar">
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</button>
							<button @click.stop="confirmDelete(h.id)" class="act-btn act-btn--warn" title="Excluir">
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Modal -->
	<div
		v-if="showModal"
		class="fixed inset-0 z-50 bg-[rgba(0,0,0,0.85)] flex items-center justify-center p-4"
		@click.self="showModal = false"
	>
		<div class="modal-panel">
			<div class="modal-accent-bar" />
			<div class="modal-header">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h2 class="text-lg font-black text-white uppercase tracking-widest">
						{{ editingHorario ? 'Editar Horário' : 'Novo Horário' }}
					</h2>
				</div>
				<button @click="showModal = false" class="modal-close-btn">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="modal-body space-y-5">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Índice</label>
						<input v-model.number="formIndice" type="number" min="1"
							class="w-full rounded-xl px-4 py-3 text-sm bg-[var(--field-bg-select)] border border-[var(--field-border)] text-[var(--field-text)] focus:outline-none focus:border-[var(--field-border-focus)] focus:shadow-[var(--field-shadow-focus)] transition-all"
						/>
					</div>
					<div>
						<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Turno</label>
						<select v-model="formTurno"
							class="w-full rounded-xl px-4 py-3 text-sm bg-[var(--field-bg-select)] border border-[var(--field-border)] text-[var(--field-text)] focus:outline-none focus:border-[var(--field-border-focus)] focus:shadow-[var(--field-shadow-focus)] transition-all"
						>
							<option v-for="t in turnos" :key="t" :value="t">{{ t }}</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Hora Início</label>
						<input v-model="formHoraIni" type="time"
							class="w-full rounded-xl px-4 py-3 text-sm bg-[var(--field-bg-select)] border border-[var(--field-border)] text-[var(--field-text)] focus:outline-none focus:border-[var(--field-border-focus)] focus:shadow-[var(--field-shadow-focus)] transition-all"
						/>
					</div>
					<div>
						<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Hora Fim</label>
						<input v-model="formHoraFim" type="time"
							class="w-full rounded-xl px-4 py-3 text-sm bg-[var(--field-bg-select)] border border-[var(--field-border)] text-[var(--field-text)] focus:outline-none focus:border-[var(--field-border-focus)] focus:shadow-[var(--field-shadow-focus)] transition-all" />
					</div>
				</div>
				<label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
					:class="formIsIntervalo ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 hover:border-white/10'">
					<input type="checkbox" v-model="formIsIntervalo" class="accent-amber-500" />
					<div>
						<span class="text-sm font-bold" :class="formIsIntervalo ? 'text-amber-400' : 'text-white'">É intervalo</span>
						<p class="text-xs text-secondary/60">Almoço, jantar, pausa — não gera células clicáveis no grid</p>
					</div>
				</label>
			</div>
			<div class="modal-footer">
				<button @click="showModal = false" class="modal-btn-cancel">Cancelar</button>
				<button @click="save" :disabled="isSaving || !formHoraIni || !formHoraFim" class="modal-btn-confirm">
					{{ isSaving ? 'Salvando...' : 'Salvar' }}
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* ── Layout top row ── */
.page-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }

/* ── Cards ── */
.person-card {
	position: relative; background: rgba(255,255,255,0.025);
	border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
	overflow: hidden; cursor: default;
	transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.person-card:hover {
	border-color: rgba(139,92,246,0.28); transform: translateY(-1px);
	box-shadow: 0 6px 28px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.1);
}
.person-accent-bar {
	position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
	background: linear-gradient(180deg, #7c3aed, #a78bfa);
	opacity: 0; transition: opacity 0.2s ease;
}
.person-card:hover .person-accent-bar { opacity: 1; }
.person-card-inner { padding: 14px 14px 12px 18px; display: flex; flex-direction: column; gap: 8px; }
.person-card-header { display: flex; align-items: center; gap: 12px; }
.person-avatar {
	width: 40px; height: 40px; border-radius: 10px;
	background: rgba(139,92,246,0.10); border: 1px solid rgba(139,92,246,0.20);
	color: #a78bfa; font-size: 15px; font-weight: 900;
	display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
}
.person-actions { display: flex; gap: 5px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s ease; }
.person-card:hover .person-actions { opacity: 1; }
.act-btn { width: 28px; height: 28px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.act-btn--neutral { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.35); }
.act-btn--neutral:hover { background: rgba(139,92,246,0.16); color: #c4b5fd; }
.act-btn--warn { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25); }
.act-btn--warn:hover:not(:disabled) { background: rgba(239,68,68,0.14); color: #f87171; }

/* ── Status badge ── */
.person-status {
	display: inline-flex; align-items: center; gap: 5px;
	font-size: 8px; font-weight: 900; text-transform: uppercase;
	letter-spacing: 0.10em; padding: 3px 8px; border-radius: 20px; border: 1px solid transparent;
}

/* ── Empty state ── */
.empty-state { text-align: center; padding: 40px 0; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 14px; }
.empty-icon-wrap { display: inline-flex; margin-bottom: 12px; color: rgba(255,255,255,0.12); }

/* ── Modal ── */
.modal-panel {
	position: relative; background: #13131a; border-radius: 16px; width: 100%; max-width: 440px; overflow: hidden;
	display: flex; flex-direction: column; border: 1px solid rgba(139,92,246,0.20);
	box-shadow: 0 24px 80px rgba(0,0,0,0.7);
	animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);
}
@keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
.modal-accent-bar { height: 3px; background: linear-gradient(90deg, #7c3aed, #a78bfa); flex-shrink: 0; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.modal-close-btn { color: rgba(255,255,255,0.25); padding: 4px; transition: color 0.15s; }
.modal-close-btn:hover { color: rgba(255,255,255,0.7); }
.modal-body { padding: 20px 24px; overflow-y: auto; }
.modal-footer {
	display: flex; align-items: center; justify-content: flex-end; gap: 10px;
	padding: 14px 24px; border-top: 1px solid rgba(255,255,255,0.06);
	background: rgba(0,0,0,0.15); flex-shrink: 0;
}
.modal-btn-cancel {
	padding: 9px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
	background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4);
	font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
	cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-confirm {
	padding: 9px 24px; border-radius: 8px; border: none;
	background: rgba(139,92,246,0.85); color: #fff;
	font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
	cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-confirm:hover { background: rgba(139,92,246,1); }
.modal-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
