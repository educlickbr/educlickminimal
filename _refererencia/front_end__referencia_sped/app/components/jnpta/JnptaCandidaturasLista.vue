<script setup lang="ts">
import { ref } from "vue";
import { getAnoSemestre } from "../../../utils/ano_semestre";

const props = defineProps<{
    candidaturas: any[];
    candidaturasFilters: {
        anoSemestre: any;
        qualTempo: any;
        incluirRascunhos: any;
    };
    getNomeExibicao: (item: any) => string;
    getSubtitulo: (item: any) => string;
    getTempoLabel: (qualTempo?: string | null) => string;
    getStatusLabel: (status: string) => string;
}>();

const emit = defineEmits<{
    (e: "abrir-detalhes", item: any): void;
    (
        e: "alterar-status",
        payload: { item: any; status: "aprovada" | "reprovada" | "suplente" },
    ): void;
    (e: "change-filters"): void;
}>();

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        rascunho: "text-gray-400 bg-gray-500/10",
        enviada: "text-blue-400 bg-blue-500/10",
        em_analise: "text-yellow-400 bg-yellow-500/10",
        aprovada: "text-green-400 bg-green-500/10",
        reprovada: "text-red-400 bg-red-500/10",
        suplente: "text-purple-400 bg-purple-500/10",
    };
    return colors[status] || "text-secondary bg-white/5";
};

const updatingStatusId = ref<string | null>(null);

const handleStatus = async (
    item: any,
    status: "aprovada" | "reprovada" | "suplente",
) => {
    const id = item?.id_candidatura || item?.id;
    if (!id) return;
    updatingStatusId.value = id;
    emit("alterar-status", { item, status });
    // Reseta após pequeno delay para feedback visual
    setTimeout(() => {
        updatingStatusId.value = null;
    }, 800);
};
</script>

