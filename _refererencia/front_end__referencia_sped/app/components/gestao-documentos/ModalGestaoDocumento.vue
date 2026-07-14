<script setup lang="ts">
import { ref } from "vue";
import BaseSelect from "~/components/BaseSelect.vue";
import { $fetch as ofetch } from "ofetch";

const props = defineProps<{
    isOpen: boolean;
    form: any;
    file: any;
    dragging: boolean;
    uploading: boolean;
    errorMsg: string | null;
    hashBaseLocal: string | null;
    escopoOptions: any[];
    areaOptions: any[];
    isSaving: boolean;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "save"): void;
    (e: "update:file", file: File | null): void;
    (e: "update:dragging", val: boolean): void;
    (e: "handleDrop", event: DragEvent): void;
    (e: "handleFileChange", event: Event): void;
    (e: "removeFile"): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div
                    class="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    @click="emit('close')"
                />
                <div
                    class="relative bg-[#16161E] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-5 border-b border-white/5"
                    >
                        <h2
                            class="text-base font-black text-white uppercase tracking-wider"
                        >
                            {{
                                form.id ? "Editar Documento" : "Novo Documento"
                            }}
                        </h2>
                        <button
                            @click="emit('close')"
                            class="p-2 rounded-lg text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <svg
                                class="w-4 h-4"
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
                    <div class="p-5 space-y-4">
                        <!-- Nome -->
                        <div>
                            <label
                                class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                            >
                                Nome do Documento
                                <span class="text-red-400">*</span>
                            </label>
                            <input
                                v-model="form.nome_documento"
                                type="text"
                                placeholder="Ex: Regulamento de Bolsas 2026"
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/40 h-10"
                            />
                        </div>

                        <!-- Descrição -->
                        <div>
                            <label
                                class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                                >Descrição</label
                            >
                            <textarea
                                v-model="form.descricao"
                                rows="2"
                                placeholder="Breve descrição do documento..."
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/40 resize-none"
                            />
                        </div>

                        <!-- Arquivo (Premium Style) -->
                        <div class="space-y-1">
                            <label
                                class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                                >Arquivo do Documento</label
                            >

                            <div
                                class="relative border-2 border-dashed border-secondary/20 rounded-xl p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer"
                                @click="
                                    () =>
                                        !file &&
                                        (fileInput as HTMLInputElement)?.click()
                                "
                                @dragover.prevent="
                                    emit('update:dragging', true)
                                "
                                @dragleave.prevent="
                                    emit('update:dragging', false)
                                "
                                @drop.prevent="emit('handleDrop', $event)"
                            >
                                <input
                                    ref="fileInput"
                                    type="file"
                                    @change="emit('handleFileChange', $event)"
                                    class="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />

                                <!-- Empty State -->
                                <div
                                    v-if="!file && !form.arquivo"
                                    class="flex flex-col items-center gap-2"
                                >
                                    <div
                                        class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform"
                                    >
                                        <svg
                                            class="w-6 h-6 text-primary"
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
                                            <polyline
                                                points="17 8 12 3 7 8"
                                            ></polyline>
                                            <line
                                                x1="12"
                                                y1="3"
                                                x2="12"
                                                y2="15"
                                            ></line>
                                        </svg>
                                    </div>
                                    <p
                                        class="text-xs font-bold text-secondary tracking-tight"
                                    >
                                        Clique ou arraste para enviar arquivo
                                    </p>
                                    <p class="text-[10px] text-secondary/40">
                                        PDF, JPG, PNG (Max 4MB)
                                    </p>
                                </div>

                                <!-- Existing File State -->
                                <div
                                    v-else-if="!file && form.arquivo"
                                    class="flex flex-col items-center gap-2 w-full"
                                >
                                    <div
                                        class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1"
                                    >
                                        <svg
                                            class="w-6 h-6 text-green-500"
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
                                            <line
                                                x1="16"
                                                y1="13"
                                                x2="8"
                                                y2="13"
                                            ></line>
                                            <line
                                                x1="16"
                                                y1="17"
                                                x2="8"
                                                y2="17"
                                            ></line>
                                            <polyline
                                                points="10 9 9 9 8 9"
                                            ></polyline>
                                        </svg>
                                    </div>
                                    <p
                                        class="text-xs font-bold truncate max-w-full px-4 text-green-400"
                                    >
                                        Arquivo Atual:
                                        {{ form.arquivo.split("/").pop() }}
                                    </p>
                                    <a
                                        v-if="hashBaseLocal"
                                        :href="hashBaseLocal + form.arquivo"
                                        target="_blank"
                                        @click.stop
                                        class="text-[10px] font-bold text-white bg-green-500/20 px-3 py-1 rounded inline-flex items-center gap-1 hover:bg-green-500/40 transition"
                                    >
                                        <svg
                                            class="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        Visualizar Documento Atual
                                    </a>

                                    <button
                                        @click.stop="
                                            (
                                                fileInput as HTMLInputElement
                                            )?.click()
                                        "
                                        class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-2"
                                    >
                                        Substituir arquivo
                                    </button>
                                </div>

                                <!-- Selected State -->
                                <div
                                    v-else
                                    class="flex flex-col items-center gap-2 w-full"
                                >
                                    <div
                                        class="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-1"
                                    >
                                        <svg
                                            class="w-6 h-6 text-blue-500"
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
                                        class="text-xs font-bold text-white truncate max-w-full px-4"
                                    >
                                        {{ file?.name }}
                                    </p>
                                    <button
                                        @click.stop="emit('removeFile')"
                                        class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-1"
                                    >
                                        Cancelar upload
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Escopo + Área/Turma -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                                    >Escopo</label
                                >
                                <BaseSelect
                                    v-model="form.escopo"
                                    :options="escopoOptions"
                                    label-key="label"
                                    value-key="value"
                                    placeholder="Selecione"
                                />
                            </div>
                            <div
                                v-if="form.escopo === 'geral'"
                                class="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-sky-100 flex items-center"
                            >
                                Visível para qualquer usuário autenticado.
                            </div>
                            <div v-else-if="form.escopo === 'area'">
                                <label
                                    class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                                    >Área</label
                                >
                                <BaseSelect
                                    v-model="form.area"
                                    :options="
                                        areaOptions.filter(
                                            (o) => o.value !== null,
                                        )
                                    "
                                    label-key="label"
                                    value-key="value"
                                    placeholder="Selecione a área"
                                />
                            </div>
                            <div v-else>
                                <label
                                    class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                                    >ID da Turma</label
                                >
                                <input
                                    v-model="form.id_turma"
                                    type="text"
                                    placeholder="UUID da turma"
                                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/40 h-10"
                                />
                            </div>
                        </div>

                        <!-- Vigência -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                                    >Início da Vigência</label
                                >
                                <input
                                    v-model="form.vigencia_ini"
                                    type="date"
                                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none h-10"
                                />
                            </div>
                            <div>
                                <label
                                    class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                                    >Fim da Vigência</label
                                >
                                <input
                                    v-model="form.vigencia_fim"
                                    type="date"
                                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none h-10"
                                />
                            </div>
                        </div>

                        <!-- Publicado toggle -->
                        <div
                            class="flex items-center justify-between bg-[#0f0f15] border border-white/5 rounded-lg px-4 py-3"
                        >
                            <div>
                                <p class="text-sm font-semibold text-white">
                                    Publicado
                                </p>
                                <p class="text-[11px] text-secondary mt-0.5">
                                    Visível para os usuários
                                </p>
                            </div>
                            <button
                                type="button"
                                @click="form.publicado = !form.publicado"
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                                :class="
                                    form.publicado
                                        ? 'bg-primary'
                                        : 'bg-white/10'
                                "
                            >
                                <span
                                    class="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow"
                                    :class="
                                        form.publicado
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                    "
                                />
                            </button>
                        </div>

                        <!-- Error -->
                        <div
                            v-if="errorMsg"
                            class="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 p-2 rounded animate-pulse"
                        >
                            {{ errorMsg }}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="flex items-center justify-end gap-3 p-5 border-t border-white/5"
                    >
                        <button
                            @click="emit('close')"
                            class="px-4 py-2 text-sm text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="emit('save')"
                            :disabled="isSaving || uploading"
                            class="px-5 py-2 text-sm font-bold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg
                                v-if="isSaving || uploading"
                                class="animate-spin w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                />
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            {{
                                isSaving || uploading
                                    ? uploading
                                        ? "Enviando arquivo..."
                                        : "Salvando..."
                                    : form.id
                                      ? "Atualizar"
                                      : "Criar Documento"
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
