<script setup lang="ts">
import BaseSelect from "../BaseSelect.vue";

defineProps<{
    items: any[];
    isLoading: boolean;
    pagination: { pagina_atual: number; qtd_paginas: number; qtd_total: number };
    areaOptions: { label: string; value: string | null }[];
    semesterOptions: { label: string; value: string }[];
}>();

const search = defineModel<string>("search", { default: "" });
const area = defineModel<string | null>("area", { default: null });
const anoSemestre = defineModel<string>("anoSemestre", { default: "" });

const emit = defineEmits<{
    "page-change": [page: number];
    edit: [turmaId: string];
}>();

const areaClass = (areaCursoInt: string) => ({
    "bg-blue-500/10 text-blue-500 border-blue-500/20": areaCursoInt === "Extensão",
    "bg-purple-500/10 text-purple-500 border-purple-500/20": areaCursoInt === "Regulares",
    "bg-orange-500/10 text-orange-500 border-orange-500/20": areaCursoInt === "Cursos Livres",
    "bg-gray-500/10 text-gray-400 border-gray-500/20": !["Extensão", "Regulares", "Cursos Livres"].includes(areaCursoInt),
});

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
        return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    } catch {
        return "N/A";
    }
};
</script>

<template>
    <div>
        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            <div class="md:col-span-6">
                <label class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider">Buscar por Nome / Curso</label>
                <div class="relative">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Buscar por nome do curso..."
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"
                    />
                    <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <div class="md:col-span-3">
                <label class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider">Semestre</label>
                <BaseSelect
                    :model-value="anoSemestre"
                    :options="semesterOptions"
                    label-key="label"
                    value-key="value"
                    placeholder="Selecione"
                    @update:model-value="anoSemestre = $event"
                />
            </div>
            <div class="md:col-span-3">
                <label class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider">Área</label>
                <BaseSelect
                    :model-value="area"
                    :options="areaOptions"
                    label-key="label"
                    value-key="value"
                    placeholder="Todas as Áreas"
                    @update:model-value="area = $event"
                />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-20 opacity-50 bg-[#0f0f15] rounded-xl border border-white/5 border-dashed">
            <div class="text-4xl mb-4">🏫</div>
            <p class="text-white font-bold">Nenhuma turma encontrada</p>
            <p class="text-sm text-secondary">Tente ajustar os filtros.</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
                v-for="turma in items"
                :key="turma.id"
                class="bg-[#0f0f15] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col"
            >
                <div class="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button @click="emit('edit', turma.id)" class="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-colors">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>

                <div class="flex items-center gap-2 mb-3">
                    <span class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border" :class="areaClass(turma.area_curso_int)">
                        {{ turma.area_curso }}
                    </span>
                    <span v-if="turma.ano_semestre" class="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded">
                        {{ turma.ano_semestre }}
                    </span>
                </div>

                <h3 class="text-lg font-bold text-white mb-1 leading-tight group-hover:text-primary transition-colors">
                    {{ turma.nome_curso }}
                </h3>
                <p class="text-xs text-secondary-400 font-medium mb-4">{{ turma.cod_turma }} · {{ turma.turno || 'Sem Turno' }}</p>

                <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-secondary mb-4 mt-auto">
                    <div class="flex items-center gap-2">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span class="truncate">{{ turma.dias_semana || 'A definir' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>{{ turma.hora_ini }} - {{ turma.hora_fim }}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-white/5 pt-4 mt-auto">
                    <div>
                        <p class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Inscrições</p>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-white">{{ formatDate(turma.dt_ini_inscri) }}</span>
                            <span class="text-[10px] text-secondary">até</span>
                            <span class="text-xs text-white">{{ formatDate(turma.dt_fim_inscri) }}</span>
                        </div>
                    </div>
                    <div>
                        <p class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Matrículas</p>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-white">{{ formatDate(turma.dt_ini_mat) }}</span>
                            <span class="text-[10px] text-secondary">até</span>
                            <span class="text-xs text-white">{{ formatDate(turma.dt_fim_mat) }}</span>
                        </div>
                    </div>
                    <div class="col-span-2 pt-2 border-t border-white/5">
                        <p class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Período do Curso</p>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-secondary-300 font-mono">{{ formatDate(turma.dt_ini_curso) }}</span>
                            <span class="text-[10px] text-secondary">a</span>
                            <span class="text-xs text-secondary-300 font-mono">{{ formatDate(turma.dt_fim_curso) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="items.length > 0" class="flex flex-col md:flex-row items-center justify-between gap-3 mt-8 pt-4 border-t border-white/5">
            <span class="text-xs md:text-sm text-secondary-500 order-2 md:order-1">
                <span class="font-medium text-white">{{ (pagination.pagina_atual - 1) * 12 + 1 }}</span> a <span class="font-medium text-white">{{ Math.min(pagination.pagina_atual * 12, pagination.qtd_total) }}</span> de <span class="font-medium text-white">{{ pagination.qtd_total }}</span>
            </span>
            <div class="flex gap-2 order-1 md:order-2">
                <button
                    @click="emit('page-change', pagination.pagina_atual - 1)"
                    :disabled="pagination.pagina_atual === 1"
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <button
                    @click="emit('page-change', pagination.pagina_atual + 1)"
                    :disabled="pagination.pagina_atual >= pagination.qtd_paginas"
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Próxima
                </button>
            </div>
        </div>
    </div>
</template>
