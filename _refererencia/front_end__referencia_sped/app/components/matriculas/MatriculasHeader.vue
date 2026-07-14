<script setup lang="ts">
import { getAnoSemestre } from "~~/utils/ano_semestre";

const activeTab = defineModel<string>("activeTab", { default: "alunos" });
const anoSemestre = defineModel<string>("anoSemestre", {
    default: () => getAnoSemestre(),
});

defineProps<{
    turmas: any[];
    areas: { label: string; value: string }[];
    isLoading: boolean;
}>();

const filters = defineModel<any>("filters", { required: true });
</script>

<template>
    <!-- HEADER / TABS -->
    <div
        class="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
    >
        <!-- Tabs -->
        <div
            class="flex items-center gap-6 border-b border-secondary/10 w-full md:w-auto pb-1 overflow-x-auto no-scrollbar"
        >
            <button
                @click="activeTab = 'alunos'"
                class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                :class="
                    activeTab === 'alunos'
                        ? 'text-primary'
                        : 'text-secondary hover:text-white'
                "
            >
                Alunos
                <span
                    v-if="activeTab === 'alunos'"
                    class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                ></span>
            </button>
            <button
                @click="activeTab = 'declaracao'"
                class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                :class="
                    activeTab === 'declaracao'
                        ? 'text-primary'
                        : 'text-secondary hover:text-white'
                "
            >
                Declaração de Matrícula
                <span
                    v-if="activeTab === 'declaracao'"
                    class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                ></span>
            </button>
            <button
                @click="activeTab = 'atestado'"
                class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                :class="
                    activeTab === 'atestado'
                        ? 'text-primary'
                        : 'text-secondary hover:text-white'
                "
            >
                Atestado/Justificativa
                <span
                    v-if="activeTab === 'atestado'"
                    class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                ></span>
            </button>
        </div>

        <!-- Global Year Select -->
        <div class="relative w-full md:w-48">
            <select
                v-model="anoSemestre"
                class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
            >
                <option :value="getAnoSemestre(undefined, -1)">
                    {{ getAnoSemestre(undefined, -1) }}
                </option>
                <option :value="getAnoSemestre()">
                    {{ getAnoSemestre() }} (Atual)
                </option>
                <option :value="getAnoSemestre(undefined, 1)">
                    {{ getAnoSemestre(undefined, 1) }}
                </option>
            </select>
        </div>
    </div>

    <!-- FILTER BAR -->
    <div class="bg-[#16161E] border border-white/5 rounded-xl p-4 mb-6">
        <h4
            class="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"
        >
            <svg
                class="w-3 h-3"
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
            Filtros de Busca
        </h4>

        <div class="space-y-3">
            <!-- Row 1: Area | Curso | Turno — only for non-atestado tabs -->
            <div
                v-if="activeTab !== 'atestado'"
                class="grid grid-cols-1 md:grid-cols-12 gap-3"
            >
                <div class="md:col-span-3">
                    <select
                        v-model="filters.area"
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                    >
                        <option value="">Todas Áreas</option>
                        <option
                            v-for="area in areas"
                            :key="area.value"
                            :value="area.value"
                        >
                            {{ area.label }}
                        </option>
                    </select>
                </div>
                <div class="md:col-span-6 cursor-pointer relative">
                    <select
                        v-model="filters.curso"
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10 truncate pr-8"
                        :disabled="isLoading"
                    >
                        <option value="" disabled>
                            Selecione um Curso/Turma
                        </option>
                        <option v-for="t in turmas" :key="t.id" :value="t.id">
                            {{ t.nome_curso }} - {{ t.cod_turma }} ({{
                                t.turno
                            }})
                        </option>
                    </select>
                    <div v-if="isLoading" class="absolute right-3 top-3">
                        <svg
                            class="animate-spin h-4 w-4 text-primary"
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
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                </div>
                <div class="md:col-span-3">
                    <select
                        v-model="filters.turno"
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                    >
                        <option value="">Todos Turnos</option>
                        <option value="Matutino">Matutino</option>
                        <option value="Vespertino">Vespertino</option>
                        <option value="Noturno">Noturno</option>
                    </select>
                </div>
            </div>

            <!-- Row 2: dynamic per tab -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                <!-- Alunos tab: busca + status + bolsista -->
                <div v-if="activeTab === 'alunos'" class="md:col-span-7">
                    <input
                        v-model="filters.busca"
                        type="text"
                        placeholder="Buscar por nome, nome social, artístico, e-mail ou RA..."
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 h-10"
                    />
                </div>
                <div v-else-if="activeTab !== 'atestado'" class="md:col-span-9">
                    <input
                        v-model="filters.busca"
                        type="text"
                        placeholder="Buscar por nome, nome social, artístico, e-mail ou RA..."
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 h-10"
                    />
                </div>

                <!-- Atestado tab filters -->
                <template v-if="activeTab === 'atestado'">
                    <div class="md:col-span-6">
                        <div class="relative">
                            <input
                                v-model="filters.busca_atestado"
                                type="text"
                                placeholder="Buscar por nome do aluno..."
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 h-10"
                            />
                            <svg
                                class="w-4 h-4 text-secondary absolute left-3 top-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>
                    <div class="md:col-span-6">
                        <input
                            v-model="filters.data_atestado"
                            type="date"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none h-10"
                            title="Filtrar por data do período do atestado/justificativa"
                        />
                    </div>
                    <div class="md:col-span-6">
                        <select
                            v-model="filters.escopo"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                        >
                            <option value="">Escopo: Todos</option>
                            <option value="atestado">Atestado</option>
                            <option value="justificativa">Justificativa</option>
                        </select>
                    </div>
                    <div class="md:col-span-6">
                        <select
                            v-model="filters.status_justificativa"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                        >
                            <option value="">Status: Todos</option>
                            <option value="Aguardando">Aguardando</option>
                            <option value="Em Análise">Em Análise</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Reprovado">Reprovado</option>
                        </select>
                    </div>
                </template>

                <!-- Alunos status + bolsista -->
                <div v-if="activeTab === 'alunos'" class="md:col-span-3">
                    <select
                        v-model="filters.status"
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                    >
                        <option value="">Status: Todos</option>
                        <option value="Ativa">Ativa</option>
                        <option value="Cancelada">Cancelada</option>
                        <option value="Trancamento">Trancamento</option>
                        <option value="Anulada">Anulada</option>
                    </select>
                </div>
                <div v-if="activeTab === 'alunos'" class="md:col-span-2">
                    <select
                        v-model="filters.bolsista"
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                    >
                        <option value="">Bolsista: Todos</option>
                        <option value="sim">Apenas bolsistas</option>
                    </select>
                </div>

                <!-- Declaracao status -->
                <div
                    v-else-if="activeTab === 'declaracao'"
                    class="md:col-span-3"
                >
                    <select
                        v-model="filters.status_declaracao"
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none h-10"
                    >
                        <option value="">Status: Todos</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="APROVADO">Aprovado</option>
                        <option value="REPROVADO">Reprovado</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>
