<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '../../../composables/useToast'
import { formatDate } from '../../utils/date'

const props = defineProps<{
    isOpen: boolean
    aluno: any
    mode?: 'atribuicao' | 'suplente'
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'success'): void
}>()

const { showToast } = useToast()

// State
const editais = ref<any[]>([])
const selectedEditai = ref<string | null>(null)
const isLoadingEditais = ref(false)
const isSubmitting = ref(false)
const isDropdownOpen = ref(false)
const vigenciaInicio = ref('')

// Computed
const modalMode = computed(() => props.mode || 'atribuicao')
const isModoSuplente = computed(() => modalMode.value === 'suplente')

const selectedEditaiData = computed(() => {
    return editais.value.find(e => e.id === selectedEditai.value)
})

const canSubmitAtribuicao = computed(() => {
    return !!selectedEditai.value && !!vigenciaInicio.value && !isSubmitting.value
})

const canSubmitSuplente = computed(() => {
    return !!selectedEditai.value && !isSubmitting.value
})

const canSubmit = computed(() => {
    return isModoSuplente.value ? canSubmitSuplente.value : canSubmitAtribuicao.value
})

// Methods
const fetchEditais = async () => {
    if (!props.aluno?.turmas?.ano_semestre && !props.aluno?.ano_semestre) {
        return
    }

    isLoadingEditais.value = true
    try {
        const anoSemestre = props.aluno.ano_semestre || props.aluno.turmas?.ano_semestre
        if (!anoSemestre) return

        const data = await $fetch<any>('/api/bolsas/atribuicoes/editais', {
            params: { ano_semestre: anoSemestre }
        })

        editais.value = data || []
    } catch (e: any) {
        console.error('Erro ao buscar editais:', e)
        showToast('Erro ao carregar editais', { type: 'error' })
    } finally {
        isLoadingEditais.value = false
    }
}

const handleSubmit = async (asSuplente = isModoSuplente.value) => {
    if (asSuplente) {
        if (!canSubmitSuplente.value) return
    } else {
        if (!canSubmitAtribuicao.value) return
        if (!vigenciaInicio.value) {
            showToast('Data de início da vigência é obrigatória', { type: 'error' })
            return
        }
    }

    isSubmitting.value = true
    try {
        // Enviar data sem Z para que o banco interprete em America/Sao_Paulo
        const dateString = asSuplente
            ? null
            : new Date(vigenciaInicio.value).toISOString().slice(0, 19)
        
        await $fetch('/api/bolsas/atribuicoes', {
            method: 'POST',
            body: {
                id_matricula: props.aluno.id_matricula,
                id_edital: selectedEditai.value,
                vigencia_inicio: dateString
            }
        })

        showToast(
            asSuplente
                ? `Suplente adicionado com sucesso para ${props.aluno.nome}!`
                : `Bolsa atribuída com sucesso para ${props.aluno.nome}!`,
            { type: 'success' }
        )
        emit('success')
        handleClose()
    } catch (e: any) {
        console.error('Erro ao atribuir bolsa:', e)
        const message = e.data?.message || e.message || 'Erro ao atribuir bolsa'
        showToast(message, { type: 'error' })
    } finally {
        isSubmitting.value = false
    }
}

const handleClose = () => {
    vigenciaInicio.value = ''
    selectedEditai.value = null
    isDropdownOpen.value = false
    emit('close')
}

// Watchers
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        fetchEditais()
        vigenciaInicio.value = ''
        selectedEditai.value = null
    } else {
        isDropdownOpen.value = false
    }
})