<template>
    <div class="space-y-6">
        <!-- Filtros -->
        <div
            class="bg-div-15 rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-end"
        >
            <div class="flex-1 space-y-1">
                <label
                    class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                >
                    Ano/Semestre
                </label>
                <select
                    v-model="candidaturasFilters.anoSemestre.value"
                    @change="emit('change-filters')"
                    class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg p-2.5 outline-none cursor-pointer"
                >
                    <option value="todos">Todos</option>
                    <option :value="getAnoSemestre(undefined, -1)">
                        {{ getAnoSemestre(undefined, -1) }} (Anterior)
                    </option>
                    <option :value="getAnoSemestre()">
                        {{ getAnoSemestre() }} (Atual)
                    </option>
                    <option :value="getAnoSemestre(undefined, 1)">
                        {{ getAnoSemestre(undefined, 1) }} (Próximo)
                    </option>
                </select>
            </div>
            <div class="flex-1 space-y-1">
                <label
                    class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                >
                    Tempo
                </label>
                <select
                    v-model="candidaturasFilters.qualTempo.value"
                    @change="emit('change-filters')"
                    class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg p-2.5 outline-none cursor-pointer"
                >
                    <option value="todos">Todos</option>
                    <option value="primeiro_tempo">Primeiro Tempo</option>
                    <option value="segundo_tempo">Segundo Tempo</option>
                </select>
            </div>
            <label
                class="flex items-center gap-2 cursor-pointer text-xs text-secondary hover:text-white transition-colors shrink-0"
            >
                <input
                    v-model="candidaturasFilters.incluirRascunhos.value"
                    @change="emit('change-filters')"
                    type="checkbox"
                    class="rounded bg-[#16161E] border border-secondary/30 text-primary focus:ring-primary focus:ring-1"
                />
                Incluir rascunhos
            </label>
        </div>

        <!-- Loading -->
        <div
            v-if="candidaturas.length === 0"
            class="flex flex-col items-center justify-center py-20 opacity-50 border-2 border-dashed border-white/5 rounded-xl"
        >
            <div
                class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"
            >
                <svg
                    class="w-8 h-8 text-secondary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
            <p class="text-white font-bold">Nenhuma candidatura encontrada.</p>
            <p class="text-xs text-secondary mt-1">
                Tente ajustar os filtros ou aguarde novas inscrições.
            </p>
        </div>

        <!-- Lista -->
        <div v-else class="flex flex-col gap-4">
            <div
                v-for="item in candidaturas"
                :key="item.id_candidatura || item.id"
                class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 p-4 md:p-6"
            >
                <div
                    class="flex flex-col md:flex-row gap-4 md:items-start justify-between"
                >
                    <div class="space-y-2 flex-1 min-w-0">
                        <!-- Tags -->
                        <div class="flex items-center gap-2 flex-wrap">
                            <span
                                class="text-[10px] font-black uppercase tracking-widest border border-primary/20 px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                            >
                                {{ getTempoLabel(item.qual_tempo) }}
                            </span>
                            <span
                                class="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                :class="getStatusColor(item.status)"
                            >
                                {{ getStatusLabel(item.status) }}
                            </span>
                            <span
                                v-if="item.ano_semestre"
                                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-white/5"
                            >
                                {{ item.ano_semestre }}
                            </span>
                            <span
                                v-if="item.id_candidatura"
                                class="text-[10px] text-secondary/40 font-mono"
                            >
                                #{{ item.id_candidatura }}
                            </span>
                        </div>

                        <!-- Nome -->
                        <h3
                            class="text-base md:text-lg font-bold text-white truncate"
                        >
                            {{ getNomeExibicao(item) }}
                        </h3>

                        <!-- Subtítulo -->
                        <p class="text-xs md:text-sm text-secondary truncate">
                            {{ getSubtitulo(item) }}
                        </p>

                        <!-- Integrantes (segundo tempo) -->
                        <div
                            v-if="
                                item.qual_tempo === 'segundo_tempo' &&
                                Array.isArray(item.integrantes) &&
                                item.integrantes.length > 0
                            "
                            class="flex flex-wrap gap-1 mt-1"
                        >
                            <span
                                v-for="(
                                    integrante, i
                                ) in item.integrantes.slice(0, 3)"
                                :key="i"
                                class="text-[10px] bg-white/5 text-secondary px-1.5 py-0.5 rounded"
                            >
                                {{
                                    [integrante.nome, integrante.sobrenome]
                                        .filter(Boolean)
                                        .join(" ")
                                }}
                            </span>
                            <span
                                v-if="item.integrantes.length > 3"
                                class="text-[10px] text-secondary/50"
                            >
                                +{{ item.integrantes.length - 3 }}
                            </span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 shrink-0">
                        <!-- Ver detalhes -->
                        <button
                            @click="emit('abrir-detalhes', item)"
                            class="text-xs font-bold text-primary hover:text-primary-hover transition-colors px-3 py-1.5 rounded-md border border-primary/20 hover:bg-primary/10"
                            title="Ver detalhes"
                        >
                            Detalhes
                        </button>

                        <!-- Aprovar -->
                        <button
                            v-if="
                                item.status === 'enviada' ||
                                item.status === 'em_analise'
                            "
                            @click="handleStatus(item, 'aprovada')"
                            :disabled="
                                updatingStatusId ===
                                (item.id_candidatura || item.id)
                            "
                            class="text-xs font-bold text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 rounded-md border border-green-500/20 hover:bg-green-500/10 disabled:opacity-40"
                        >
                            <svg
                                v-if="
                                    updatingStatusId ===
                                    (item.id_candidatura || item.id)
                                "
                                class="w-3.5 h-3.5 animate-spin"
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
                            <span v-else>Aprovar</span>
                        </button>

                        <!-- Menu de ações (reprovar/suplente) -->
                        <div
                            v-if="
                                item.status === 'enviada' ||
                                item.status === 'em_analise'
                            "
                            class="relative group"
                        >
                            <button
                                class="text-secondary hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5"
                                title="Mais ações"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    stroke-width="2"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M12 5v.01M12 12v.01M12 19v.01"
                                    />
                                </svg>
                            </button>
                            <div
                                class="absolute right-0 top-full mt-1 z-20 bg-[#1A1A24] border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px] hidden group-hover:block"
                            >
                                <button
                                    @click="handleStatus(item, 'reprovada')"
                                    class="w-full text-left text-xs text-red-400 hover:bg-red-500/10 px-3 py-2 transition-colors"
                                >
                                    Reprovar
                                </button>
                                <button
                                    @click="handleStatus(item, 'suplente')"
                                    class="w-full text-left text-xs text-purple-400 hover:bg-purple-500/10 px-3 py-2 transition-colors"
                                >
                                    Suplente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
