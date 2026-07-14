<script setup lang="ts">
import BaseSelect from "../BaseSelect.vue";

interface Filtros {
    pcd: string | null;
    laudo: boolean | null;
    deferimento: string | null;
    data_inscricao_inicio: string;
    data_inscricao_fim: string;
}

defineProps<{
    turmas: any[];
    semestreOptions: { label: string; value: string }[];
    pcdOptions: { label: string; value: string | null }[];
    laudoOptions: { label: string; value: boolean | null }[];
    deferimentoOptions: { label: string; value: string | null }[];
    deferimentoDesabilitado: boolean;
}>();

const emit = defineEmits<{
    "clear-filters": [];
}>();

const anoSemestre = defineModel<string>("anoSemestre", { required: true });
const turmaId = defineModel<string | null>("turmaId");
const busca = defineModel<string>("busca", { required: true });
const ordenarPor = defineModel<"nome_completo" | "created_at">("ordenarPor", {
    required: true,
});
const ordenarDirecao = defineModel<"ASC" | "DESC">("ordenarDirecao", {
    required: true,
});
const filtros = defineModel<Filtros>("filtros", { required: true });

const showFilters = ref(false);

const hasActiveFilters = computed(
    () =>
        !!(
            filtros.value.pcd ||
            filtros.value.laudo !== null ||
            filtros.value.deferimento ||
            filtros.value.data_inscricao_inicio ||
            filtros.value.data_inscricao_fim
        ),
);

const pcdProxy = computed({
    get: () => filtros.value.pcd,
    set: (v) => {
        filtros.value = { ...filtros.value, pcd: v };
    },
});
const laudoProxy = computed({
    get: () => filtros.value.laudo,
    set: (v) => {
        filtros.value = { ...filtros.value, laudo: v };
    },
});
const deferimentoProxy = computed({
    get: () => filtros.value.deferimento,
    set: (v) => {
        filtros.value = { ...filtros.value, deferimento: v };
    },
});
const dataInicioProxy = computed({
    get: () => filtros.value.data_inscricao_inicio,
    set: (v) => {
        filtros.value = { ...filtros.value, data_inscricao_inicio: v };
    },
});
const dataFimProxy = computed({
    get: () => filtros.value.data_inscricao_fim,
    set: (v) => {
        filtros.value = { ...filtros.value, data_inscricao_fim: v };
    },
});

const toggleSortDirection = () => {
    ordenarDirecao.value = ordenarDirecao.value === "ASC" ? "DESC" : "ASC";
};
</script>

<template>
    <div class="bg-div-15 rounded-xl p-4 md:p-6 mb-6 border border-secondary/5">
        <!-- FILTERS -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <!-- Semestre -->
            <div>
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >Período</label
                >
                <BaseSelect
                    v-model="anoSemestre"
                    :options="semestreOptions"
                    label-key="label"
                    value-key="value"
                />
            </div>

            <!-- Turma -->
            <div>
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >Turma</label
                >
                <BaseSelect
                    v-model="turmaId"
                    :options="turmas"
                    label-key="nome_curso_turno"
                    value-key="id_turma"
                    placeholder="Selecione uma turma..."
                />
            </div>
        </div>

        <!-- SEARCH & SORT & FILTER TOGGLE -->
        <div class="flex flex-col md:flex-row gap-3 items-end">
            <!-- Search -->
            <div class="flex-grow w-full md:w-auto">
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >Buscar por nome</label
                >
                <input
                    v-model="busca"
                    @blur="busca = busca.trim()"
                    type="text"
                    placeholder="Digite o nome do candidato..."
                    class="w-full bg-[#16161E] border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-3 placeholder:text-gray-600"
                />
            </div>

            <!-- Sort -->
            <div class="flex-shrink-0">
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >Ordenar por</label
                >
                <div
                    class="flex items-center gap-1.5 bg-[#16161E] border border-white/10 rounded-lg px-3 h-12"
                >
                    <div class="flex gap-3">
                        <label
                            class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            <input
                                type="radio"
                                v-model="ordenarPor"
                                value="nome_completo"
                                class="w-3.5 h-3.5 m-0 text-primary bg-transparent border-gray-600 focus:ring-primary focus:ring-offset-0"
                            />
                            <span>Nome</span>
                        </label>
                        <label
                            class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            <input
                                type="radio"
                                v-model="ordenarPor"
                                value="created_at"
                                class="w-3.5 h-3.5 m-0 text-primary bg-transparent border-gray-600 focus:ring-primary focus:ring-offset-0"
                            />
                            <span>Data</span>
                        </label>
                    </div>

                    <div class="w-px h-4 bg-white/10"></div>

                    <button
                        @click="toggleSortDirection"
                        class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        :title="
                            ordenarDirecao === 'ASC'
                                ? 'Ordem Crescente'
                                : 'Ordem Decrescente'
                        "
                    >
                        <svg
                            v-if="ordenarDirecao === 'ASC'"
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                            ></path>
                        </svg>
                        <svg
                            v-else
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                            ></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Filter Toggle Button -->
            <button
                @click="showFilters = !showFilters"
                class="relative h-12 px-4 rounded-lg flex items-center gap-2 border transition-colors shrink-0"
                :class="
                    showFilters || hasActiveFilters
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-[#16161E] border-white/10 text-gray-400 hover:text-white'
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
                        stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    ></path>
                </svg>
                <span
                    v-if="hasActiveFilters"
                    class="absolute top-[-4px] right-[-4px] w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-[#0F0F13]"
                ></span>
            </button>
        </div>

        <!-- EXPANDABLE FILTER PANEL -->
        <div
            v-show="showFilters"
            class="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-6 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <!-- PCD -->
            <div>
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >PCD</label
                >
                <BaseSelect
                    v-model="pcdProxy"
                    :options="pcdOptions"
                    label-key="label"
                    value-key="value"
                />
            </div>

            <!-- Laudo -->
            <div>
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >Laudo Médico</label
                >
                <BaseSelect
                    v-model="laudoProxy"
                    :options="laudoOptions"
                    label-key="label"
                    value-key="value"
                />
            </div>

            <!-- Deferimento -->
            <div>
                <label
                    class="block text-xs text-secondary-600 mb-1.5"
                    :class="{ 'opacity-50': deferimentoDesabilitado }"
                    >Deferimento</label
                >
                <BaseSelect
                    v-model="deferimentoProxy"
                    :options="deferimentoOptions"
                    label-key="label"
                    value-key="value"
                    :disabled="deferimentoDesabilitado"
                />
            </div>

            <div>
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >Inscrição - Início</label
                >
                <input
                    v-model="dataInicioProxy"
                    type="date"
                    class="w-full bg-[#16161E] border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-3"
                />
            </div>

            <div>
                <label class="block text-xs text-secondary-600 mb-1.5"
                    >Inscrição - Fim</label
                >
                <input
                    v-model="dataFimProxy"
                    type="date"
                    class="w-full bg-[#16161E] border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary p-3"
                />
            </div>

            <!-- Clear Button -->
            <div
                v-if="hasActiveFilters"
                class="flex justify-end md:justify-start"
            >
                <button
                    @click="emit('clear-filters')"
                    class="h-[42px] px-4 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                    <svg
                        class="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>
                    Limpar Filtros
                </button>
            </div>
        </div>
    </div>
</template>
