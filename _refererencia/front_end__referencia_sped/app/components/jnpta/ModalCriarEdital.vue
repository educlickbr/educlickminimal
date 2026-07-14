<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm"
            @click.self="$emit('close')"
        >
            <div
                class="bg-[#1A1A24] border-none md:border md:border-white/10 rounded-none md:rounded-lg w-full md:max-w-2xl overflow-hidden shadow-none md:shadow-2xl transform transition-all h-full md:h-auto max-h-full md:max-h-[85vh] flex flex-col"
            >
                <!-- Header -->
                <div
                    class="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0"
                >
                    <div class="flex flex-col gap-1">
                        <span
                            class="text-[10px] uppercase font-bold tracking-wider text-primary"
                            >Jornada Paulista</span
                        >
                        <h2 class="text-xl font-bold text-white">
                            Criar Edital
                        </h2>
                    </div>
                    <button
                        @click="$emit('close')"
                        class="text-secondary hover:text-white transition-colors"
                    >
                        <svg
                            class="w-6 h-6"
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

                <!-- Body -->
                <div
                    class="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar grow"
                >
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Título do Edital</label
                            >
                            <input
                                v-model="formData.edital_titulo"
                                type="text"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Ano/Semestre</label
                            >
                            <select
                                v-model="formData.ano_semestre"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            >
                                <option :value="getAnoSemestre(undefined, -1)">
                                    {{ getAnoSemestre(undefined, -1) }}
                                    (Anterior)
                                </option>
                                <option :value="getAnoSemestre()">
                                    {{ getAnoSemestre() }} (Atual)
                                </option>
                                <option :value="getAnoSemestre(undefined, 1)">
                                    {{ getAnoSemestre(undefined, 1) }} (Próximo)
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Tempo</label
                            >
                            <select
                                v-model="formData.qual_tempo"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            >
                                <option value="primeiro_tempo">
                                    Primeiro Tempo
                                </option>
                                <option value="segundo_tempo">
                                    Segundo Tempo
                                </option>
                            </select>
                        </div>

                        <div class="md:col-span-2">
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Descrição</label
                            >
                            <textarea
                                v-model="formData.edital_descricao"
                                rows="3"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            ></textarea>
                        </div>

                        <!-- File Upload -->
                        <div class="md:col-span-2">
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block"
                                >Arquivo do Edital</label
                            >

                            <!-- Hidden file input -->
                            <input
                                ref="localFileInput"
                                type="file"
                                accept="application/pdf,image/jpeg,image/jpg,image/png"
                                class="hidden"
                                @change="onFileChange"
                            />

                            <!-- Drag and Drop Zone -->
                            <div
                                @click="localFileInput?.click()"
                                @drop.prevent="onDrop"
                                @dragover.prevent="dragging = true"
                                @dragleave.prevent="dragging = false"
                                class="relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200"
                                :class="[
                                    dragging
                                        ? 'border-primary bg-primary/5'
                                        : 'border-secondary/20 hover:border-secondary/40',
                                    file || formData.arquivo_edital
                                        ? 'bg-background'
                                        : 'bg-background/50',
                                ]"
                            >
                                <!-- Empty state -->
                                <div
                                    v-if="!file && !formData.arquivo_edital"
                                    class="flex flex-col items-center justify-center py-8 px-4"
                                >
                                    <svg
                                        class="w-10 h-10 mb-3 text-secondary opacity-50"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <p class="text-sm text-secondary mb-1">
                                        Clique ou arraste o arquivo aqui
                                    </p>
                                    <p class="text-xs text-secondary/60">
                                        PDF, JPG, JPEG ou PNG
                                    </p>
                                </div>

                                <!-- Existing file state -->
                                <div
                                    v-else-if="
                                        !file && formData.arquivo_edital
                                    "
                                    class="flex items-center justify-between py-4 px-4"
                                >
                                    <div class="flex items-center gap-3">
                                        <svg
                                            class="w-8 h-8 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <div>
                                            <p
                                                class="text-sm font-medium text-white"
                                            >
                                                {{ formData.arquivo_edital }}
                                            </p>
                                            <p class="text-xs text-secondary">
                                                Clique para substituir
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Selected file state -->
                                <div
                                    v-else
                                    class="flex items-center justify-between py-4 px-4"
                                >
                                    <div class="flex items-center gap-3">
                                        <svg
                                            class="w-8 h-8 text-green-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <div>
                                            <p
                                                class="text-sm font-medium text-white"
                                            >
                                                {{ file?.name }}
                                            </p>
                                            <p class="text-xs text-secondary">
                                                {{
                                                    (
                                                        (file?.size || 0) /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)
                                                }}
                                                MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        @click.stop="removeFile"
                                        class="text-secondary hover:text-red-500 transition-colors"
                                    >
                                        <svg
                                            class="w-5 h-5"
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
                            </div>

                            <!-- Error message -->
                            <p
                                v-if="errorMsg"
                                class="text-xs text-red-500 mt-2"
                            >
                                {{ errorMsg }}
                            </p>
                        </div>

                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Data/Hora Início</label
                            >
                            <input
                                v-model="formData.dt_inicio"
                                type="datetime-local"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            />
                        </div>

                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Data/Hora Fim</label
                            >
                            <input
                                v-model="formData.dt_fim"
                                type="datetime-local"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            />
                        </div>

                        <div class="md:col-span-2 flex items-center gap-2">
                            <input
                                id="publicado-modal"
                                v-model="formData.publicado"
                                type="checkbox"
                                class="w-4 h-4"
                            />
                            <label
                                for="publicado-modal"
                                class="text-xs font-bold text-secondary"
                                >Publicar imediatamente</label
                            >
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="p-4 md:p-6 border-t border-white/5 flex justify-end gap-3 shrink-0"
                >
                    <button
                        @click="$emit('close')"
                        class="bg-background border border-secondary/10 text-secondary hover:text-white font-bold py-2.5 px-5 rounded-md text-xs uppercase tracking-wider transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="$emit('save')"
                        :disabled="isCreating || uploading"
                        class="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-5 rounded-md text-xs uppercase tracking-wider disabled:opacity-60 transition-colors shadow-lg shadow-primary/20"
                    >
                        {{
                            uploading
                                ? "Enviando arquivo..."
                                : isCreating
                                  ? "Salvando..."
                                  : "Criar Edital"
                        }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
    isOpen: boolean;
    formData: {
        edital_titulo: string;
        edital_descricao: string;
        arquivo_edital: string;
        ano_semestre: string;
        qual_tempo: string;
        dt_inicio: string;
        dt_fim: string;
        publicado: boolean;
    };
    file: File | null;
    dragging: boolean;
    uploading: boolean;
    isCreating: boolean;
    errorMsg: string | null;
    getAnoSemestre: (ano?: number, offset?: number) => string;
}>();

const emit = defineEmits<{
    close: [];
    save: [];
    "update:file": [value: File | null];
    "update:dragging": [value: boolean];
    handleDrop: [event: DragEvent];
    handleFileChange: [event: Event];
    removeFile: [];
}>();

const localFileInput = ref<HTMLInputElement | null>(null);

const dragging = computed({
    get: () => props.dragging,
    set: (val: boolean) => emit("update:dragging", val),
});

const file = computed({
    get: () => props.file,
    set: (val: File | null) => emit("update:file", val),
});

function onDrop(event: DragEvent) {
    emit("handleDrop", event);
}

function onFileChange(event: Event) {
    emit("handleFileChange", event);
}

function removeFile() {
    emit("removeFile");
}
</script>
