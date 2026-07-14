<script setup lang="ts">
import { ref, watch } from "vue";
import { useToast } from "../../../composables/useToast";
import {
    generateUuidFileName,
    fileToBase64,
    validateFile,
} from "../../../utils/file";
import { fromZonedTime } from "date-fns-tz";
import { toInputDateTimeLocal } from "../../utils/date";

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false,
    },
    etapa: {
        type: Object as any,
        default: null,
    },
    editalId: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(["close", "saved"]);
const toast = useToast();

const form = ref({
    id: "",
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    ordem: 1,
    arquivo_url: "",
    // New Visibility Fields
    exibir_periodo: true,
    is_publicado: false,
    publicado_em: "",
    desativado_em: "",
});

const isSubmitting = ref(false);
const file = ref<File | null>(null);
const dragging = ref(false);
const uploading = ref(false);
const errorMsg = ref<string | null>(null);

const formatToInputDate = (isoString?: string) => {
    return toInputDateTimeLocal(isoString);
};

watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            if (props.etapa) {
                form.value = {
                    id: props.etapa.id,
                    titulo: props.etapa.titulo,
                    descricao: props.etapa.descricao,
                    data_inicio: formatToInputDate(props.etapa.data_inicio),
                    data_fim: formatToInputDate(props.etapa.data_fim),
                    ordem: props.etapa.ordem || 1,
                    arquivo_url: props.etapa.arquivo_url || "",
                    // New Fields
                    exibir_periodo: props.etapa.exibir_periodo ?? true,
                    is_publicado: props.etapa.is_publicado ?? false,
                    publicado_em: formatToInputDate(props.etapa.publicado_em),
                    desativado_em: formatToInputDate(props.etapa.desativado_em),
                };
            } else {
                form.value = {
                    id: "",
                    titulo: "",
                    descricao: "",
                    data_inicio: "",
                    data_fim: "",
                    ordem: 1,
                    arquivo_url: "",
                    exibir_periodo: true,
                    is_publicado: false,
                    publicado_em: "",
                    desativado_em: "",
                };
            }
            file.value = null;
            errorMsg.value = null;
            uploading.value = false;
            dragging.value = false;
        }
    },
);

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const f = target.files[0];
        if (f) processFile(f);
    }
};

const handleDrop = (event: DragEvent) => {
    dragging.value = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        const f = event.dataTransfer.files[0];
        if (f) processFile(f);
    }
};

const processFile = (selectedFile: File) => {
    errorMsg.value = null;

    // Validate
    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ];
    const { valid, error } = validateFile(selectedFile, allowedTypes);

    if (!valid) {
        errorMsg.value = error || "Arquivo inválido.";
        return;
    }

    file.value = selectedFile;
};

const removeFile = () => {
    file.value = null;
};

