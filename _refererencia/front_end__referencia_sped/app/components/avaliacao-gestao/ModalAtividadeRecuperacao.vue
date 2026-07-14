<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useToast } from "../../../composables/useToast";
import { useAvaliacaoGestaoAtividadesTab } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoAtividadesTab";
import {
    generateUuidFileName,
    fileToBase64,
    validateFile,
} from "../../../utils/file";
import {
    getAnoSemestre,
    getAnoSemestreList,
} from "../../../utils/ano_semestre";

const props = defineProps<{
    isOpen: boolean;
    atividade?: any | null;
}>();

const emit = defineEmits<{
    close: [];
    saved: [];
}>();

const { showToast } = useToast();
const {
    fetchAtividades,
    refreshHashAtividades,
    fetchTurmasMatriculas,
    uploadArquivoAtividade,
    deleteArquivoAtividade,
    saveAtividade,
} = useAvaliacaoGestaoAtividadesTab();

const fileInput = ref<HTMLInputElement | null>(null);
const semestres = getAnoSemestreList(6);
const anoSemestreAtividade = ref(getAnoSemestre());
const turmas = ref<any[]>([]);
const loadingTurmas = ref(false);
const form = ref({
    id: "",
    titulo: "",
    enunciado: "",
    link_externo: "",
    id_turma: "",
    arquivo_apoio: "",
});
const arquivo = ref<File | null>(null);
const preview = ref<string | null>(null);
const saving = ref(false);
const uploading = ref(false);
const removingExistingFile = ref(false);
const errorMsg = ref("");

const temArquivo = computed(() => !!arquivo.value);
const isEditMode = computed(() => !!form.value.id);
const arquivoExistente = computed(() =>
    String(form.value.arquivo_apoio || "").trim(),
);

const resetForm = () => {
    form.value = {
        id: "",
        titulo: "",
        enunciado: "",
        link_externo: "",
        id_turma: "",
        arquivo_apoio: "",
    };
    arquivo.value = null;
    preview.value = null;
    errorMsg.value = "";
};

const hydrateFromProps = () => {
    const atividade = props.atividade || null;
    if (!atividade) {
        resetForm();
        return;
    }

    form.value = {
        id: String(atividade.id || "").trim(),
        titulo: String(atividade.titulo || "").trim(),
        enunciado: String(atividade.enunciado || "").trim(),
        link_externo: String(atividade.link_externo || "").trim(),
        id_turma: String(atividade.id_turma || "").trim(),
        arquivo_apoio: String(atividade.arquivo_apoio || "").trim(),
    };
    arquivo.value = null;
    preview.value = null;
    errorMsg.value = "";
};

const fetchTurmas = async () => {
    loadingTurmas.value = true;
    try {
        turmas.value = await fetchTurmasMatriculas(anoSemestreAtividade.value);
    } catch (error) {
        console.error(error);
        turmas.value = [];
        showToast("Não foi possível carregar as turmas.", { type: "error" });
    } finally {
        loadingTurmas.value = false;
    }
};

const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ];
    const { valid, error } = validateFile(file, allowedTypes);
    if (!valid) {
        errorMsg.value = error || "Arquivo inválido.";
        input.value = "";
        return;
    }

    arquivo.value = file;
    preview.value = file.name;
    errorMsg.value = "";
};

const removeFile = () => {
    arquivo.value = null;
    preview.value = null;
};

const removerArquivoExistente = async () => {
    const currentFile = String(form.value.arquivo_apoio || "").trim();
    if (!currentFile) return;

    if (!isEditMode.value) {
        form.value.arquivo_apoio = "";
        return;
    }

    removingExistingFile.value = true;
    try {
        await deleteArquivoAtividade(form.value.id, currentFile);

        form.value.arquivo_apoio = "";
        showToast("Arquivo removido do Bunny com sucesso.", {
            type: "success",
        });
    } catch (error: any) {
        console.error(error);
        showToast(
            error?.data?.statusMessage ||
                error?.message ||
                "Não foi possível remover o arquivo.",
            { type: "error" },
        );
    } finally {
        removingExistingFile.value = false;
    }
};

