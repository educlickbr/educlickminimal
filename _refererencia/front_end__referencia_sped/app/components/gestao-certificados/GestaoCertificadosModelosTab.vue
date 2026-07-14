<template>
    <div class="space-y-4">
        <!-- Filtros -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-2">
            <div class="md:col-span-8">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Buscar Curso</label
                >
                <div class="relative">
                    <input
                        v-model="filtros.search"
                        type="text"
                        placeholder="Digite o nome do curso..."
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"
                    />
                    <svg
                        class="w-4 h-4 text-secondary/50 absolute left-3.5 top-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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
            <div class="md:col-span-4">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Área</label
                >
                <BaseSelect
                    v-model="filtros.area"
                    :options="areaOptions"
                    label-key="label"
                    value-key="value"
                    placeholder="Todas as Áreas"
                />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-20">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
            ></div>
        </div>

        <!-- Empty -->
        <div
            v-else-if="cursos.length === 0"
            class="flex flex-col items-center justify-center py-20 opacity-50 bg-[#0f0f15] rounded-xl border border-white/5 border-dashed"
        >
            <div class="text-4xl mb-4">📜</div>
            <p class="text-white font-bold">Nenhum curso encontrado</p>
            <p class="text-sm text-secondary">
                Ajuste os filtros para visualizar os cursos.
            </p>
        </div>

        <!-- Grid de cursos -->
        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
            <div
                v-for="curso in cursos"
                :key="curso.id"
                class="bg-[#0f0f15] border rounded-xl p-5 transition-all group relative overflow-hidden"
                :class="'border-white/5 hover:border-primary/30'"
            >
                <div class="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                        class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border"
                        :class="getAreaBadgeClass(curso.area)"
                    >
                        {{ curso.area }}
                    </span>
                    <span
                        class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-primary/25 bg-primary/10 text-primary"
                    >
                        {{ formatHoras(curso.qtd_minutos_total) }}
                    </span>
                </div>
                <h3
                    class="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors"
                >
                    {{ curso.nome_curso }}
                </h3>
                <div
                    class="flex items-center gap-2 text-xs text-secondary mb-4"
                >
                    <svg
                        class="w-3.5 h-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                    </svg>
                    <span class="font-mono opacity-80">{{
                        curso.cod_curso || "SEM CÓDIGO"
                    }}</span>
                </div>
                <p
                    class="text-xs text-secondary leading-relaxed min-h-[44px] line-clamp-2 mb-4"
                >
                    {{
                        curso.descricao ||
                        "Sem descrição cadastrada para o texto-base do certificado."
                    }}
                </p>
                <div class="grid grid-cols-2 gap-2 text-[11px] mb-4">
                    <span
                        class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"
                        >Módulos:
                        <strong class="text-white">{{
                            curso.qtd_modulos ?? "-"
                        }}</strong></span
                    >
                    <span
                        class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"
                        >Aulas/Módulo:
                        <strong class="text-white">{{
                            curso.qtd_aulas_modulo ?? "-"
                        }}</strong></span
                    >
                    <span
                        class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"
                        >Períodos:
                        <strong class="text-white">{{
                            curso.qtd_periodos ?? "-"
                        }}</strong></span
                    >
                    <span
                        class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"
                        >Hs/Encontro:
                        <strong class="text-white">{{
                            curso.qtd_periodos && curso.qtd_minutos_periodo
                                ? (
                                      (curso.qtd_periodos *
                                          curso.qtd_minutos_periodo) /
                                      60
                                  )
                                      .toFixed(1)
                                      .replace(/\.0$/, "") + "h"
                                : "-"
                        }}</strong></span
                    >
                </div>
                <div
                    class="pt-4 border-t border-white/5 flex items-center justify-between gap-2"
                >
                    <span class="text-xs text-secondary">{{
                        formatModalidade(curso.modalidade)
                    }}</span>
                    <button
                        @click="emit('parametrizar', curso)"
                        class="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-primary hover:brightness-110 text-white transition-colors"
                    >
                        Parametrizar
                    </button>
                </div>
            </div>
        </div>

        <!-- Paginação -->
        <div
            v-if="cursos.length > 0"
            class="flex flex-col md:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5"
        >
            <span
                class="text-xs md:text-sm text-secondary-500 order-2 md:order-1"
            >
                <span class="font-medium text-white">{{
                    (pagination.pagina_atual - 1) * 12 + 1
                }}</span>
                a
                <span class="font-medium text-white">{{
                    Math.min(pagination.pagina_atual * 12, pagination.qtd_total)
                }}</span>
                de
                <span class="font-medium text-white">{{
                    pagination.qtd_total
                }}</span>
            </span>
            <div class="flex gap-2 order-1 md:order-2">
                <button
                    @click="
                        pagination.pagina_atual--;
                        fetchCursos();
                    "
                    :disabled="pagination.pagina_atual === 1"
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <button
                    @click="
                        pagination.pagina_atual++;
                        fetchCursos();
                    "
                    :disabled="
                        pagination.pagina_atual >= pagination.qtd_paginas
                    "
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Próxima
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    useGestaoCertificadosModelos,
    type CursoCard,
} from "~/composables/gestao-certificados/useGestaoCertificadosModelos";
import BaseSelect from "~/components/BaseSelect.vue";

const emit = defineEmits<{
    parametrizar: [curso: CursoCard];
}>();

const {
    isLoading,
    cursos,
    pagination,
    filtros,
    areaOptions,
    formatHoras,
    formatModalidade,
    getAreaBadgeClass,
    fetchCursos,
} = useGestaoCertificadosModelos();
</script>
