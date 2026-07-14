<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
    >
        <div
            class="flex flex-col md:flex-row justify-between md:items-center gap-4"
        >
            <div class="space-y-1">
                <div
                    class="flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2"
                >
                    <!-- Status Badge -->
                    <span
                        class="text-xs font-bold px-2 py-0.5 rounded"
                        :class="{
                            'bg-green-500/20 text-green-400':
                                item.aprovado === true,
                            'bg-red-500/20 text-red-400':
                                item.aprovado === false,
                            'bg-yellow-500/20 text-yellow-400':
                                item.aprovado === null ||
                                item.aprovado === undefined,
                        }"
                    >
                        {{
                            item.aprovado === true
                                ? "Aprovado"
                                : item.aprovado === false
                                  ? "Reprovado"
                                  : "Aguardando Aprovação"
                        }}
                    </span>
                    <span class="text-xs text-secondary">
                        Solicitado em {{ formatDate(item.criado_em) }}
                    </span>
                </div>

                <h4 class="font-bold text-white text-lg">
                    {{ item.cod_turma }} - {{ item.nome_curso }}
                </h4>
                <p class="text-sm text-secondary">
                    {{ item.ano_semestre }} | {{ item.turno }}
                </p>
            </div>

            <div class="flex items-center gap-2">
                <button
                    @click.prevent="$emit('open-name-choice', item, 'public')"
                    :disabled="item.aprovado !== true"
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :title="
                        item.aprovado === true
                            ? 'Abrir Página Pública'
                            : 'Disponível somente para declarações aprovadas'
                    "
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
                            stroke-width="1.8"
                            d="M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5zm12 1h1m2 0h1m-5 2h5m-3-3v5"
                        />
                    </svg>
                </button>
                <button
                    @click.prevent="$emit('open-name-choice', item, 'print')"
                    :disabled="item.aprovado !== true"
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :title="
                        item.aprovado === true
                            ? 'Imprimir Declaração'
                            : 'Disponível somente para declarações aprovadas'
                    "
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
                            stroke-width="1.5"
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    item: any;
    formatDate: (date: string) => string;
}>();

defineEmits<{
    "open-name-choice": [item: any, action: "print" | "public"];
}>();
</script>
