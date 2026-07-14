<script setup lang="ts">
import BaseSelect from "../BaseSelect.vue";

defineProps<{
    items: any[];
    isLoading: boolean;
    pagination: { pagina_atual: number; qtd_paginas: number; qtd_total: number };
    areaOptions: { label: string; value: string | null }[];
}>();

const search = defineModel<string>("search", { default: "" });
const area = defineModel<string | null>("area", { default: null });

const emit = defineEmits<{
    "page-change": [page: number];
    edit: [cursoId: string];
}>();

const areaClass = (cursoArea: string) => ({
    "bg-blue-500/10 text-blue-500 border-blue-500/20": cursoArea === "Extensão",
    "bg-purple-500/10 text-purple-500 border-purple-500/20": cursoArea === "Regulares",
    "bg-orange-500/10 text-orange-500 border-orange-500/20": cursoArea === "Cursos Livres",
    "bg-gray-500/10 text-gray-400 border-gray-500/20": !["Extensão", "Regulares", "Cursos Livres"].includes(cursoArea),
});
</script>

<template>
    <div>
        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            <div class="md:col-span-8">
                <label class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider">Buscar por Nome</label>
                <div class="relative">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Digite para buscar..."
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"
                    />
                    <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <div class="md:col-span-4">
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
            <div class="text-4xl mb-4">📚</div>
            <p class="text-white font-bold">Nenhum curso encontrado</p>
            <p class="text-sm text-secondary">Tente ajustar os filtros de busca.</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
                v-for="curso in items"
                :key="curso.id"
                class="bg-[#0f0f15] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all group relative overflow-hidden"
            >
                <div class="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="emit('edit', curso.id)" class="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-colors">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>

                <div class="flex items-start justify-between mb-3">
                    <span class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border" :class="areaClass(curso.area)">
                        {{ curso.area }}
                    </span>
                </div>

                <h3 class="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {{ curso.nome_curso }}
                </h3>

                <div class="flex items-center gap-2 text-xs text-secondary mb-4">
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                    <span class="font-mono opacity-70">{{ curso.cod_curso || 'SEM CÓDIGO' }}</span>
                </div>

                <div class="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span class="text-xs text-secondary font-medium">Ativo</span>
                    </div>
                    <span class="text-xs text-secondary-500 font-medium">{{ curso.modalidade || 'Presencial' }}</span>
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
