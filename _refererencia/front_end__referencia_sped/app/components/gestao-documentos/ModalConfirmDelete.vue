<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div
                    class="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    @click="$emit('close')"
                />
                <div
                    class="relative bg-[#16161E] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl p-6"
                >
                    <div class="flex flex-col items-center text-center gap-4">
                        <div
                            class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center"
                        >
                            <svg
                                class="w-6 h-6 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3
                                class="text-base font-black text-white uppercase tracking-wider"
                            >
                                Remover Documento
                            </h3>
                            <p class="text-sm text-secondary mt-1">
                                Tem certeza que deseja remover <br />
                                <span class="text-white font-semibold">{{
                                    documentName
                                }}</span
                                >?
                            </p>
                            <p class="text-[11px] text-red-400/70 mt-2">
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div class="flex gap-3 w-full">
                            <button
                                @click="$emit('close')"
                                class="flex-1 px-4 py-2 text-sm text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                @click="$emit('confirm')"
                                :disabled="isDeleting"
                                class="flex-1 px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg
                                    v-if="isDeleting"
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
                                    isDeleting ? "Removendo..." : "Sim, remover"
                                }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
    documentName: {
        type: String,
        required: true,
    },
    isDeleting: {
        type: Boolean,
        default: false,
    },
});

defineEmits(["close", "confirm"]);
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