const salvar = async () => {
    if (!form.value.titulo.trim() || !form.value.enunciado.trim()) {
        showToast("Preencha título e enunciado.", { type: "error" });
        return;
    }

    saving.value = true;
    errorMsg.value = "";

    try {
        let arquivoApoio: string | null = form.value.arquivo_apoio || null;

        if (arquivo.value) {
            uploading.value = true;
            const base64 = await fileToBase64(arquivo.value);
            const uuidName = generateUuidFileName(arquivo.value.name);

            const uploadRes: any = await uploadArquivoAtividade(
                base64,
                uuidName,
                arquivo.value.name,
            );

            arquivoApoio = uploadRes?.path || null;
        }

        const atividadeBody: any = {
            titulo: form.value.titulo,
            enunciado: form.value.enunciado,
            link_externo: form.value.link_externo || null,
            id_turma: form.value.id_turma || null,
            arquivo_apoio: arquivoApoio,
        };

        await saveAtividade(
            isEditMode.value
                ? { id: form.value.id, ...atividadeBody }
                : atividadeBody,
            isEditMode.value,
        );

        showToast(
            isEditMode.value
                ? "Atividade atualizada com sucesso!"
                : "Atividade criada com sucesso!",
            { type: "success" },
        );
        emit("saved");
        emit("close");
        resetForm();
    } catch (error: any) {
        console.error(error);
        showToast(
            error?.data?.statusMessage ||
                error?.message ||
                "Não foi possível salvar a atividade.",
            { type: "error" },
        );
    } finally {
        saving.value = false;
        uploading.value = false;
    }
};

watch(
    () => props.isOpen,
    (open) => {
        if (!open) return;
        hydrateFromProps();
        anoSemestreAtividade.value = getAnoSemestre();
        fetchTurmas();
    },
);

watch(
    () => props.atividade,
    () => {
        if (!props.isOpen) return;
        hydrateFromProps();
    },
);

watch(anoSemestreAtividade, () => {
    if (!props.isOpen) return;
    fetchTurmas();
});
</script>

