<script setup lang="ts">
import { ref, computed } from 'vue';
import { buildProtectedFileUrl } from '~/utils/protected-file-url';
import { useToast } from '../../../composables/useToast';

const props = defineProps<{
    isOpen: boolean;
    atividade: {
        id_entrega: string;
        id_atividade: string;
        titulo: string;
        enunciado: string | null;
        link_externo: string | null;
        arquivo_apoio: string | null;
        status_avaliacao: string;
        resposta_aluno: string | null;
        arquivo_entrega: string | null;
        feedback_professor: string | null;
    } | null;
}>();

const emit = defineEmits<{
    close: [];
    submitted: [status: string];
}>();

const { showToast } = useToast();

const resposta = ref('');
const arquivoSelecionado = ref<File | null>(null);
const arquivoNome = ref('');
const uploading = ref(false);
const submitting = ref(false);

const podeEnviar = computed(() => {
    const status = props.atividade?.status_avaliacao;
    return status === 'Pendente' || status === 'Reprovado';
});

const statusClass = computed(() => {
    const status = props.atividade?.status_avaliacao || '';
    const map: Record<string, string> = {
        'Pendente':  'text-yellow-400  border-yellow-400/25  bg-yellow-400/10',
        'Entregue':  'text-blue-400    border-blue-400/25    bg-blue-400/10',
        'Aprovado':  'text-emerald-400 border-emerald-400/25 bg-emerald-400/10',
        'Reprovado': 'text-red-400     border-red-400/25     bg-red-400/10',
    };
    return map[status] || 'text-secondary border-white/10 bg-white/5';
});

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== 'string') { reject(new Error('Falha ao ler o arquivo.')); return; }
            const base64 = result.split(',')[1];
            if (!base64) { reject(new Error('Formato de arquivo inválido.')); return; }
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Erro ao processar o arquivo.'));
        reader.readAsDataURL(file);
    });

const onFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    arquivoSelecionado.value = file;
    arquivoNome.value = file?.name ?? '';
};

const openArquivoApoio = async () => {
    const filePath = String(props.atividade?.arquivo_apoio || '').trim();
    if (!filePath) return;

    try {
        const { hash_base, error } = await ($fetch as any)('/api/refresh-hash-atividades');
        if (error || !hash_base) throw new Error(error || 'Falha ao gerar token.');
        const url = buildProtectedFileUrl(hash_base, filePath, 'avaliacao');
        if (!url) throw new Error('URL inválida.');
        window.open(url, '_blank');
    } catch {
        showToast('Erro ao abrir arquivo de apoio.', { type: 'error' });
    }
};

const openArquivoEntrega = async () => {
    const filePath = String(props.atividade?.arquivo_entrega || '').trim();
    if (!filePath) return;

    try {
        const { hash_base, error } = await ($fetch as any)('/api/refresh-hash-atividades');
        if (error || !hash_base) throw new Error(error || 'Falha ao gerar token.');
        const url = buildProtectedFileUrl(hash_base, filePath, 'avaliacao');
        if (!url) throw new Error('URL inválida.');
        window.open(url, '_blank');
    } catch {
        showToast('Erro ao abrir arquivo enviado.', { type: 'error' });
    }
};

const handleSubmit = async () => {
    if (!props.atividade?.id_entrega) return;
    if (!arquivoSelecionado.value) {
        showToast('Anexar um arquivo é obrigatório para enviar a resposta.', { type: 'info' });
        return;
    }

    submitting.value = true;
    let arquivoPath: string | null = null;

    try {
        // Upload file if selected
        if (arquivoSelecionado.value) {
            uploading.value = true;
            const ext = arquivoSelecionado.value.name.split('.').pop();
            const uuid = `${props.atividade.id_entrega}_${Date.now()}.${ext}`;
            const base64 = await fileToBase64(arquivoSelecionado.value);

            const uploadResult: any = await ($fetch as any)('/api/avaliacao-gestao/upload-entrega', {
                method: 'POST',
                body: { fileBase64: base64, fileName: uuid },
            });

            if (!uploadResult?.success) throw new Error('Falha no upload do arquivo.');
            arquivoPath = uploadResult.path;
            uploading.value = false;
        }

        // Submit entrega
        await ($fetch as any)('/api/avaliacao-alunos/minha-entrega-atividade', {
            method: 'POST',
            body: {
                id_entrega: props.atividade.id_entrega,
                resposta_aluno: resposta.value.trim() || null,
                arquivo_entrega: arquivoPath || null,
            },
        });

        showToast('Resposta enviada com sucesso!', { type: 'success' });
        emit('submitted', 'Entregue');
    } catch (err: any) {
        showToast(err?.data?.statusMessage || err?.message || 'Erro ao enviar resposta.', { type: 'error' });
    } finally {
        submitting.value = false;
        uploading.value = false;
    }
};

