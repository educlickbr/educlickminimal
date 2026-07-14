<script setup lang="ts">
defineProps<{
    isOpen: boolean;
    data: {
        student: any | null;
        type: "justificada" | "abonada" | null;
        text: string;
    };
    filters: {
        data: string;
    };
    aulaSelecionada: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "save"): void;
}>();

const textModel = defineModel<string>("text", { default: "" });
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
        <div
            class="bg-[#16161E] border border-white/10 rounded-xl w-full max-w-md flex flex-col shadow-2xl relative"
        >
            <!-- Header -->
            <div
                class="flex items-start justify-between p-6 border-b border-white/5"
            >
                <div>
                    <h3 class="text-lg font-bold text-white">
                        {{
                            data.type === "justificada"
                                ? "Justificativa"
                                : "Abono"
                        }}
                    </h3>
                    <p v-if="data.student" class="text-sm text-secondary mt-1">
                        {{ data.student.nome_aluno }}
                    </p>
                </div>
                <button
                    @click="emit('close')"
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
                        ></path>
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-4">
                <!-- Student Info -->
                <div
                    v-if="data.student"
                    class="bg-black/20 rounded-lg p-3 border border-white/5"
                >
                    <div class="text-xs text-secondary space-y-1">
                        <p>
                            <span class="font-semibold text-white">Data:</span>
                            {{
                                filters.data.split("-").reverse().join("/")
                            }}
                        </p>
                        <p>
                            <span class="font-semibold text-white">Aula:</span>
                            {{
                                aulaSelecionada
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (c) => c.toUpperCase())
                            }}
                        </p>
                    </div>
                </div>

                <!-- Textarea -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-white">
                        Descrição
                        {{
                            data.type === "justificada"
                                ? "da Justificativa"
                                : "do Abono"
                        }}
                    </label>
                    <textarea
                        v-model="textModel"
                        rows="4"
                        class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none"
                        :placeholder="`Digite ${data.type === 'justificada' ? 'a justificativa' : 'o abono'}...`"
                    ></textarea>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-white/5 flex gap-2">
                <button
                    @click="emit('close')"
                    class="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    @click="emit('save')"
                    class="flex-1 px-4 py-2 bg-primary hover:brightness-110 text-white text-sm font-medium rounded-lg transition-all"
                    :disabled="!textModel.trim()"
                    :class="{
                        'opacity-50 cursor-not-allowed': !textModel.trim(),
                    }"
                >
                    Salvar
                </button>
            </div>
        </div>
    </div>
</template>