// Fechar dropdown ao clicar fora
watch(isDropdownOpen, () => {
    if (!isDropdownOpen.value) return
})
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
    >
        <div class="bg-[#16161E] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-bold text-white">{{ isModoSuplente ? 'Adicionar Suplente' : 'Atribuir Bolsa' }}</h3>
                    <p class="text-xs text-secondary mt-1">{{ aluno?.nome }} {{ aluno?.sobrenome }}</p>
                </div>
                <button
                    @click="handleClose"
                    class="text-secondary hover:text-white transition-colors"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 space-y-4">
                <!-- Edital Select (Custom Dropdown) -->
                <div>
                    <label class="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                        Edital
                    </label>

                    <div class="relative">
                        <button
                            @click="isDropdownOpen = !isDropdownOpen"
                            :disabled="isLoadingEditais"
                            class="w-full px-3 py-2.5 bg-[#1f2029] border border-white/10 rounded-lg text-white text-sm text-left flex items-center justify-between hover:border-white/20 transition-colors disabled:opacity-50"
                        >
                            <span v-if="selectedEditaiData" class="flex-1">{{ selectedEditaiData.titulo }}</span>
                            <span v-else class="text-secondary">Selecione um edital...</span>
                            <svg
                                :class="['w-4 h-4 text-secondary transition-transform', { 'rotate-180': isDropdownOpen }]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </button>

                        <!-- Dropdown Content -->
                        <transition
                            enter-active-class="transition duration-200"
                            enter-from-class="opacity-0 -translate-y-2"
                            enter-to-class="opacity-100 translate-y-0"
                            leave-active-class="transition duration-150"
                            leave-from-class="opacity-100 translate-y-0"
                            leave-to-class="opacity-0 -translate-y-2"
                        >
                            <div
                                v-if="isDropdownOpen"
                                class="absolute top-full mt-1 w-full bg-[#1f2029] border border-white/10 rounded-lg shadow-lg z-10 overflow-hidden"
                            >
                                <!-- Loading -->
                                <div v-if="isLoadingEditais" class="p-4 flex justify-center">
                                    <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                                </div>

                                <!-- Empty State -->
                                <div v-else-if="editais.length === 0" class="p-4 text-center text-secondary text-sm">
                                    Nenhum edital disponível
                                </div>

                                <!-- Options -->
                                <div v-else class="max-h-64 overflow-y-auto">
                                    <button
                                        v-for="edital in editais"
                                        :key="edital.id"
                                        @click="selectedEditai = edital.id; isDropdownOpen = false"
                                        :class="[
                                            'w-full px-3 py-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors last:border-b-0',
                                            selectedEditai === edital.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                                        ]"
                                    >
                                        <div class="flex flex-col gap-1.5">
                                            <!-- Título -->
                                            <div class="font-bold text-white text-sm">
                                                {{ edital.titulo }}
                                            </div>

                                            <!-- Badges -->
                                            <div class="flex gap-2 flex-wrap">
                                                <!-- Status -->
                                                <span
                                                    :class="[
                                                        'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                                                        edital.is_publicado
                                                            ? 'bg-green-400/10 text-green-400'
                                                            : 'bg-gray-500/20 text-gray-400'
                                                    ]"
                                                >
                                                    {{ edital.is_publicado ? 'Publicado' : 'Rascunho' }}
                                                </span>

                                                <!-- Datas -->
                                                <span class="text-[10px] text-secondary/70">
                                                    {{ formatDate(edital.data_inicio) }}
                                                    <span v-if="edital.data_fim">
                                                        - {{ formatDate(edital.data_fim) }}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>

                <!-- Data de Início da Vigência -->
                <div v-if="!isModoSuplente">
                    <label class="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                        Data de Início da Vigência
                    </label>
                    <input
                        v-model="vigenciaInicio"
                        type="date"
                        :disabled="!selectedEditai || isSubmitting"
                        class="w-full px-3 py-2.5 bg-[#1f2029] border border-white/10 text-white rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none disabled:opacity-50 transition-colors"
                    />
                    <p class="text-[11px] text-secondary/70 mt-2">
                        Informe a data para ativar a bolsa imediatamente.
                    </p>
                </div>

                <div v-else class="text-[12px] text-secondary/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    Será salvo como suplente (sem vigência de início).
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-white/5 flex gap-3">
                <button
                    @click="handleClose"
                    :disabled="isSubmitting"
                    class="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    @click="handleSubmit()"
                    :disabled="!canSubmit"
                    class="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {{ isSubmitting ? 'Salvando...' : (isModoSuplente ? 'Salvar como Suplente' : 'Atribuir') }}
                </button>
            </div>
        </div>
    </div>
</template>
