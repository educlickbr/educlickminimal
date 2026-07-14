<template>
    <div
        v-if="show"
        class="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
        @click.self="$emit('close')"
    >
        <div
            class="w-full max-w-xl rounded-2xl border border-white/10 bg-[#11131a] shadow-2xl overflow-hidden"
        >
            <div
                class="flex items-center justify-between px-5 py-4 border-b border-white/10"
            >
                <div>
                    <h3 class="text-white font-black text-lg">
                        Escolha o Nome de Exibição
                    </h3>
                    <p class="text-sm text-secondary mt-1">
                        Selecione como deseja que o nome apareça no certificado
                        impresso.
                    </p>
                </div>
                <button
                    class="w-8 h-8 rounded-full bg-white/5 text-secondary hover:bg-white/10 hover:text-white transition-colors"
                    @click="$emit('close')"
                >
                    <svg
                        class="w-4 h-4 mx-auto"
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

            <div class="p-5 space-y-3">
                <div
                    v-if="loading"
                    class="py-10 text-center text-secondary text-sm"
                >
                    Carregando opções de nome...
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="opcao in options"
                        :key="opcao.tipo"
                        class="rounded-xl border p-4"
                        :class="
                            opcao.disponivel
                                ? 'border-white/10 bg-white/5'
                                : 'border-white/5 bg-white/[0.03] opacity-60'
                        "
                    >
                        <div
                            class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                        >
                            <div>
                                <p
                                    class="text-xs font-black uppercase tracking-wider text-secondary"
                                >
                                    {{ opcao.label }}
                                </p>
                                <p
                                    class="text-white text-base mt-1 break-words"
                                >
                                    {{ opcao.valor || "Não informado" }}
                                </p>
                            </div>
                            <button
                                class="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors"
                                :class="
                                    opcao.disponivel
                                        ? 'bg-primary text-white hover:brightness-110'
                                        : 'bg-white/5 text-secondary cursor-not-allowed'
                                "
                                :disabled="!opcao.disponivel"
                                @click="$emit('confirm', opcao)"
                            >
                                Usar {{ opcao.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    show: boolean;
    loading: boolean;
    options: any[];
}>();

defineEmits<{
    close: [];
    confirm: [opcao: any];
}>();
</script>
