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
				class="ds-btn-primary"
			>
				<Icon name="ph:plus-bold" class="w-3.5 h-3.5" />
				<span>Novo Horário</span>
			</button>
		</div>

		<div v-if="isLoading" class="flex justify-center py-10">
			<div class="w-8 h-8 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
		</div>

		<div v-else-if="horarios.length === 0" class="empty-state">
			<div class="empty-icon-wrap">
				<Icon name="ph:clock-duotone" class="w-12 h-12 text-secondary/40" />
			</div>
			<p class="text-sm text-secondary/60 font-bold">Nenhum horário cadastrado</p>
			<p class="text-xs text-secondary/40 mt-1">Clique em "+ Novo Horário" para começar</p>
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
								<h3 class="text-sm font-bold text-text">{{ h.nome_turno }}</h3>
								<span v-if="h.is_intervalo" class="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
									Intervalo
								</span>
								<span class="person-status">
									slot #{{ h.indice }}
								</span>
							</div>
							<p class="text-xs text-secondary/60 mt-0.5">
								{{ h.hora_ini?.substring(0, 5) }} — {{ h.hora_fim?.substring(0, 5) }}
							</p>
						</div>
						<div class="person-actions">
							<button @click.stop="openEdit(h)" class="act-btn act-btn--neutral" title="Editar">
								<Icon name="ph:pencil-simple-bold" class="w-3.5 h-3.5" />
							</button>
							<button @click.stop="confirmDelete(h.id)" class="act-btn act-btn--warn" title="Excluir">
								<Icon name="ph:trash-bold" class="w-3.5 h-3.5" />
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
		class="ds-modal-overlay"
		@click.self="showModal = false"
	>
		<div class="ds-modal-panel max-w-md">
			<div class="ds-modal-accent-bar" />
			<div class="ds-modal-header">
				<div class="ds-modal-header-icon">
					<Icon name="ph:clock-bold" class="w-5 h-5 text-primary" />
				</div>
				<div class="flex flex-col gap-0.5 flex-1">
					<h3 class="ds-modal-title">
						{{ editingHorario ? 'Editar Horário' : 'Novo Horário' }}
					</h3>
					<p class="ds-modal-subtitle">Grade de Turnos e Horários</p>
				</div>
				<button @click="showModal = false" class="ds-modal-close-btn">
					&times;
				</button>
			</div>
			<div class="p-6 space-y-5">
				<div class="grid grid-cols-2 gap-4">
					<BaseField
						v-model="formIndice"
						label="Índice"
						type="number"
						required
						:min="1"
					/>
					<div class="flex flex-col gap-1">
						<label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Turno</label>
						<select v-model="formTurno"
							class="w-full rounded-lg px-4 py-3 text-sm font-bold bg-field-bg border border-field-border text-field-text focus:outline-none focus:border-primary/50 transition-all"
						>
							<option v-for="t in turnos" :key="t" :value="t">{{ t }}</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<BaseField
						v-model="formHoraIni"
						label="Hora Início"
						type="time"
						required
					/>
					<BaseField
						v-model="formHoraFim"
						label="Hora Fim"
						type="time"
						required
					/>
				</div>
				<label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
					:class="formIsIntervalo ? 'border-amber-500/30 bg-amber-500/5' : 'border-divider hover:bg-div-15'">
					<input type="checkbox" v-model="formIsIntervalo" class="accent-amber-500" />
					<div>
						<span class="text-sm font-bold" :class="formIsIntervalo ? 'text-amber-500' : 'text-text'">É intervalo</span>
						<p class="text-xs text-secondary/60">Almoço, jantar, pausa — não gera células clicáveis no grid</p>
					</div>
				</label>
			</div>
			<div class="ds-modal-footer">
				<button @click="showModal = false" class="ds-btn-cancel">Cancelar</button>
				<button @click="save" :disabled="isSaving || !formHoraIni || !formHoraFim" class="ds-btn-save">
					{{ isSaving ? 'Salvando...' : 'Salvar' }}
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.page-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }

.person-card {
	position: relative;
	background: var(--color-secondary-surface);
	border: 1px solid var(--color-divider);
	border-radius: 14px;
	overflow: hidden;
	cursor: default;
	transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.person-card:hover {
	background: var(--color-secondary-surface-hover);
	border-color: rgba(139,92,246,0.28);
	transform: translateY(-1px);
}
.person-accent-bar {
	position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
	background: var(--color-primary);
	opacity: 0; transition: opacity 0.2s ease;
}
.person-card:hover .person-accent-bar { opacity: 1; }
.person-card-inner { padding: 14px 14px 12px 18px; display: flex; flex-direction: column; gap: 8px; }
.person-card-header { display: flex; align-items: center; gap: 12px; }
.person-avatar {
	width: 40px; height: 40px; border-radius: 10px;
	background: rgba(139,92,246,0.10); border: 1px solid rgba(139,92,246,0.20);
	color: var(--color-primary); font-size: 15px; font-weight: 900;
	display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
}
.person-actions { display: flex; gap: 5px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s ease; }
.person-card:hover .person-actions { opacity: 1; }
.act-btn { width: 28px; height: 28px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.act-btn--neutral { background: var(--color-secondary-surface-hover); color: var(--color-secondary); }
.act-btn--neutral:hover { background: rgba(139,92,246,0.16); color: var(--color-primary); }
.act-btn--warn { background: var(--color-secondary-surface-hover); color: var(--color-secondary); }
.act-btn--warn:hover:not(:disabled) { background: rgba(239,68,68,0.14); color: #ef4444; }

.person-status {
	display: inline-flex; align-items: center; gap: 5px;
	font-size: 8px; font-weight: 900; text-transform: uppercase;
	letter-spacing: 0.10em; padding: 3px 8px; border-radius: 20px;
	background: rgba(139,92,246,0.10); border: 1px solid rgba(139,92,246,0.20); color: var(--color-primary);
}

.empty-state { text-align: center; padding: 40px 0; background: var(--color-secondary-surface); border: 1px dashed var(--color-divider); border-radius: 14px; }
.empty-icon-wrap { display: inline-flex; margin-bottom: 12px; }
</style>
