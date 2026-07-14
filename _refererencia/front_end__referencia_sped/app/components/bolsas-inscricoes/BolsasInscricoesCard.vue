<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 group"
    >
        <!-- CARD HEADER -->
        <div
            class="p-5 md:p-6 flex flex-col gap-2 cursor-pointer relative"
            @click="$emit('toggle-expand', edital.id)"
        >
            <div class="flex flex-row items-start gap-4">
                <!-- Download Icon -->
                <button
                    v-if="edital.arquivo_url"
                    @click.stop="downloadFile(edital)"
                    class="mt-1 text-primary hover:text-white transition-all hover:scale-110 shrink-0 opacity-80 group-hover:opacity-100 flex flex-col items-center gap-0.5"
                    title="Baixar Edital"
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"
                        ></path>
                    </svg>
                    <span
                        class="text-[9px] text-secondary/40 group-hover:text-primary/60 transition-colors"
                        >Abrir arquivo</span
                    >
                </button>

                <!-- Content -->
                <div class="flex-1 min-w-0 flex flex-col gap-1 pr-4 md:pr-0">
                    <h3
                        class="text-base md:text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors"
                    >
                        {{ edital.titulo }}
                    </h3>

                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                        <!-- Badge Ano/Semestre -->
                        <span
                            class="text-[10px] font-black text-secondary/50 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-white/5"
                        >
                            {{ edital.ano_semestre }}
                        </span>

                        <!-- Status Badge -->
                        <span
                            class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border"
                            :class="{
                                'text-green-400 bg-green-400/10 border-green-400/20':
                                    edital.status_inscricao === 'Aberto',
                                'text-red-400 bg-red-400/10 border-red-400/20':
                                    edital.status_inscricao === 'Encerrado',
                                'text-yellow-400 bg-yellow-400/10 border-yellow-400/20':
                                    edital.status_inscricao === 'Em Breve',
                            }"
                        >
                            {{
                                edital.status_inscricao === "Aberto"
                                    ? "Inscrições Abertas"
                                    : edital.status_inscricao === "Encerrado"
                                      ? "Inscrições Encerradas"
                                      : "Em Breve"
                            }}
                        </span>

                        <!-- Badge Inscrito -->
                        <span
                            v-if="edital.ja_inscrito"
                            class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border text-purple-400 bg-purple-400/10 border-purple-400/20"
                        >
                            Inscrito
                        </span>

                        <!-- Date -->
                        <div
                            class="text-[10px] md:text-xs text-secondary font-medium flex items-center gap-1.5 ml-0 md:ml-1 mt-1 md:mt-0 w-full md:w-auto"
                        >
                            <svg
                                class="w-3.5 h-3.5 opacity-50 shrink-0"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                ></path>
                            </svg>
                            <span v-if="edital.exibir_periodo">
                                {{ formatDate(edital.data_inicio) }}
                                -
                                {{ formatDate(edital.data_fim) }}
                            </span>
                            <span v-else class="italic opacity-50"
                                >Consulte o edital</span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end mt-4 md:mt-2">
                <div
                    class="flex items-center gap-2 w-full md:w-auto"
                    @click.stop
                >
                    <button
                        v-if="
                            edital.status_inscricao === 'Aberto' &&
                            !edital.ja_inscrito
                        "
                        @click="$emit('inscrever', edital)"
                        class="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 md:py-2 px-6 rounded-md flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 uppercase tracking-wider flex-1 md:flex-none"
                    >
                        Inscrever-se
                    </button>
                    <button
                        v-else-if="
                            edital.status_inscricao === 'Aberto' &&
                            edital.ja_inscrito
                        "
                        disabled
                        class="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold py-2.5 md:py-2 px-6 rounded-md flex items-center justify-center gap-2 uppercase tracking-wider flex-1 md:flex-none cursor-not-allowed"
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
                                d="M5 13l4 4L19 7"
                            ></path>
                        </svg>
                        Inscrito
                    </button>
                    <button
                        v-else-if="edital.status_inscricao === 'Encerrado'"
                        @click="$emit('toggle-expand', edital.id)"
                        class="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold py-2.5 md:py-2 px-6 rounded-md flex items-center justify-center gap-2 transition-all uppercase tracking-wider flex-1 md:flex-none"
                        :class="isExpanded ? 'bg-white/10' : ''"
                    >
                        <span>Etapas e Resultados</span>
                        <svg
                            class="w-4 h-4 transition-transform duration-300 ml-1"
                            :class="isExpanded ? 'rotate-180' : ''"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>
                    <button
                        v-else
                        disabled
                        class="bg-white/5 border border-white/10 text-secondary/50 text-xs font-bold py-2.5 md:py-2 px-6 rounded-md flex items-center justify-center gap-2 uppercase tracking-wider flex-1 md:flex-none cursor-not-allowed"
                    >
                        Em Breve
                    </button>
                    <button
                        v-if="edital.status_inscricao !== 'Encerrado'"
                        class="p-2 bg-white/5 rounded-md text-secondary hover:text-white hover:bg-white/10 transition-all border border-white/5 shrink-0"
                        :class="isExpanded ? 'bg-white/10 text-white' : ''"
                        @click="$emit('toggle-expand', edital.id)"
                    >
                        <svg
                            class="w-4 h-4 transition-transform duration-300"
                            :class="isExpanded ? 'rotate-180' : ''"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- CARD BODY (ETAPAS) -->
        <div
            v-show="isExpanded"
            class="border-t border-white/5 bg-black/20 p-5 animate-in slide-in-from-top-2 duration-200"
        >
            <div class="flex items-center justify-between mb-4">
                <h4
                    class="text-sm font-bold text-white flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        ></path>
                    </svg>
                    Cronograma de Etapas
                </h4>
            </div>

            <div class="space-y-2">
                <div
                    v-for="etapa in getSortedEtapas(edital)"
                    :key="etapa.id"
                    class="flex items-center justify-between bg-[#1f2029] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                >
                    <div class="flex items-start gap-4 w-full">
                        <!-- Left: Icon + Ordem -->
                        <div
                            class="flex flex-col items-center gap-1.5 shrink-0"
                        >
                            <button
                                v-if="etapa.arquivo_url"
                                @click.stop="downloadFile(etapa)"
                                class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 hover:scale-105"
                                title="Baixar Arquivo"
                            >
                                <svg
                                    class="w-6 h-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    ></path>
                                </svg>
                            </button>
                            <span
                                v-if="etapa.arquivo_url"
                                class="text-[8px] text-secondary/30 text-center leading-tight"
                                >Abrir<br />arquivo</span
                            >
                            <div
                                v-else
                                class="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 text-secondary/30"
                            >
                                <svg
                                    class="w-6 h-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    ></path>
                                </svg>
                            </div>
                            <span
                                class="text-[10px] font-black text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/5"
                                >#{{ etapa.ordem }}</span
                            >
                        </div>

                        <!-- Right: Content -->
                        <div class="flex-1 min-w-0 flex flex-col gap-1.5 pt-1">
                            <h5
                                class="text-sm font-bold text-white leading-snug"
                            >
                                {{ etapa.titulo }}
                            </h5>
                            <div class="mt-0.5">
                                <span
                                    class="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block border border-white/5"
                                    :class="[
                                        getEtapaStatus(etapa).bg,
                                        getEtapaStatus(etapa).color,
                                    ]"
                                >
                                    {{ getEtapaStatus(etapa).label }}
                                </span>
                            </div>
                            <p class="text-[10px] text-secondary mt-1">
                                <span v-if="etapa.exibir_periodo">
                                    {{ formatDate(etapa.data_inicio) }}
                                    -
                                    {{ formatDate(etapa.data_fim) }}
                                </span>
                                <span v-else class="italic opacity-50"
                                    >Consulte o edital</span
                                >
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    v-if="!edital.etapas || edital.etapas.length === 0"
                    class="text-center py-4 text-xs text-secondary/40 italic"
                >
                    Nenhuma etapa publicada.
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    edital: any;
    isExpanded: boolean;
    downloadFile: (item: any) => Promise<void>;
    formatDate: (date: string) => string;
    getEtapaStatus: (etapa: any) => {
        label: string;
        color: string;
        bg: string;
    };
    getSortedEtapas: (edital: any) => any[];
}>();

defineEmits<{
    "toggle-expand": [id: string];
    inscrever: [edital: any];
}>();
</script>
