<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                @click.self="$emit('close')"
            >
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

                <!-- Modal -->
                <div
                    class="relative bg-[#16161E] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-white/5"
                    >
                        <h3 class="text-base font-bold text-white">
                            Motivo da Reprovação
                        </h3>
                        <button
                            @click="$emit('close')"
                            class="text-white/40 hover:text-white transition-colors"
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

                    <!-- Body -->
                    <div class="px-6 py-4 space-y-4 overflow-y-auto">
                        <p class="text-sm text-secondary">
                            Explique o motivo da reprovação da solicitação de
                            <strong class="text-white">{{
                                nomeAluno
                            }}</strong
                            >.
                        </p>

                        <div>
                            <label
                                class="block text-xs font-medium text-secondary mb-1.5"
                            >
                                Justificativa da avaliação
                            </label>
                            <textarea
                                v-model="texto"
                                rows="5"
                                placeholder="Descreva o motivo da reprovação..."
                                class="w-full bg-[#0E0E15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5"
                    >
                        <button
                            @click="$emit('close')"
                            class="px-4 py-2 rounded-lg text-sm text-secondary hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="confirmar"
                            :disabled="!texto.trim()"
                            class="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirmar Reprovação
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
    isOpen: boolean;
    nomeAluno: string;
}>();

const emit = defineEmits<{
    close: [];
    confirm: [texto: string];
}>();

const texto = ref("");

const confirmar = () => {
    const trimmed = texto.value.trim();
    if (!trimmed) return;
    emit("confirm", trimmed);
};

watch(
    () => props.isOpen,
    (val) => {
        if (val) {
            texto.value = "";
        }
    }
);
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
