<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useToast } from '../../../composables/useToast';
import { formatDate } from '../../utils/date';

const props = defineProps<{
    isOpen: boolean;
    anoSemestre: string;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'saved'): void;
}>();

const toast = useToast();
const nome = ref('');
const dataReuniao = ref('');
const idEdital = ref('');
const editais = ref<any[]>([]);
const isSaving = ref(false);
const isLoadingEditais = ref(false);
const isDropdownOpen = ref(false);

const selectedEditalData = computed(() => {
    return editais.value.find((e) => e.id === idEdital.value) || null;
});

const resetForm = () => {
    nome.value = '';
    dataReuniao.value = '';
    idEdital.value = '';
    isDropdownOpen.value = false;
};

const fetchEditais = async () => {
    if (!props.anoSemestre) return;
    isLoadingEditais.value = true;
    try {
        const data = await $fetch<any[]>('/api/bolsas/atribuicoes/editais', {
            params: { ano_semestre: props.anoSemestre },
        });
        editais.value = data || [];
    } catch (e: any) {
        console.error(e);
        toast.showToast('Erro ao carregar editais.', { type: 'error' });
        editais.value = [];
    } finally {
        isLoadingEditais.value = false;
    }
};

watch(() => props.isOpen, (open) => {
    if (open) {
        resetForm();
        fetchEditais();
    } else {
        isDropdownOpen.value = false;
    }
});

const handleSave = async () => {
    if (!nome.value.trim() || !dataReuniao.value || !idEdital.value) {
        toast.showToast('Informe nome, edital e data da reunião.', { type: 'error' });
        return;
    }

    isSaving.value = true;
    try {
        // Enviar data sem Z para que o banco interprete em America/Sao_Paulo
        const dateObj = new Date(dataReuniao.value);
        const dateString = dateObj.toISOString().slice(0, 19); // Remove Z e milisegundos
        
        await $fetch('/api/bolsas/reunioes', {
            method: 'POST',
            body: {
                nome: nome.value.trim(),
                data_reuniao: dateString,
                id_edital: idEdital.value,
            },
        });

        toast.showToast('Reunião criada com sucesso.', { type: 'success' });
        emit('saved');
        emit('close');
    } catch (e: any) {
        console.error(e);
        toast.showToast(e?.data?.statusMessage || 'Erro ao criar reunião.', { type: 'error' });
    } finally {
        isSaving.value = false;
    }
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" @click.self="emit('close')">
        <div class="w-full max-w-lg bg-[#16161E] border border-white/10 rounded-xl shadow-2xl">
            <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 class="text-white font-bold">Nova Reunião</h3>
                <button class="text-secondary hover:text-white" @click="emit('close')">✕</button>
            </div>

            <div class="p-5 space-y-4">
                <div>
                    <label class="block text-xs font-bold text-secondary uppercase mb-1">Nome</label>
                    <input v-model="nome" type="text" placeholder="Ex: Reunião de acompanhamento" class="w-full bg-[#1f2029] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-secondary uppercase mb-1">Edital</label>
                    <div class="relative">
                        <button
                            @click="isDropdownOpen = !isDropdownOpen"
                            :disabled="isLoadingEditais"
                            class="w-full px-3 py-2.5 bg-[#1f2029] border border-white/10 rounded-lg text-white text-sm text-left flex items-center justify-between hover:border-white/20 transition-colors disabled:opacity-50"
                        >
                            <span v-if="selectedEditalData" class="flex-1 truncate">{{ selectedEditalData.titulo }}</span>
                            <span v-else class="text-secondary">{{ isLoadingEditais ? 'Carregando editais...' : 'Selecione um edital...' }}</span>
                            <svg
                                :class="['w-4 h-4 text-secondary transition-transform', { 'rotate-180': isDropdownOpen }]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </button>

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
                                <div v-if="isLoadingEditais" class="p-4 flex justify-center">
                                    <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                                </div>

                                <div v-else-if="editais.length === 0" class="p-4 text-center text-secondary text-sm">
                                    Nenhum edital disponível
                                </div>

                                <div v-else class="max-h-64 overflow-y-auto">
                                    <button
                                        v-for="edital in editais"
                                        :key="edital.id"
                                        @click="idEdital = edital.id; isDropdownOpen = false"
                                        :class="[
                                            'w-full px-3 py-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors last:border-b-0',
                                            idEdital === edital.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                                        ]"
                                    >
                                        <div class="flex flex-col gap-1.5">
                                            <div class="font-bold text-white text-sm">
                                                {{ edital.titulo }}
                                            </div>

                                            <div class="flex gap-2 flex-wrap items-center">
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

                                                <span class="text-[10px] text-secondary/70">
                                                    {{ formatDate(edital.data_inicio) }}
                                                    <span v-if="edital.data_fim"> - {{ formatDate(edital.data_fim) }}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-secondary uppercase mb-1">Data e Hora</label>
                    <input v-model="dataReuniao" type="datetime-local" class="w-full bg-[#1f2029] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary" />
                </div>
            </div>

            <div class="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
                <button class="px-4 py-2 rounded-lg bg-white/5 text-secondary hover:bg-white/10 text-sm font-bold" @click="emit('close')">Cancelar</button>
                <button :disabled="isSaving" class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-bold" @click="handleSave">
                    {{ isSaving ? 'Salvando...' : 'Salvar Reunião' }}
                </button>
            </div>
        </div>
    </div>
</template>
