<script setup lang="ts">
import { useAppStore } from '~~/stores/app'

const props = defineProps<{
	idEntidade: string
}>()

const emit = defineEmits<{
	(e: 'refresh'): void
}>()

const appStore = useAppStore()

const salas = ref<any[]>([])
const isLoading = ref(false)
const showModal = ref(false)
const editingSala = ref<any>(null)
const formNome = ref('')
const formCor = ref('#8b5cf6')
const isSaving = ref(false)

const fetchSalas = async () => {
	isLoading.value = true
	try {
		const data = await $fetch('/api/calendario-salas/salas', {
			params: { id_entidade: props.idEntidade },
		})
		salas.value = (data as any[]) || []
	} finally {
		isLoading.value = false
	}
}

const openNew = () => {
	editingSala.value = null
	formNome.value = ''
	formCor.value = '#8b5cf6'
	showModal.value = true
}

const openEdit = (sala: any) => {
	editingSala.value = sala
	formNome.value = sala.nome
	formCor.value = sala.cor || '#8b5cf6'
	showModal.value = true
}

const save = async () => {
	if (!formNome.value.trim()) return
	isSaving.value = true
	try {
		await $fetch('/api/calendario-salas/salas', {
			method: 'POST',
			body: {
				id: editingSala.value?.id || null,
				id_entidade: props.idEntidade,
				nome: formNome.value.trim(),
				cor: formCor.value,
				user_id: appStore.user_expandido_id,
			},
		})
		showModal.value = false
		await fetchSalas()
		emit('refresh')
	} catch (e: any) {
		useToast().showToast('Erro ao salvar sala: ' + e.message, { type: 'error' })
	} finally {
		isSaving.value = false
	}
}

const confirmDelete = async (id: string) => {
	if (!confirm('Excluir esta sala?')) return
	try {
		await $fetch('/api/calendario-salas/salas', {
			method: 'DELETE',
			params: { id },
		})
		await fetchSalas()
		emit('refresh')
	} catch (e: any) {
		useToast().showToast('Erro ao excluir sala: ' + e.message, { type: 'error' })
	}
}

const availableColors = [
	'#8b5cf6', '#ef4444', '#f59e0b', '#10b981',
	'#3b82f6', '#ec4899', '#14b8a6', '#f97316',
]

onMounted(fetchSalas)
</script>

<template>
	<div class="space-y-4">
		<div class="page-top-row">
			<div />
			<button
				@click="openNew"
				class="ds-btn-primary"
			>
				<Icon name="ph:plus-bold" class="w-3.5 h-3.5" />
				<span>Nova Sala</span>
			</button>
		</div>

		<div v-if="isLoading" class="flex justify-center py-10">
			<div class="w-8 h-8 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
		</div>

		<div v-else-if="salas.length === 0" class="empty-state">
			<div class="empty-icon-wrap">
				<Icon name="ph:door-duotone" class="w-12 h-12 text-secondary/40" />
			</div>
			<p class="text-sm text-secondary/60 font-bold">Nenhuma sala cadastrada</p>
			<p class="text-xs text-secondary/40 mt-1">Clique em "+ Nova Sala" para começar</p>
		</div>

		<div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div
				v-for="sala in salas"
				:key="sala.id"
				class="person-card"
			>
				<div class="person-accent-bar" :style="{ background: `linear-gradient(180deg, ${sala.cor || '#8b5cf6'}, ${sala.cor || '#8b5cf6'}88)` }" />
				<div class="person-card-inner">
					<div class="person-card-header">
						<div
							class="person-avatar"
							:style="{ backgroundColor: `${sala.cor || '#8b5cf6'}20`, borderColor: `${sala.cor || '#8b5cf6'}33`, color: sala.cor || '#8b5cf6' }"
						>
							{{ sala.nome.charAt(0).toUpperCase() }}
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="text-sm font-bold text-text truncate">{{ sala.nome }}</h3>
						</div>
						<div class="person-actions">
							<button @click.stop="openEdit(sala)" class="act-btn act-btn--neutral" title="Editar">
								<Icon name="ph:pencil-simple-bold" class="w-3.5 h-3.5" />
							</button>
							<button @click.stop="confirmDelete(sala.id)" class="act-btn act-btn--warn" title="Excluir">
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
					<Icon name="ph:door-bold" class="w-5 h-5 text-primary" />
				</div>
				<div class="flex flex-col gap-0.5 flex-1">
					<h3 class="ds-modal-title">
						{{ editingSala ? 'Editar Sala' : 'Nova Sala' }}
					</h3>
					<p class="ds-modal-subtitle">Cadastro de Espaço Físico</p>
				</div>
				<button @click="showModal = false" class="ds-modal-close-btn">
					&times;
				</button>
			</div>
			<div class="p-6 space-y-5">
				<BaseField
					v-model="formNome"
					label="Nome da Sala"
					required
					placeholder="Ex: Sala 101, Laboratório 2..."
				/>
				<div>
					<label class="block text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Cor de Identificação</label>
					<div class="flex flex-wrap gap-2">
						<button
							v-for="color in availableColors"
							:key="color"
							@click="formCor = color"
							class="w-8 h-8 rounded-lg border-2 transition-all"
							:class="formCor === color ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'"
							:style="{ backgroundColor: color }"
						/>
					</div>
				</div>
			</div>
			<div class="ds-modal-footer">
				<button @click="showModal = false" class="ds-btn-cancel">Cancelar</button>
				<button @click="save" :disabled="isSaving || !formNome.trim()" class="ds-btn-save">
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
	opacity: 0; transition: opacity 0.2s ease;
}
.person-card:hover .person-accent-bar { opacity: 1; }
.person-card-inner { padding: 14px 14px 12px 18px; display: flex; flex-direction: column; gap: 8px; }
.person-card-header { display: flex; align-items: center; gap: 12px; }
.person-avatar {
	width: 40px; height: 40px; border-radius: 10px; border: 1px solid;
	font-size: 15px; font-weight: 900; display: flex; align-items: center; justify-content: center;
	overflow: hidden; flex-shrink: 0;
}
.person-actions { display: flex; gap: 5px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s ease; }
.person-card:hover .person-actions { opacity: 1; }
.act-btn { width: 28px; height: 28px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.act-btn--neutral { background: var(--color-secondary-surface-hover); color: var(--color-secondary); }
.act-btn--neutral:hover { background: rgba(139,92,246,0.16); color: var(--color-primary); }
.act-btn--warn { background: var(--color-secondary-surface-hover); color: var(--color-secondary); }
.act-btn--warn:hover:not(:disabled) { background: rgba(239,68,68,0.14); color: #ef4444; }

.empty-state { text-align: center; padding: 40px 0; background: var(--color-secondary-surface); border: 1px dashed var(--color-divider); border-radius: 14px; }
.empty-icon-wrap { display: inline-flex; margin-bottom: 12px; }
</style>
