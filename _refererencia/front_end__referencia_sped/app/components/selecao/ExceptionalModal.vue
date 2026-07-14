<script setup lang="ts">
const props = defineProps<{
    isOpen: boolean;
    candidatoNome: string;
}>();

const emit = defineEmits<{
    confirm: [dtIniMatSup: string, dtFimMatSup: string];
    cancel: [];
}>();

const dtIniMatSup = ref("");
const dtFimMatSup = ref("");

watch(
    () => props.isOpen,
    (val) => {
        if (val) {
            dtIniMatSup.value = "";
            dtFimMatSup.value = "";
        }
    },
);
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
                            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/10"
                        >
                            <svg
                                class="w-6 h-6 text-blue-500"
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
                            Matrícula Excepcional
                        </h3>
                    </div>

                    <div class="mt-2 mb-4">
                        <p class="text-sm text-secondary-300">
                            Configure uma janela excepcional de matrícula para
                            <strong>{{ candidatoNome }}</strong>, sobrepondo as
                            datas da turma.
                        </p>
                    </div>

                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    class="block text-xs text-secondary-600 mb-1.5"
                                    >Data Início</label
                                >
                                <input
                                    v-model="dtIniMatSup"
                                    type="datetime-local"
                                    class="w-full bg-[#16161E] border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-3"
                                />
                            </div>
                            <div>
                                <label
                                    class="block text-xs text-secondary-600 mb-1.5"
                                    >Data Fim</label
                                >
                                <input
                                    v-model="dtFimMatSup"
                                    type="datetime-local"
                                    class="w-full bg-[#16161E] border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-3"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 flex gap-3 justify-end">
                        <button
                            type="button"
                            class="inline-flex justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                            @click="emit('cancel')"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            class="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
                            @click="emit('confirm', dtIniMatSup, dtFimMatSup)"
                        >
                            Autorizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
