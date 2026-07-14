<script setup lang="ts">
const isVisible = ref(true);

const close = () => {
    isVisible.value = false;
};
</script>

<template>
    <Teleport to="body">
        <Transition name="popup">
            <div
                v-if="isVisible"
                class="fixed inset-0 z-[350] flex items-center justify-center p-4 sm:p-6"
            >
                <!-- Backdrop -->
                <div
                    class="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    @click="close"
                ></div>

                <!-- Card -->
                <div
                    class="relative z-10 bg-[#1A1A24] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                >
                    <!-- Accent bar -->
                    <div
                        class="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary/60"
                    ></div>

                    <div class="p-6 sm:p-8">
                        <!-- Close button -->
                        <button
                            @click="close"
                            class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            aria-label="Fechar"
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

                        <!-- Icon -->
                        <div class="mb-5 flex justify-center">
                            <div
                                class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"
                            >
                                <svg
                                    class="w-7 h-7"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.5"
                                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <!-- Title -->
                        <h2
                            class="text-xl font-bold text-white text-center mb-3"
                        >
                            Olá, Estudante!
                        </h2>

                        <!-- Message -->
                        <p
                            class="text-[15px] text-white/70 text-center leading-relaxed mb-4"
                        >
                            Informamos que, na aba
                            <strong class="text-white">Oportunidades</strong>,
                            você pode encontrar editais, audições, chamamentos e
                            diversas outras possibilidades de inserção
                            profissional na área artística.
                        </p>
                        <p
                            class="text-[15px] text-white/70 text-center leading-relaxed mb-6"
                        >
                            Acesse a aba e confira as oportunidades disponíveis!
                        </p>

                        <!-- Signature -->
                        <p
                            class="text-xs text-white/40 text-center uppercase tracking-wider font-bold mb-6"
                        >
                            Atenciosamente,<br />Secretaria Educacional
                        </p>

                        <!-- Action buttons -->
                        <div class="flex items-center gap-3">
                            <button
                                @click="close"
                                class="flex-1 px-4 py-3 rounded-lg border border-white/10 text-sm font-bold uppercase tracking-wider text-secondary hover:bg-white/5 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                @click="close"
                                class="flex-1 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-wider text-white transition-colors"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
    transition: all 0.25s ease;
}
.popup-enter-from,
.popup-leave-to {
    opacity: 0;
}
.popup-enter-from > div:last-child,
.popup-leave-to > div:last-child {
    transform: scale(0.95);
    opacity: 0;
}
</style>