const handleClose = () => {
    resposta.value = '';
    arquivoSelecionado.value = null;
    arquivoNome.value = '';
    emit('close');
};
</script>

<template>
    <Transition name="modal-fade">
        <div
            v-if="isOpen && atividade"
            class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            @click.self="handleClose"
        >
            <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#16161E] shadow-2xl">

                <!-- Header -->
                <div class="border-b border-white/10 px-6 py-5 flex items-start justify-between gap-4">
                    <div class="min-w-0">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Atividade de Recuperação</p>
                        <h3 class="mt-1 text-xl font-black text-white leading-tight">{{ atividade.titulo }}</h3>
                    </div>
                    <div class="flex items-center gap-3 shrink-0 pt-1">
                        <span class="px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider" :class="statusClass">
                            {{ atividade.status_avaliacao }}
                        </span>
                        <button @click="handleClose" class="text-secondary hover:text-white transition-colors">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Conteúdo -->
                <div class="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5">

                    <!-- Enunciado -->
                    <div v-if="atividade.enunciado" class="bg-[#0f0f15] border border-white/8 rounded-xl p-4">
                        <p class="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Enunciado</p>
                        <p class="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{{ atividade.enunciado }}</p>
                    </div>

                    <!-- Links e arquivos de apoio -->
                    <div v-if="atividade.link_externo || atividade.arquivo_apoio" class="flex flex-wrap gap-2">
                        <a
                            v-if="atividade.link_externo"
                            :href="atividade.link_externo"
                            target="_blank"
                            rel="noreferrer"
                            class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Link externo
                        </a>
                        <button
                            v-if="atividade.arquivo_apoio"
                            type="button"
                            @click="openArquivoApoio"
                            class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Arquivo de apoio
                        </button>
                    </div>

                    <!-- Feedback do professor (quando Aprovado ou Reprovado) -->
                    <div v-if="atividade.feedback_professor && (atividade.status_avaliacao === 'Aprovado' || atividade.status_avaliacao === 'Reprovado')"
                         class="rounded-xl border p-4"
                         :class="atividade.status_avaliacao === 'Aprovado' ? 'border-emerald-500/20 bg-emerald-500/8' : 'border-red-500/20 bg-red-500/8'">
                        <p class="text-[10px] font-black uppercase tracking-widest mb-2"
                           :class="atividade.status_avaliacao === 'Aprovado' ? 'text-emerald-400' : 'text-red-400'">
                            Feedback do professor
                        </p>
                        <p class="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">{{ atividade.feedback_professor }}</p>
                    </div>

                    <!-- Resposta já enviada (Entregue) -->
                    <div v-if="atividade.status_avaliacao === 'Entregue'" class="bg-[#0f0f15] border border-blue-500/15 rounded-xl p-4">
                        <p class="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Sua resposta enviada</p>
                        <p v-if="atividade.resposta_aluno" class="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{{ atividade.resposta_aluno }}</p>
                        <button
                            v-if="atividade.arquivo_entrega"
                            type="button"
                            @click="openArquivoEntrega"
                            class="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-blue-300 transition-colors hover:bg-blue-500/15"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Ver arquivo enviado
                        </button>
                        <p v-if="!atividade.resposta_aluno && !atividade.arquivo_entrega" class="text-sm text-secondary/50 italic">Nenhum conteúdo registrado.</p>
                    </div>

                    <!-- Formulário de envio (Pendente ou Reprovado) -->
                    <div v-if="podeEnviar" class="space-y-4 border-t border-white/8 pt-5">
                        <p class="text-[10px] font-black uppercase tracking-widest text-secondary">
                            {{ atividade.status_avaliacao === 'Reprovado' ? 'Reenviar resposta' : 'Enviar resposta' }}
                        </p>

                        <textarea
                            v-model="resposta"
                            rows="5"
                            placeholder="Escreva sua resposta aqui..."
                            class="w-full rounded-xl border border-white/10 bg-[#0f0f15] px-4 py-3 text-sm text-white outline-none placeholder:text-secondary/35 focus:border-primary resize-none"
                        />

                        <!-- Upload de arquivo -->
                        <div>
                            <label class="cursor-pointer">
                                <div class="flex items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-3 text-sm text-secondary hover:border-white/25 hover:text-white transition-colors">
                                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span v-if="arquivoNome" class="truncate text-white/80">{{ arquivoNome }}</span>
                                    <span v-else>Anexar arquivo <span class="text-red-400">*</span></span>
                                </div>
                                <input type="file" class="hidden" @change="onFileChange" />
                            </label>
                        </div>

                        <div class="flex justify-end pt-1">
                            <button
                                type="button"
                                :disabled="submitting || !arquivoSelecionado"
                                @click="handleSubmit"
                                class="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-black uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <span v-if="uploading">Enviando arquivo…</span>
                                <span v-else-if="submitting">Salvando…</span>
                                <span v-else>Enviar resposta</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
