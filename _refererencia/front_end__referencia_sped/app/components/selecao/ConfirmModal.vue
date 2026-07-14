<script setup lang="ts">
defineProps<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "danger";
    isLoading: boolean;
}>();

const emit = defineEmits<{
    confirm: [];
    cancel: [];
}>();
</script>

<template>
    <div
        v-if="isOpen"
        class="relative z-50"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        ></div>

        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div
                class="flex min-h-full items-center justify-center p-4 text-center sm:p-0"
            >
                <div
                    class="relative transform overflow-hidden rounded-2xl bg-[#16161E] border border-white/10 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6"
                >
                    <div class="flex items-center gap-4 mb-4">
                        <div
                            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            :class="
                                type === 'danger'
                                    ? 'bg-red-500/10'
                                    : 'bg-emerald-500/10'
                            "
                        >
                            <svg
                                v-if="type === 'danger'"
                                class="w-6 h-6 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                ></path>
                            </svg>
                            <svg
                                v-else
                                class="w-6 h-6 text-emerald-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-bold text-white leading-6">
                            {{ title }}
                        </h3>
                    </div>

                    <div class="mt-2">
                        <p
                            class="text-sm text-secondary-300"
                            v-html="message"
                        ></p>
                    </div>

                    <div class="mt-6 flex gap-3 justify-end">
                        <button
                            type="button"
                            class="inline-flex justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                            @click="emit('cancel')"
                            :disabled="isLoading"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            class="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            :class="
                                type === 'danger'
                                    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                                    : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500'
                            "
                            @click="emit('confirm')"
                            :disabled="isLoading"
                        >
                            <svg
                                v-if="isLoading"
                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            {{
                                type === "danger"
                                    ? "Sim, remover"
                                    : "Sim, matricular"
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