<template>
    <Transition name="modal-fade">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            @click.self="emit('close')"
        >
            <div
                class="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#16161E] shadow-2xl overflow-hidden"
            >
                <div
                    class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5"
                >
                    <div>
                        <p
                            class="text-[10px] font-black uppercase tracking-[0.18em] text-primary"
                        >
                            Banco de Atividades
                        </p>
                        <h3 class="mt-1 text-lg font-black text-white">
                            {{
                                isEditMode
                                    ? "Editar Atividade de Recuperação"
                                    : "Nova Atividade de Recuperação"
                            }}
                        </h3>
                        <p class="mt-1 text-xs text-secondary">
                            {{
                                isEditMode
                                    ? "Atualize conteúdo, turma e anexo da atividade."
                                    : "Crie uma atividade compartilhável com envio real do arquivo para Bunny."
                            }}
                        </p>
                    </div>
                    <button
                        @click="emit('close')"
                        class="text-secondary hover:text-white transition-colors"
                    >
                        <svg
                            class="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div class="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                    <div class="space-y-4 p-6">
                        <div>
                            <label
                                class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-secondary"
                                >Título</label
                            >
                            <input
                                v-model="form.titulo"
                                type="text"
                                placeholder="Ex.: Revisão de frações"
                                class="w-full rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-2 text-sm text-white outline-none placeholder:text-secondary/40 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label
                                class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-secondary"
                                >Enunciado</label
                            >
                            <textarea
                                v-model="form.enunciado"
                                rows="8"
                                placeholder="Descreva a atividade, critérios e orientações para o aluno..."
                                class="w-full rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-2 text-sm text-white outline-none placeholder:text-secondary/40 focus:border-primary"
                            ></textarea>
                        </div>

                        <div>
                            <label
                                class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-secondary"
                                >Link externo opcional</label
                            >
                            <input
                                v-model="form.link_externo"
                                type="url"
                                placeholder="https://..."
                                class="w-full rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-2 text-sm text-white outline-none placeholder:text-secondary/40 focus:border-primary"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label
                                    class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-secondary"
                                    >Ano/Semestre</label
                                >
                                <select
                                    v-model="anoSemestreAtividade"
                                    class="w-full rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-2 text-sm text-white outline-none focus:border-primary"
                                >
                                    <option
                                        v-for="s in semestres"
                                        :key="s.id"
                                        :value="s.id"
                                    >
                                        {{ s.nome }}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label
                                    class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-secondary"
                                    >Turma (filtro futuro)</label
                                >
                                <select
                                    v-model="form.id_turma"
                                    :disabled="loadingTurmas"
                                    class="w-full rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-2 text-sm text-white outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        Sem turma específica
                                    </option>
                                    <option
                                        v-for="turma in turmas"
                                        :key="turma.id"
                                        :value="turma.id"
                                    >
                                        {{
                                            turma.nome_curso_turno ||
                                            turma.nome_curso ||
                                            turma.nome_turma ||
                                            turma.id
                                        }}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div
                            v-if="errorMsg"
                            class="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                        >
                            {{ errorMsg }}
                        </div>
                    </div>

                    <div
                        class="border-t border-white/10 bg-[#0f0f15] lg:border-l lg:border-t-0"
                    >
                        <div class="p-6">
                            <div
                                class="mb-3 flex items-center justify-between gap-2"
                            >
                                <p
                                    class="text-[11px] font-black uppercase tracking-wider text-secondary"
                                >
                                    Arquivo de apoio
                                </p>
                                <span class="text-[10px] text-secondary/70"
                                    >PDF, JPG, PNG</span
                                >
                            </div>

                            <div
                                v-if="arquivoExistente"
                                class="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2"
                            >
                                <p
                                    class="truncate text-[11px] font-medium text-emerald-300"
                                >
                                    Atual:
                                    {{
                                        String(arquivoExistente)
                                            .split("/")
                                            .pop()
                                    }}
                                </p>
                                <button
                                    type="button"
                                    :disabled="removingExistingFile"
                                    class="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-200 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                                    @click.stop="removerArquivoExistente"
                                >
                                    {{
                                        removingExistingFile
                                            ? "Removendo..."
                                            : "Remover arquivo atual"
                                    }}
                                </button>
                            </div>

                            <div
                                class="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 px-4 py-6 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
                                @click="fileInput?.click()"
                            >
                                <input
                                    ref="fileInput"
                                    type="file"
                                    class="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    @change="handleFileChange"
                                />

                                <div v-if="!temArquivo" class="space-y-3">
                                    <div
                                        class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
                                    >
                                        <svg
                                            class="h-6 w-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M7 16V8a4 4 0 018 0v8m-4-4v8m-7 0h14"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-white">
                                            {{
                                                isEditMode
                                                    ? "Clique para adicionar/substituir arquivo"
                                                    : "Clique para enviar o arquivo"
                                            }}
                                        </p>
                                        <p class="mt-1 text-xs text-secondary">
                                            O arquivo será enviado ao Bunny e
                                            salvo no banco como apoio da
                                            atividade.
                                        </p>
                                    </div>
                                </div>

                                <div v-else class="space-y-4">
                                    <div
                                        class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
                                    >
                                        <svg
                                            class="h-6 w-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2.5"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-white">
                                            {{ preview }}
                                        </p>
                                        <p class="mt-1 text-xs text-secondary">
                                            Arquivo pronto para envio.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                        @click.stop="removeFile"
                                    >
                                        Remover arquivo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="flex items-center justify-end gap-3 border-t border-white/10 bg-[#12121a] px-6 py-4"
                >
                    <button
                        @click="emit('close')"
                        class="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-secondary transition-colors hover:text-white hover:border-white/20"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="salvar"
                        :disabled="saving"
                        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span
                            v-if="saving"
                            class="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white"
                        ></span>
                        <span>{{
                            saving
                                ? uploading
                                    ? "Enviando arquivo..."
                                    : "Salvando..."
                                : isEditMode
                                  ? "Atualizar Atividade"
                                  : "Salvar Atividade"
                        }}</span>
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
