<script setup lang="ts">
import BaseSelect from "~/components/BaseSelect.vue";

const props = defineProps<{
    turmaOptions: any[];
    qtdPeriodos: number;
    isRegulares: boolean;
    semestres: string[];
}>();

const filters = defineModel<any>("filters", { required: true });
const aulaSelecionada = defineModel<string>("aula", { default: "aula_1" });
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 px-0 md:px-0 mb-8">
        <!-- ROW 1 -->
        <!-- 1. Ano/Semestre -->
        <div class="md:col-span-2">
            <label
                class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                >Período</label
            >
            <div class="relative">
                <select
                    v-model="filters.anoSemestre"
                    class="w-full bg-[#0f0f15] border border-white/10 text-white text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-3 pr-8 outline-none cursor-pointer appearance-none"
                >
                    <option v-for="s in semestres" :key="s" :value="s">
                        {{ s }}
                    </option>
                </select>
                <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary"
                >
                    <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                        ></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- 2. Turma Selector -->
        <div :class="isRegulares ? 'md:col-span-8' : 'md:col-span-10'">
            <label
                class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                >Turma</label
            >
            <BaseSelect
                v-model="filters.turmaId"
                :options="turmaOptions"
                label-key="label"
                selected-label-key="labelShort"
                value-key="id"
                placeholder="Selecione a Turma"
                :disabled="!turmaOptions.length"
            />
        </div>

        <div v-if="isRegulares" class="md:col-span-2">
            <label
                class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                >Bolsista</label
            >
            <select
                v-model="filters.bolsista"
                class="w-full bg-[#0f0f15] border border-white/10 text-white text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none"
            >
                <option value="">Todos</option>
                <option value="sim">Apenas bolsistas</option>
            </select>
        </div>

        <!-- ROW 2 -->
        <!-- 3. Date Picker -->
        <div class="md:col-span-3">
            <label
                class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                >Data</label
            >
            <div class="relative">
                <input
                    v-model="filters.data"
                    type="date"
                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:border-primary focus:outline-none h-[40px] appearance-none"
                    style="color-scheme: dark"
                />
                <div
                    class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-primary"
                >
                    <svg
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- 4. Search Student -->
        <div :class="qtdPeriodos > 1 ? 'md:col-span-6' : 'md:col-span-9'">
            <label
                class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                >Buscar</label
            >
            <div class="relative">
                <input
                    v-model="filters.search"
                    type="text"
                    placeholder="Nome ou matrícula..."
                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none h-[40px]"
                />
            </div>
        </div>

        <!-- 5. Aula Selector - Only show if qtdPeriodos > 1 -->
        <div
            v-if="qtdPeriodos > 1"
            class="md:col-span-3 flex flex-col items-end"
        >
            <div class="flex items-center justify-end h-full pt-2 md:pt-6 w-full">
                <div
                    class="flex items-center p-1 bg-[#0f0f15] border border-white/10 rounded-lg h-[40px] w-full"
                >
                    <button
                        v-for="i in qtdPeriodos"
                        :key="i"
                        @click="aulaSelecionada = `aula_${i}`"
                        class="flex-1 h-full rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                        :class="
                            aulaSelecionada === `aula_${i}`
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-secondary hover:text-white hover:bg-white/5'
                        "
                    >
                        Aula {{ i }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
