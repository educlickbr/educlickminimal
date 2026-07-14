<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '../../../composables/useToast'
import { formatDate } from '~/utils/date'

const props = defineProps<{
    isOpen: boolean
    aluno: any
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved'): void
}>()

const toast = useToast()
const isSaving = ref(false)
const vigenciaFim = ref('')
const motivoInativacao = ref('')

const resetForm = () => {
    const today = new Date().toISOString().slice(0, 10)
    vigenciaFim.value = today
    motivoInativacao.value = ''
}

watch(() => props.isOpen, (open) => {
    if (open) resetForm()
})

const handleSave = async () => {
    if (!props.aluno?.id_atribuicao) {
        toast.showToast('Atribuição não encontrada para este aluno.', { type: 'error' })
        return
    }

    if (!vigenciaFim.value || !motivoInativacao.value.trim()) {
        toast.showToast('Informe data de encerramento e motivo.', { type: 'error' })
        return
    }

    isSaving.value = true
    try {
        // Enviar data sem Z para que o banco interprete em America/Sao_Paulo
        const dateObj = new Date(vigenciaFim.value);
        const dateString = dateObj.toISOString().slice(0, 19); // Remove Z e milisegundos
        
        await $fetch('/api/bolsas/atribuicoes/encerrar', {
            method: 'POST',
            body: {
                id_atribuicao: props.aluno.id_atribuicao,
                vigencia_fim: dateString,
                motivo_inativacao: motivoInativacao.value.trim()
            }
        })

        toast.showToast('Bolsa encerrada com sucesso.', { type: 'success' })
        emit('saved')
        emit('close')
    } catch (e: any) {
        console.error(e)
        toast.showToast(e?.data?.statusMessage || 'Erro ao encerrar bolsa.', { type: 'error' })
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="emit('close')"
    >
        <div class="w-full max-w-lg bg-[#16161E] border border-white/10 rounded-xl shadow-2xl">
            <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h3 class="text-white font-bold">Encerrar Bolsa</h3>
                    <p class="text-xs text-secondary mt-1">
                        {{ aluno?.nome }} {{ aluno?.sobrenome }}
                    </p>
                </div>
                <button class="text-secondary hover:text-white" @click="emit('close')">✕</button>
            </div>

            <div class="p-5 space-y-4">
                <div class="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-secondary">
                    <span class="text-secondary">Vigência atual:</span>
                    <span class="text-white"> {{ formatDate(aluno?.vigencia_inicio) }}</span>
                    <span class="text-secondary" v-if="aluno?.vigencia_fim"> até </span>
                    <span class="text-white" v-if="aluno?.vigencia_fim">{{ formatDate(aluno?.vigencia_fim) }}</span>
                </div>

                <div>
                    <label class="block text-xs font-bold text-secondary uppercase mb-1">Data de Encerramento</label>
                    <input
                        v-model="vigenciaFim"
                        type="date"
                        class="w-full bg-[#1f2029] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                    />
                </div>

                <div>
                    <label class="block text-xs font-bold text-secondary uppercase mb-1">Motivo da Inativação</label>
                    <textarea
                        v-model="motivoInativacao"
                        rows="4"
                        placeholder="Descreva o motivo do encerramento da bolsa..."
                        class="w-full bg-[#1f2029] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary resize-none"
                    />
                </div>
            </div>

            <div class="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
                <button
                    class="px-4 py-2 rounded-lg bg-white/5 text-secondary hover:bg-white/10 text-sm font-bold"
                    @click="emit('close')"
                    :disabled="isSaving"
                >
                    Cancelar
                </button>
                <button
                    :disabled="isSaving"
                    class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold"
                    @click="handleSave"
                >
                    {{ isSaving ? 'Salvando...' : 'Encerrar Bolsa' }}
                </button>
            </div>
        </div>
    </div>
</template>
