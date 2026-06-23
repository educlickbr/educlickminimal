<template>
    <div :style="{ gridColumn: `span ${pergunta.largura || '1'}` }">
        <div class="flex items-center justify-between">
            <label
                class="text-[10px] font-black uppercase tracking-widest text-secondary/60"
            >
                {{ pergunta.label }}
                <span v-if="pergunta.obrigatorio" class="text-primary ml-1"
                    >*</span
                >
            </label>
            <span
                v-if="saveStatus?.[pergunta.pergunta_id]"
                class="text-[8px] font-bold text-primary/60 uppercase tracking-tighter"
            >
                {{ saveStatus[pergunta.pergunta_id] }}
            </span>
        </div>

        <!-- text, email -->
        <input
            v-if="
                pergunta.tipo_pergunta === 'text' ||
                pergunta.tipo_pergunta === 'email'
            "
            v-model="answers[pergunta.pergunta_id]"
            :type="pergunta.tipo_pergunta === 'email' ? 'email' : 'text'"
            :disabled="pergunta.disabled"
            @blur="onBlur(pergunta.pergunta_id)"
            class="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-primary/30 transition-all"
            :style="{
                height: pergunta.altura ? pergunta.altura + 'px' : '36px',
            }"
        />

        <!-- cpf -->
        <input
            v-else-if="pergunta.tipo_pergunta === 'cpf'"
            v-model="answers[pergunta.pergunta_id]"
            type="text"
            @input="onCpfInput(pergunta.pergunta_id)"
            @blur="onBlur(pergunta.pergunta_id, 'cpf')"
            class="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-primary/30 transition-all"
            :style="{
                height: pergunta.altura ? pergunta.altura + 'px' : '36px',
            }"
        />

        <!-- cep -->
        <input
            v-else-if="pergunta.tipo_pergunta === 'cep'"
            v-model="answers[pergunta.pergunta_id]"
            type="text"
            @input="onCepInput(pergunta.pergunta_id)"
            @blur="onCepBlur(pergunta)"
            class="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-primary/30 transition-all"
            :style="{
                height: pergunta.altura ? pergunta.altura + 'px' : '36px',
            }"
        />

        <!-- endereco -->
        <input
            v-else-if="pergunta.tipo_pergunta === 'endereco'"
            v-model="answers[pergunta.pergunta_id]"
            type="text"
            :disabled="isEnderecoFieldDisabled(pergunta)"
            @blur="onBlur(pergunta.pergunta_id)"
            class="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            :style="{
                height: pergunta.altura ? pergunta.altura + 'px' : '36px',
            }"
        />

        <!-- select -->
        <select
            v-else-if="pergunta.tipo_pergunta === 'select'"
            v-model="answers[pergunta.pergunta_id]"
            @change="onBlur(pergunta.pergunta_id)"
            class="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 text-white text-xs focus:outline-none focus:border-primary/30 transition-all"
            :style="{
                height: pergunta.altura ? pergunta.altura + 'px' : '36px',
            }"
        >
            <option :value="null" disabled>Selecione...</option>
            <option v-for="opt in pergunta.opcoes" :key="opt" :value="opt">
                {{ opt }}
            </option>
        </select>

        <!-- date / data -->
        <template v-else-if="isDateQuestion(pergunta.tipo_pergunta)">
            <input
                v-model="answers[pergunta.pergunta_id]"
                type="date"
                @change="onBlur(pergunta.pergunta_id, 'data')"
                class="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 text-white text-xs focus:outline-none focus:border-primary/30 transition-all"
                :style="{
                    height: pergunta.altura ? pergunta.altura + 'px' : '36px',
                }"
            />
        </template>

        <!-- file -->
        <div
            v-else-if="pergunta.tipo_pergunta === 'file'"
            class="flex flex-col gap-2"
        >
            <!-- Estado sem arquivo: placeholder com ícone de documento -->
            <div
                v-if="!answers[pergunta.pergunta_id]"
                @click="triggerFileUpload"
                class="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-pointer hover:border-primary/30 hover:bg-white/[0.06] transition-all"
            >
                <div
                    class="flex items-center justify-center w-16 h-16 rounded-lg border border-white/10 bg-white/[0.06] flex-shrink-0"
                >
                    <Icon
                        name="ph:file-light"
                        class="w-6 h-6 text-secondary/30"
                    />
                </div>
                <div
                    class="flex-1 min-w-0 flex items-center justify-between gap-2"
                >
                    <span class="text-[11px] text-secondary/40 font-medium">
                        Nenhum arquivo
                    </span>
                    <span
                        class="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                    >
                        Selecionar
                    </span>
                </div>
                <input
                    ref="fileInputRef"
                    type="file"
                    class="hidden"
                    @change="(e) => onFileUpload(e, pergunta.pergunta_id)"
                />
            </div>
            <!-- Arquivo carregado -->
            <div
                v-else
                class="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2"
                :style="{
                    height: pergunta.altura ? pergunta.altura + 'px' : '36px',
                }"
            >
                <div class="flex items-center gap-3 overflow-hidden">
                    <button
                        @click="onViewFile(pergunta.pergunta_id)"
                        class="text-primary/80 hover:text-primary transition-colors flex-shrink-0"
                        title="Visualizar arquivo"
                    >
                        <Icon name="ph:arrow-square-out-bold" class="w-4 h-4" />
                    </button>
                    <span
                        class="text-[10px] text-gray-500 truncate"
                        :title="fileNames?.[pergunta.pergunta_id]"
                    >
                        {{
                            fileNames?.[pergunta.pergunta_id] ||
                            "Arquivo anexado"
                        }}
                    </span>
                </div>
                <template v-if="pendingRemove === pergunta.pergunta_id">
                    <div
                        class="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider"
                    >
                        <span class="text-red-400/80">Tem certeza?</span>
                        <button
                            @click="confirmRemove(pergunta.pergunta_id)"
                            class="px-2 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                        >
                            Sim
                        </button>
                        <button
                            @click="cancelRemove"
                            class="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-400 transition-colors"
                        >
                            Não
                        </button>
                    </div>
                </template>
                <button
                    v-else
                    @click="requestRemove(pergunta.pergunta_id)"
                    class="flex-shrink-0 text-red-400/60 hover:text-red-400 transition-colors ml-2"
                    title="Remover arquivo"
                >
                    <Icon name="ph:trash-light" class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- foto -->
        <div
            v-else-if="pergunta.tipo_pergunta === 'foto'"
            class="flex flex-col gap-2"
        >
            <!-- Estado sem foto: placeholder com moldura e máquina -->
            <div
                v-if="!answers[pergunta.pergunta_id]"
                @click="triggerFotoUpload"
                class="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-pointer hover:border-primary/30 hover:bg-white/[0.06] transition-all"
            >
                <div
                    class="flex items-center justify-center w-16 h-16 rounded-lg border border-white/10 bg-white/[0.06] flex-shrink-0"
                >
                    <Icon
                        name="ph:camera-light"
                        class="w-6 h-6 text-secondary/30"
                    />
                </div>
                <div
                    class="flex-1 min-w-0 flex items-center justify-between gap-2"
                >
                    <span class="text-[11px] text-secondary/40 font-medium">
                        Nenhuma foto
                    </span>
                    <span
                        class="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                    >
                        Selecionar
                    </span>
                </div>
                <input
                    ref="fotoInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="(e) => onFileUpload(e, pergunta.pergunta_id)"
                />
            </div>
            <!-- Estado com foto carregada -->
            <div
                v-else
                class="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
                <!-- Loading state enquanto a URL da imagem não carregou -->
                <template v-if="!fileLinks?.[pergunta.pergunta_id]">
                    <div
                        class="flex items-center justify-center w-16 h-16 rounded-lg border border-white/10 bg-white/[0.06] text-[9px] text-secondary/40"
                    >
                        Carregando...
                    </div>
                </template>
                <!-- Miniatura da foto à esquerda com moldura -->
                <img
                    v-else
                    :src="fileLinks?.[pergunta.pergunta_id]"
                    :alt="pergunta.label"
                    class="w-16 h-16 rounded-lg border border-white/10 object-cover flex-shrink-0"
                />
                <!-- Informações do arquivo à direita -->
                <div
                    class="flex-1 min-w-0 flex items-center justify-between gap-2"
                >
                    <span
                        class="text-[11px] text-gray-400 truncate font-medium"
                        :title="fileNames?.[pergunta.pergunta_id]"
                    >
                        {{
                            fileNames?.[pergunta.pergunta_id] || "Foto anexada"
                        }}
                    </span>
                    <template v-if="pendingRemove === pergunta.pergunta_id">
                        <div
                            class="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider"
                        >
                            <span class="text-red-400/80">Tem certeza?</span>
                            <button
                                @click="confirmRemove(pergunta.pergunta_id)"
                                class="px-2 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                            >
                                Sim
                            </button>
                            <button
                                @click="cancelRemove"
                                class="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-400 transition-colors"
                            >
                                Não
                            </button>
                        </div>
                    </template>
                    <button
                        v-else
                        @click="requestRemove(pergunta.pergunta_id)"
                        class="flex-shrink-0 text-red-400/60 hover:text-red-400 transition-colors"
                        title="Remover foto"
                    >
                        <Icon name="ph:trash-light" class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- textarea -->
        <textarea
            v-else-if="pergunta.tipo_pergunta === 'textarea'"
            v-model="answers[pergunta.pergunta_id]"
            @blur="onBlur(pergunta.pergunta_id)"
            class="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-primary/30 transition-all resize-none"
            :style="{
                height: pergunta.altura ? pergunta.altura + 'px' : '80px',
            }"
            placeholder="Digite aqui..."
        />

        <!-- fallback -->
        <div
            v-else
            class="p-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-[10px] text-secondary text-center"
        >
            Tipo de pergunta não suportado: {{ pergunta.tipo_pergunta }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { isDateQuestion } from "~/composables/form/useFormAnswers";

const fotoInputRef = ref<HTMLInputElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingRemove = ref<string | null>(null);

function triggerFotoUpload() {
    fotoInputRef.value?.click();
}

function triggerFileUpload() {
    fileInputRef.value?.click();
}

function requestRemove(perguntaId: string) {
    pendingRemove.value = perguntaId;
}

function confirmRemove(perguntaId: string) {
    pendingRemove.value = null;
    emit("removeFile", perguntaId);
}

function cancelRemove() {
    pendingRemove.value = null;
}

const props = defineProps<{
    pergunta: any;
    answers: Record<string, any>;
    saveStatus?: Record<string, string>;
    fileNames?: Record<string, string>;
    fileLinks?: Record<string, string>;
    isEnderecoFieldDisabled: (p: any) => boolean;
}>();

const emit = defineEmits<{
    (e: "blur", perguntaId: string, tipo?: string): void;
    (e: "cepBlur", pergunta: any): void;
    (e: "cepInput", perguntaId: string): void;
    (e: "cpfInput", perguntaId: string): void;
    (e: "fileUpload", event: Event, perguntaId: string): void;
    (e: "removeFile", perguntaId: string): void;
    (e: "viewFile", perguntaId: string): void;
}>();

function onBlur(perguntaId: string, tipo?: string) {
    emit("blur", perguntaId, tipo);
}

function onCepBlur(pergunta: any) {
    emit("cepBlur", pergunta);
}

function onCepInput(perguntaId: string) {
    emit("cepInput", perguntaId);
}

function onCpfInput(perguntaId: string) {
    emit("cpfInput", perguntaId);
}

function onFileUpload(event: Event, perguntaId: string) {
    emit("fileUpload", event, perguntaId);
}

function onRemoveFile(perguntaId: string) {
    emit("removeFile", perguntaId);
}

function onViewFile(perguntaId: string) {
    emit("viewFile", perguntaId);
}
</script>
