<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 group hover:shadow-lg hover:shadow-primary/5"
    >
        <div
            class="p-4 md:p-6 flex flex-col md:flex-row gap-1 md:gap-4 md:items-start justify-between relative"
        >
            <div class="flex items-start gap-4 flex-1">
                <!-- Icons Column -->
                <div class="flex flex-col gap-2 shrink-0">
                    <button
                        v-if="oportunidade.arquivo_url"
                        @click.stop="downloadFile(oportunidade)"
                        class="text-primary hover:text-white transition-all hover:scale-110 shrink-0 opacity-80 group-hover:opacity-100 p-1"
                        title="Baixar Arquivo"
                    >
                        <svg
                            class="w-8 h-8"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            ></path>
                        </svg>
                    </button>
                    <a
                        v-if="oportunidade.link"
                        :href="oportunidade.link"
                        target="_blank"
                        @click.stop
                        class="text-blue-400 hover:text-white transition-all hover:scale-110 shrink-0 opacity-80 group-hover:opacity-100 p-1"
                        title="Acessar Link Externo"
                    >
                        <svg
                            class="w-8 h-8"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            ></path>
                        </svg>
                    </a>
                </div>

                <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span
                            class="text-[10px] font-black text-secondary/50 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-white/5"
                        >
                            {{ oportunidade.ano_semestre }}
                        </span>
                    </div>
                    <h3
                        class="text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug"
                    >
                        {{ oportunidade.titulo }}
                    </h3>
                    <p
                        class="text-xs md:text-sm text-secondary line-clamp-3 md:line-clamp-none whitespace-pre-line"
                    >
                        {{ oportunidade.descricao }}
                    </p>
                </div>
            </div>

            <div
                class="flex items-center gap-4 md:gap-6 shrink-0 justify-end w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5 md:border-transparent"
            >
                <div class="text-left md:text-right w-full md:w-auto">
                    <div
                        class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-0.5 opacity-50"
                    >
                        Período
                    </div>
                    <div class="text-xs text-white font-medium">
                        <span v-if="oportunidade.exibir_periodo">
                            {{ formatDate(oportunidade.data_inicio) }}
                            -
                            {{ formatDate(oportunidade.data_fim) }}
                        </span>
                        <span v-else class="text-secondary/50 italic"
                            >Não divulgado</span
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    oportunidade: any;
    downloadFile: (item: any) => Promise<void>;
    formatDate: (date: string) => string;
}>();
</script>