const save = async () => {
    if (!form.value.titulo || !form.value.data_inicio || !form.value.data_fim) {
        toast.showToast("Preencha os campos obrigatórios.", { type: "error" });
        return;
    }

    isSubmitting.value = true;
    errorMsg.value = null;

    const _fetch = $fetch as any;

    try {
        let uploadedUrl = form.value.arquivo_url;

        // Upload file via API if selected
        if (file.value) {
            uploading.value = true;
            const f = file.value as File;
            const base64 = await fileToBase64(f);
            const uuidName = generateUuidFileName(f.name);

            // Reusing the same endpoint as Editais since it goes to /editais folder which is fine
            const uploadRes = await _fetch("/api/bolsas/editais/upload", {
                method: "POST",
                body: {
                    fileBase64: base64,
                    fileName: uuidName,
                },
            });

            uploadedUrl = uploadRes.fileName;
            uploading.value = false;
        }

        const payload = {
            ...form.value,
            id_edital: props.editalId,
            arquivo_url: uploadedUrl,
        };

        const tz = "America/Sao_Paulo";
        // Convert to UTC/ISO (forcing SP timezone)
        if (payload.data_inicio)
            payload.data_inicio = fromZonedTime(
                payload.data_inicio,
                tz,
            ).toISOString();
        if (payload.data_fim)
            payload.data_fim = fromZonedTime(
                payload.data_fim,
                tz,
            ).toISOString();
        if (payload.publicado_em)
            payload.publicado_em = fromZonedTime(
                payload.publicado_em,
                tz,
            ).toISOString();
        if (payload.desativado_em)
            payload.desativado_em = fromZonedTime(
                payload.desativado_em,
                tz,
            ).toISOString();

        if (!payload.id) delete (payload as any).id;

        await _fetch("/api/bolsas/etapas", {
            method: "POST",
            body: payload,
        });

        toast.showToast("Etapa salva com sucesso!", { type: "success" });
        emit("saved");
        emit("close");
    } catch (e: any) {
        console.error(e);
        toast.showToast(e.message || "Erro ao salvar etapa.", {
            type: "error",
        });
    } finally {
        isSubmitting.value = false;
        uploading.value = false;
    }
};
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
        <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="emit('close')"
        ></div>
        <div
            class="relative bg-[#1a1b26] w-full max-w-lg rounded-xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
            <h3 class="text-lg font-bold text-white mb-6">
                {{ etapa ? "Editar Etapa" : "Nova Etapa" }}
            </h3>

            <div class="space-y-4">
                <!-- Visibilidade Section -->
                <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                    <h4
                        class="text-xs font-bold text-secondary uppercase tracking-wider mb-4"
                    >
                        Visibilidade & Agendamento
                    </h4>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <!-- Is Publicado -->
                        <div
                            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors"
                            :class="
                                form.is_publicado
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                            "
                            @click="form.is_publicado = !form.is_publicado"
                        >
                            <span
                                class="text-sm font-bold"
                                :class="
                                    form.is_publicado
                                        ? 'text-green-400'
                                        : 'text-secondary'
                                "
                            >
                                {{
                                    form.is_publicado ? "Publicado" : "Rascunho"
                                }}
                            </span>
                            <div
                                class="relative w-9 h-5 rounded-full transition-colors duration-200"
                                :class="
                                    form.is_publicado
                                        ? 'bg-green-500'
                                        : 'bg-gray-600'
                                "
                            >
                                <div
                                    class="absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200"
                                    :class="
                                        form.is_publicado ? 'translate-x-4' : ''
                                    "
                                ></div>
                            </div>
                        </div>

                        <!-- Exibir Período -->
                        <div
                            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors"
                            :class="
                                form.exibir_periodo
                                    ? 'bg-primary/10 border-primary/30'
                                    : 'bg-white/5 border-white/10'
                            "
                            @click="form.exibir_periodo = !form.exibir_periodo"
                        >
                            <span
                                class="text-sm font-bold"
                                :class="
                                    form.exibir_periodo
                                        ? 'text-primary'
                                        : 'text-secondary'
                                "
                            >
                                Exibir Datas
                            </span>
                            <div
                                class="relative w-9 h-5 rounded-full transition-colors duration-200"
                                :class="
                                    form.exibir_periodo
                                        ? 'bg-primary'
                                        : 'bg-gray-600'
                                "
                            >
                                <div
                                    class="absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200"
                                    :class="
                                        form.exibir_periodo
                                            ? 'translate-x-4'
                                            : ''
                                    "
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label
                                class="text-[10px] text-secondary font-bold uppercase"
                                >Agendar Publicação</label
                            >
                            <input
                                v-model="form.publicado_em"
                                type="datetime-local"
                                class="w-full bg-[#16161E] border border-secondary/20 rounded p-2 text-white text-xs focus:border-primary outline-none dark-date-input"
                            />
                        </div>
                        <div class="space-y-1">
                            <label
                                class="text-[10px] text-secondary font-bold uppercase"
                                >Agendar Desativação</label
                            >
                            <input
                                v-model="form.desativado_em"
                                type="datetime-local"
                                class="w-full bg-[#16161E] border border-secondary/20 rounded p-2 text-white text-xs focus:border-primary outline-none dark-date-input"
                            />
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2 space-y-1">
                        <label class="text-xs text-secondary font-bold"
                            >Título</label
                        >
                        <input
                            v-model="form.titulo"
                            type="text"
                            placeholder="Ex: Inscrições"
                            class="w-full bg-[#16161E] border border-secondary/20 rounded p-2 text-white text-sm focus:border-primary outline-none"
                        />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs text-secondary font-bold"
                            >Ordem</label
                        >
                        <input
                            v-model="form.ordem"
                            type="number"
                            class="w-full bg-[#16161E] border border-secondary/20 rounded p-2 text-white text-sm focus:border-primary outline-none"
                        />
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="text-xs text-secondary font-bold"
                        >Descrição</label
                    >
                    <textarea
                        v-model="form.descricao"
                        rows="3"
                        class="w-full bg-[#16161E] border border-secondary/20 rounded p-2 text-white text-sm focus:border-primary outline-none"
                    ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs text-secondary font-bold"
                            >Data Início (Evento)</label
                        >
                        <input
                            v-model="form.data_inicio"
                            type="datetime-local"
                            class="w-full bg-[#16161E] border border-secondary/20 rounded p-2 text-white text-sm focus:border-primary outline-none dark-date-input"
                        />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs text-secondary font-bold"
                            >Data Fim (Evento)</label
                        >
                        <input
                            v-model="form.data_fim"
                            type="datetime-local"
                            class="w-full bg-[#16161E] border border-secondary/20 rounded p-2 text-white text-sm focus:border-primary outline-none dark-date-input"
                        />
                    </div>
                </div>

                <!-- Arquivo (Premium Style) -->
                <div class="space-y-1">
                    <label
                        class="text-xs text-secondary font-bold uppercase tracking-wider"
                        >Arquivo (Opcional)</label
                    >

                    <div
                        class="relative border-2 border-dashed border-secondary/20 rounded-xl p-4 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer"
                        @click="
                            () =>
                                !file &&
                                ($refs.fileInput as HTMLInputElement).click()
                        "
                        @dragover.prevent="dragging = true"
                        @dragleave.prevent="dragging = false"
                        @drop.prevent="handleDrop"
                    >
                        <input
                            ref="fileInput"
                            type="file"
                            @change="handleFileChange"
                            class="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                        />

                        <!-- Empty State -->
                        <div
                            v-if="!file && !form.arquivo_url"
                            class="flex flex-col items-center gap-2"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform"
                            >
                                <svg
                                    class="w-5 h-5 text-primary"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                    ></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>
                            <p
                                class="text-[10px] font-bold text-secondary tracking-tight"
                            >
                                Clique ou arraste arquivo
                            </p>
                        </div>

                        <!-- Existing File State -->
                        <div
                            v-else-if="!file && form.arquivo_url"
                            class="flex flex-col items-center gap-2 w-full"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-1"
                            >
                                <svg
                                    class="w-5 h-5 text-green-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                    ></path>
                                    <polyline
                                        points="14 2 14 8 20 8"
                                    ></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </div>
                            <p
                                class="text-[10px] font-bold truncate max-w-full px-4 text-green-400"
                            >
                                {{ form.arquivo_url.split("/").pop() }}
                            </p>
                            <button
                                @click.stop="
                                    (
                                        $refs.fileInput as HTMLInputElement
                                    ).click()
                                "
                                class="text-[9px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
                            >
                                Substituir
                            </button>
                        </div>

                        <!-- Selected State -->
                        <div
                            v-else
                            class="flex flex-col items-center gap-2 w-full"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-1"
                            >
                                <svg
                                    class="w-5 h-5 text-blue-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                            </div>
                            <p
                                class="text-[10px] font-bold text-white truncate max-w-full px-4"
                            >
                                {{ file?.name }}
                            </p>
                            <button
                                @click.stop="removeFile"
                                class="text-[9px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Error -->
                <div
                    v-if="errorMsg"
                    class="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 p-2 rounded animate-pulse"
                >
                    {{ errorMsg }}
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <button
                    @click="emit('close')"
                    class="px-4 py-2 text-sm font-bold text-secondary hover:text-white transition-colors"
                >
                    Cancelar
                </button>
                <button
                    @click="save"
                    :disabled="isSubmitting"
                    class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded flex items-center gap-2 disabled:opacity-50"
                >
                    <span
                        v-if="isSubmitting"
                        class="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"
                    ></span>
                    {{
                        isSubmitting
                            ? uploading
                                ? "Enviando..."
                                : "Salvando..."
                            : "Salvar"
                    }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dark-date-input::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.5;
    cursor: pointer;
}
</style>
