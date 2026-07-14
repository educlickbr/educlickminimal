<template>
    <div class="space-y-6">
        <!-- Blocos / Tabs -->
        <div
            class="flex items-center gap-6 border-b border-secondary/10 w-full pb-1 overflow-x-auto no-scrollbar"
        >
            <button
                v-for="block in activeBlocks"
                :key="block"
                @click="activeTab = block"
                class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                :class="
                    activeTab === block
                        ? 'text-rose-500'
                        : 'text-secondary hover:text-white'
                "
            >
                {{ formatBlockName(block) }}
                <span
                    v-if="activeTab === block"
                    class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-rose-500 rounded-full"
                ></span>
            </button>
        </div>

        <!-- Conteúdo do bloco ativo -->
        <div
            v-if="processedBlocks[activeTab]"
            class="bg-transparent md:bg-background border-none md:border md:border-secondary/10 rounded-none md:rounded-lg p-0 md:p-8 shadow-none md:shadow-sm transition-all duration-300"
        >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <template
                    v-for="question in processedBlocks[activeTab]"
                    :key="question.id_pergunta"
                >
                    <div
                        v-if="shouldShowQuestion(question)"
                        :class="[
                            'flex flex-col gap-2',
                            question.largura === 2
                                ? 'md:col-span-2'
                                : 'md:col-span-1',
                        ]"
                    >
                        <!-- Label + Badge de escopo -->
                        <div class="flex items-center gap-2 flex-wrap">
                            <label
                                :for="question.id_pergunta"
                                class="text-sm font-bold text-secondary"
                            >
                                {{ question.label }}
                            </label>
                            <span
                                v-if="question.escopo_original === 'turma'"
                                class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            >
                                Da turma
                            </span>
                            <span
                                v-else
                                class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            >
                                Global
                            </span>
                        </div>

                        <!-- Email: readonly -->
                        <template v-if="question.pergunta === 'email'">
                            <div class="group/field relative">
                                <input
                                    :id="question.id_pergunta"
                                    :value="answers[question.id_pergunta]"
                                    disabled
                                    class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium text-secondary/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="11"
                                            width="18"
                                            height="11"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <path
                                            d="M7 11V7a5 5 0 0 1 10 0v4"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                        </template>

                        <!-- 1. Textarea (altura >= 120) -->
                        <div
                            v-else-if="
                                question.tipo === 'texto' &&
                                question.altura >= 120
                            "
                            class="group/field relative"
                        >
                            <textarea
                                :id="question.id_pergunta"
                                v-model="answers[question.id_pergunta]"
                                :placeholder="question.label"
                                :style="{ height: question.altura + 'px' }"
                                @blur="handleSave(question)"
                                class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-secondary/30 resize-none"
                            ></textarea>
                            <div
                                class="absolute right-3 bottom-3 flex items-center gap-1.5 opacity-0 group-focus-within/field:opacity-100 transition-opacity"
                            >
                                <span
                                    v-if="isSaving[question.id_pergunta]"
                                    class="text-[10px] text-rose-500 animate-pulse font-bold"
                                    >Salvando...</span
                                >
                                <span
                                    v-else-if="lastSaved[question.id_pergunta]"
                                    class="text-[10px] text-secondary/40 font-bold"
                                    >Salvo
                                    {{ lastSaved[question.id_pergunta] }}</span
                                >
                            </div>
                        </div>

                        <!-- 2. Radio Buttons -->
                        <div v-else-if="question.tipo === 'radio'">
                            <div class="flex flex-col gap-2 mt-1">
                                <label
                                    v-for="(option, idx) in getOptions(
                                        question,
                                    )"
                                    :key="idx"
                                    class="flex items-center gap-3 p-3 rounded-md border border-secondary/10 bg-div-15 cursor-pointer hover:bg-div-30 transition-colors group"
                                >
                                    <input
                                        type="radio"
                                        :name="question.id_pergunta"
                                        :value="
                                            typeof option === 'object'
                                                ? option.label || option.value
                                                : option
                                        "
                                        v-model="answers[question.id_pergunta]"
                                        @change="handleSave(question)"
                                        class="w-4 h-4 text-rose-500 border-secondary/30 focus:ring-rose-500 bg-background"
                                    />
                                    <span
                                        class="text-sm font-bold text-secondary group-hover:text-text transition-colors"
                                    >
                                        {{
                                            typeof option === "object"
                                                ? option.label || option.value
                                                : option
                                        }}
                                    </span>
                                </label>
                            </div>
                            <div class="mt-2 flex justify-end">
                                <span
                                    v-if="isSaving[question.id_pergunta]"
                                    class="text-[10px] text-rose-500 animate-pulse font-bold"
                                    >Salvando...</span
                                >
                                <span
                                    v-else-if="lastSaved[question.id_pergunta]"
                                    class="text-[10px] text-secondary/40 font-bold"
                                    >Salvo
                                    {{ lastSaved[question.id_pergunta] }}</span
                                >
                            </div>
                        </div>

                        <!-- 3. Arquivo (Upload) -->
                        <div v-else-if="question.tipo === 'arquivo'">
                            <div
                                class="relative border-2 border-dashed border-secondary/20 rounded-lg p-6 transition-all hover:border-rose-500/40 hover:bg-rose-500/5 group text-center cursor-pointer"
                                @click="triggerFileUpload(question.id_pergunta)"
                            >
                                <input
                                    :id="'file-' + question.id_pergunta"
                                    type="file"
                                    class="hidden"
                                    :accept="getFileTypes(question).join(',')"
                                    @change="handleFileChange($event, question)"
                                />

                                <!-- Sem arquivo -->
                                <div
                                    v-if="!fileNames[question.id_pergunta]"
                                    class="flex flex-col items-center gap-2"
                                >
                                    <div
                                        class="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform"
                                    >
                                        <svg
                                            class="w-6 h-6 text-rose-500"
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
                                        {{
                                            question.pergunta === "sua_foto"
                                                ? "JPG, PNG (Max 4MB)"
                                                : "PDF (Max 4MB)"
                                        }}
                                    </p>
                                </div>

                                <!-- Com arquivo -->
                                <div v-else class="w-full">
                                    <!-- Foto: preview com moldura -->
                                    <div
                                        v-if="
                                            question.pergunta === 'sua_foto' &&
                                            answers[question.id_pergunta] &&
                                            hashBase
                                        "
                                        class="flex items-start gap-4"
                                    >
                                        <!-- Moldura da foto -->
                                        <div
                                            class="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-rose-500/20 bg-div-15 flex-shrink-0 shadow-lg group/photo"
                                        >
                                            <img
                                                :src="
                                                    hashBase +
                                                    answers[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover/photo:scale-110"
                                                :class="{
                                                    'opacity-0':
                                                        !photoLoaded[
                                                            question.id_pergunta
                                                        ],
                                                }"
                                                alt="Foto"
                                                @load="
                                                    photoLoaded[
                                                        question.id_pergunta
                                                    ] = true
                                                "
                                                @error="
                                                    photoLoaded[
                                                        question.id_pergunta
                                                    ] = false
                                                "
                                            />
                                            <!-- Fallback: placeholder só aparece se foto não carregou -->
                                            <div
                                                v-if="
                                                    !photoLoaded[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="absolute inset-0 flex items-center justify-center bg-rose-500/10"
                                            >
                                                <svg
                                                    class="w-10 h-10 text-rose-500/40"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="1.5"
                                                >
                                                    <path
                                                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                                    ></path>
                                                    <circle
                                                        cx="12"
                                                        cy="7"
                                                        r="4"
                                                    ></circle>
                                                </svg>
                                            </div>
                                        </div>

                                        <!-- Info + ações -->
                                        <div
                                            class="flex-1 flex flex-col gap-2 justify-center"
                                        >
                                            <p
                                                class="text-xs font-bold text-text truncate"
                                            >
                                                {{
                                                    fileNames[
                                                        question.id_pergunta
                                                    ]
                                                }}
                                            </p>
                                            <div
                                                v-if="
                                                    !confirmDeletes[
                                                        question.id_pergunta
                                                    ]
                                                "
                                                class="flex items-center gap-2"
                                            >
                                                <button
                                                    type="button"
                                                    class="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline"
                                                    @click.stop="
                                                        showConfirmDelete(
                                                            question.id_pergunta,
                                                        )
                                                    "
                                                    :disabled="
                                                        deletingFiles[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                >
                                                    {{
                                                        deletingFiles[
                                                            question.id_pergunta
                                                        ]
                                                            ? "Removendo..."
                                                            : "Remover foto"
                                                    }}
                                                </button>
                                                <span
                                                    class="text-[10px] text-secondary/30"
                                                    >·</span
                                                >
                                                <span
                                                    class="text-[10px] text-secondary/40"
                                                    >Clique na área para trocar
                                                    a foto</span
                                                >
                                            </div>

                                            <!-- Confirm delete -->
                                            <div
                                                v-else
                                                class="flex items-center gap-2"
                                            >
                                                <span
                                                    class="text-xs font-bold text-red-400"
                                                    >Remover foto?</span
                                                >
                                                <button
                                                    type="button"
                                                    class="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded"
                                                    @click.stop="
                                                        handleDeleteFile(
                                                            question,
                                                        )
                                                    "
                                                    :disabled="
                                                        deletingFiles[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                >
                                                    Sim
                                                </button>
                                                <button
                                                    type="button"
                                                    class="text-[10px] font-bold bg-white/5 text-secondary px-2 py-0.5 rounded"
                                                    @click.stop="
                                                        cancelConfirmDelete(
                                                            question.id_pergunta,
                                                        )
                                                    "
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Outros arquivos (não-foto): layout padrão -->
                                    <div
                                        v-else
                                        class="flex flex-col items-center gap-2 py-2 w-full"
                                    >
                                        <div
                                            v-if="
                                                !confirmDeletes[
                                                    question.id_pergunta
                                                ]
                                            "
                                            class="w-full flex flex-col items-center gap-2"
                                        >
                                            <div
                                                class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1"
                                            >
                                                <svg
                                                    class="w-6 h-6 text-green-500"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                >
                                                    <path
                                                        d="M20 6L9 17l-5-5"
                                                    ></path>
                                                </svg>
                                            </div>
                                            <p
                                                class="text-xs font-bold text-text truncate max-w-full px-4"
                                            >
                                                {{
                                                    fileNames[
                                                        question.id_pergunta
                                                    ]
                                                }}
                                            </p>
                                            <button
                                                type="button"
                                                class="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline mt-1"
                                                @click.stop="
                                                    showConfirmDelete(
                                                        question.id_pergunta,
                                                    )
                                                "
                                                :disabled="
                                                    deletingFiles[
                                                        question.id_pergunta
                                                    ]
                                                "
                                            >
                                                {{
                                                    deletingFiles[
                                                        question.id_pergunta
                                                    ]
                                                        ? "Removendo..."
                                                        : "Remover arquivo"
                                                }}
                                            </button>
                                        </div>

                                        <div
                                            v-else
                                            class="w-full bg-div-15 border border-secondary/10 rounded-lg p-4 flex flex-col items-center gap-3"
                                        >
                                            <p
                                                class="text-sm font-bold text-text"
                                            >
                                                Tem certeza que deseja remover
                                                este arquivo?
                                            </p>
                                            <div class="flex gap-3">
                                                <button
                                                    type="button"
                                                    class="bg-red-500 text-white font-bold py-2 px-4 rounded-lg text-xs"
                                                    @click.stop="
                                                        handleDeleteFile(
                                                            question,
                                                        )
                                                    "
                                                    :disabled="
                                                        deletingFiles[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                >
                                                    {{
                                                        deletingFiles[
                                                            question.id_pergunta
                                                        ]
                                                            ? "Removendo..."
                                                            : "Sim, remover"
                                                    }}
                                                </button>
                                                <button
                                                    type="button"
                                                    class="bg-background border border-secondary/10 text-secondary font-bold py-2 px-4 rounded-lg text-xs"
                                                    @click.stop="
                                                        cancelConfirmDelete(
                                                            question.id_pergunta,
                                                        )
                                                    "
                                                    :disabled="
                                                        deletingFiles[
                                                            question.id_pergunta
                                                        ]
                                                    "
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 4. Boolean Toggle -->
                        <div
                            v-else-if="question.tipo === 'boolean'"
                            class="group/field relative"
                        >
                            <div class="flex items-center gap-3">
                                <label
                                    :for="'bool-' + question.id_pergunta"
                                    class="inline-flex items-center cursor-pointer"
                                >
                                    <input
                                        :id="'bool-' + question.id_pergunta"
                                        type="checkbox"
                                        class="sr-only"
                                        v-model="answers[question.id_pergunta]"
                                        @change="handleSave(question)"
                                    />
                                    <div
                                        :class="
                                            answers[question.id_pergunta]
                                                ? 'bg-rose-500'
                                                : 'bg-div-15'
                                        "
                                        class="w-12 h-6 rounded-full relative transition-colors"
                                    >
                                        <span
                                            :class="
                                                answers[question.id_pergunta]
                                                    ? 'translate-x-6'
                                                    : 'translate-x-0'
                                            "
                                            class="absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform"
                                        ></span>
                                    </div>
                                </label>
                                <span
                                    class="text-sm font-bold text-secondary"
                                    >{{
                                        answers[question.id_pergunta]
                                            ? "Sim"
                                            : "Não"
                                    }}</span
                                >
                            </div>
                        </div>

                        <!-- 5. Generic Input (texto, número, data, telefone, etc.) -->
                        <div v-else class="group/field relative">
                            <div class="relative">
                                <input
                                    :type="getInputType(question.tipo)"
                                    :id="question.id_pergunta"
                                    v-model="answers[question.id_pergunta]"
                                    :placeholder="question.label"
                                    :readonly="question.pergunta === 'email'"
                                    @blur="handleSave(question)"
                                    class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                    :class="{
                                        'pr-10': question.tipo === 'data',
                                        '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none':
                                            question.tipo === 'data',
                                    }"
                                />

                                <!-- Ícone de calendário para campo data -->
                                <div
                                    v-if="question.tipo === 'data'"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="16"
                                            y1="2"
                                            x2="16"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="2"
                                            x2="8"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="10"
                                            x2="21"
                                            y2="10"
                                        ></line>
                                    </svg>
                                </div>
                            </div>

                            <!-- Indicador de save -->
                            <div
                                class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-focus-within/field:opacity-100 transition-opacity pointer-events-none"
                            >
                                <span
                                    v-if="isSaving[question.id_pergunta]"
                                    class="text-[10px] text-rose-500 animate-pulse font-bold"
                                    >Salvando...</span
                                >
                                <span
                                    v-else-if="lastSaved[question.id_pergunta]"
                                    class="text-[10px] text-secondary/40 font-bold"
                                    >Salvo
                                    {{ lastSaved[question.id_pergunta] }}</span
                                >
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { validateFile } from "../../../utils/file";

const props = defineProps<{
    formData: any; // { perguntas: any[], ... }
    answers: Record<string, any>;
    isSaving: Record<string, boolean>;
    lastSaved: Record<string, string>;
    turmaId: string;
    hashBase: string | null;
}>();

const emit = defineEmits<{
    save: [perguntaId: string, value: any];
    upload: [perguntaId: string, file: File];
    deleteFile: [perguntaId: string, fileName: string];
}>();

// --- Block Processing ---
const processedBlocks = computed(() => {
    const perguntas = props.formData?.perguntas;
    if (!perguntas) return {};

    const blocks: Record<string, any[]> = {};
    perguntas.forEach((q: any) => {
        if (q.bloco === "responsavel_legal") return; // oculto para maiores de 18
        if (!blocks[q.bloco]) blocks[q.bloco] = [];
        blocks[q.bloco]!.push(q);
    });

    Object.keys(blocks).forEach((key) => {
        blocks[key]!.sort((a: any, b: any) => a.ordem - b.ordem);
    });

    return blocks;
});

const activeBlocks = computed<string[]>(() => {
    const entries = Object.entries(processedBlocks.value);
    if (entries.length === 0) return [];

    const orderMap: Record<string, number> = {};
    entries.forEach(([name, questions]) => {
        const first = questions.reduce((min: number, q: any) => {
            const ord = q.ordem_bloco ?? q.ordem ?? 0;
            return Math.min(min, ord);
        }, Number.POSITIVE_INFINITY);
        orderMap[name] = Number.isFinite(first) ? first : 0;
    });

    return Object.entries(orderMap)
        .sort((a, b) => a[1] - b[1])
        .map(([k]) => k);
});

const activeTab = ref<string>("");

watch(
    activeBlocks,
    (blocks) => {
        if (
            blocks.length > 0 &&
            (!activeTab.value || !blocks.includes(activeTab.value))
        ) {
            activeTab.value = blocks[0]!;
        }
    },
    { immediate: true },
);

// --- Block Labels ---
const BLOCO_LABELS: Record<string, string> = {
    dados_pessoais: "Dados Pessoais",
    responsavel_legal: "Responsável Legal",
    dados_socio_economicos: "Dados Socioeconômicos",
    pcd: "PCD",
    endereco: "Endereço",
    documentos: "Documentos",
    aceite: "Aceite",
    sobre_curso: "Sobre o Curso",
    prontidao: "Prontidão",
    contratacao: "Contratação",
    ficha_medica: "Ficha Médica",
};

const formatBlockName = (name: string) => BLOCO_LABELS[name] ?? name;

// --- Dependency Logic ---
const shouldShowQuestion = (q: any) => {
    if (!q.depende) return true;
    if (!q.depende_de || !q.valor_depende) return true;

    const parent = props.answers[q.depende_de];
    const parentStr =
        parent === undefined || parent === null ? "" : String(parent);

    const allowed = Array.isArray(q.valor_depende)
        ? q.valor_depende.map((v: any) => String(v))
        : [String(q.valor_depende)];

    return allowed.includes(parentStr);
};

// --- Input Type ---
const getInputType = (tipo: string) => {
    switch (tipo) {
        case "texto":
            return "text";
        case "número":
            return "number";
        case "data":
            return "date";
        case "telefone":
            return "tel";
        case "email":
            return "email";
        default:
            return "text";
    }
};

// --- Options (radio/select) ---
const getOptions = (question: any) => {
    if (
        question.opcoes &&
        Array.isArray(question.opcoes) &&
        question.opcoes.length > 0
    )
        return question.opcoes;

    switch (question.pergunta) {
        case "cor_raca":
            return ["Branca", "Preta", "Parda", "Amarela", "Indígena"];
        case "identidade_genero":
            return [
                "Cisgênero",
                "Transgênero",
                "Não-binário",
                "Outro",
                "Prefiro não informar",
            ];
        case "nacionalidade":
            return ["Brasileira", "Estrangeira"];
        case "formacao_escolar":
            return [
                "Fundamental Incompleto",
                "Fundamental Completo",
                "Médio Incompleto",
                "Médio Completo",
                "Superior Incompleto",
                "Superior Completo",
            ];
        case "renda_familiar_per_capita":
            return [
                "Até 1 salário mínimo",
                "1 a 3 salários mínimos",
                "3 a 5 salários mínimos",
                "Acima de 5 salários mínimos",
            ];
        case "pcd":
            return ["Sim", "Não"];
        default:
            return ["Sim", "Não"];
    }
};

// --- File Types ---
const getFileTypes = (question: any): string[] => {
    if (question.pergunta === "sua_foto")
        return ["image/jpeg", "image/png", "image/jpg"];
    return ["application/pdf"];
};

// --- File State (local UI) ---
const fileNames = ref<Record<string, string>>({});
const confirmDeletes = ref<Record<string, boolean>>({});
const uploadingFiles = ref<Record<string, boolean>>({});
const deletingFiles = ref<Record<string, boolean>>({});
const photoLoaded = ref<Record<string, boolean>>({});

// Inicializa fileNames das respostas existentes
watch(
    () => props.formData,
    (data) => {
        if (data?.perguntas) {
            const names: Record<string, string> = {};
            data.perguntas.forEach((q: any) => {
                if (q.tipo === "arquivo" && q.arquivo_original) {
                    names[q.id_pergunta] = q.arquivo_original;
                }
            });
            fileNames.value = names;
        }
    },
    { immediate: true },
);

// --- Handlers ---
const handleSave = (question: any) => {
    const value = props.answers[question.id_pergunta];
    if (value === undefined || value === null) return;
    emit("save", question.id_pergunta, value);
};

const triggerFileUpload = (perguntaId: string) => {
    const el = document.getElementById(
        "file-" + perguntaId,
    ) as HTMLInputElement;
    el?.click();
};

const handleFileChange = async (event: Event, question: any) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    if (!file) return;

    const allowedTypes = getFileTypes(question);
    const { valid, error } = validateFile(file, allowedTypes);
    if (!valid) {
        alert(error);
        target.value = "";
        return;
    }

    uploadingFiles.value[question.id_pergunta] = true;
    fileNames.value[question.id_pergunta] = file.name;
    // Reseta estado da foto para mostrar placeholder durante upload
    if (question.pergunta === "sua_foto") {
        photoLoaded.value[question.id_pergunta] = false;
    }

    try {
        emit("upload", question.id_pergunta, file);
    } finally {
        uploadingFiles.value[question.id_pergunta] = false;
    }
};

const showConfirmDelete = (perguntaId: string) => {
    confirmDeletes.value[perguntaId] = true;
};

const cancelConfirmDelete = (perguntaId: string) => {
    confirmDeletes.value[perguntaId] = false;
};

const handleDeleteFile = (question: any) => {
    deletingFiles.value[question.id_pergunta] = true;
    const fileName = fileNames.value[question.id_pergunta];
    if (fileName) {
        emit("deleteFile", question.id_pergunta, fileName);
    }
    // Limpa estado local
    delete fileNames.value[question.id_pergunta];
    delete confirmDeletes.value[question.id_pergunta];
    delete photoLoaded.value[question.id_pergunta];
    deletingFiles.value[question.id_pergunta] = false;
};
</script>
