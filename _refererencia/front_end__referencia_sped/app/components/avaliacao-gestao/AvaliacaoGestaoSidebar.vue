<script setup lang="ts">
defineProps<{
    etapaAtiva: string;
    turmaSelecionada: any;
    dashboardStats: any;
    dashboardContexto: any[];
    resumoDashboardContexto: { concluidas: number; total: number };
    idsTurmasContexto: string[];
    loadingDashboard: boolean;
    dashboardPendencias: any[];
    totalPendenciasAvaliacao: number;
    totalPendenciasCoordenador: number;
    totalPendenciasPedagogo: number;
}>();

const emit = defineEmits<{
    "open-dashboard-contexto": [];
    "open-resumo-conceitos": [];
    "open-pendencias": [];
}>();
</script>

<template>
    <div class="notranslate space-y-4">
        <div class="bg-[#16161E] border border-white/10 rounded-lg p-4">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-[10px] font-bold uppercase tracking-wider text-secondary">Dashboard da Etapa</p>
                    <h3 class="text-lg font-black text-white mt-2">{{ etapaAtiva }}</h3>
                </div>
            </div>
            <p class="text-xs text-secondary mt-1">
                {{ turmaSelecionada?.nome_curso || "Selecione uma turma"
                }}<span v-if="turmaSelecionada?.cod_turma"> ({{ turmaSelecionada.cod_turma }})</span>
            </p>
            <template v-if="dashboardStats">
                <p class="text-[11px] text-secondary/70 mt-3">
                    {{ dashboardStats.total_elegiveis_publicacao }} elegíveis para publicação em lote
                </p>
                <p v-if="dashboardContexto.length" class="text-[11px] text-secondary/70 mt-1">
                    {{ resumoDashboardContexto.concluidas }}/{{ resumoDashboardContexto.total }} turmas concluídas no
                    contexto atual
                </p>
            </template>
            <p v-else class="text-[11px] text-secondary/70 mt-3">Selecione turma e etapa para ver os indicadores.</p>

            <div v-if="idsTurmasContexto.length" class="space-y-2 mt-4">
                <button @click="emit('open-dashboard-contexto')"
                    class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group">
                    <span>Relatório de Status</span>
                    <svg class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 3h7m0 0v7m0-7L10 14" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M5 5h5M5 10h8M5 15h8M5 20h14" />
                    </svg>
                </button>
                <button @click="emit('open-resumo-conceitos')"
                    class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group">
                    <span>Relatório de Conceitos</span>
                    <svg class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M7 7h10M7 11h10M7 15h6m5 4H6a2 2 0 01-2-2V7a2 2 0 012-2h8l6 6v6a2 2 0 01-2 2z" />
                    </svg>
                </button>
            </div>
        </div>

        <div v-if="loadingDashboard"
            class="bg-[#16161E] border border-white/10 rounded-lg p-4 flex items-center gap-3 text-sm text-secondary">
            <svg class="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Atualizando dashboard...
        </div>

        <template v-else-if="dashboardStats">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
                    <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Na Seleção</p>
                    <p class="text-2xl font-black text-white mt-1">{{ dashboardStats.total_alunos }}</p>
                </div>
                <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
                    <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Avaliadas</p>
                    <p class="text-2xl font-black text-emerald-400 mt-1">{{ dashboardStats.total_avaliadas }}</p>
                    <p class="text-[10px] text-secondary mt-1">{{ dashboardStats.total_nao_avaliadas }} não</p>
                </div>
                <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
                    <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Coordenação</p>
                    <p class="text-2xl font-black text-blue-400 mt-1">{{ dashboardStats.total_validadas_coordenador }}</p>
                    <p class="text-[10px] text-secondary mt-1">{{ dashboardStats.total_nao_validadas_coordenador }} não</p>
                </div>
                <div class="bg-[#16161E] border border-white/10 rounded-lg p-3">
                    <p class="text-[10px] uppercase tracking-wider text-secondary font-bold">Pedagogo(a)</p>
                    <p class="text-2xl font-black text-rose-400 mt-1">{{ dashboardStats.total_validadas_pedagogo }}</p>
                    <p class="text-[10px] text-secondary mt-1">{{ dashboardStats.total_nao_validadas_pedagogo }} não</p>
                </div>
            </div>

            <div class="bg-[#16161E] border border-white/10 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <p class="text-xs font-bold text-white">Validadas pelos dois</p>
                    <span class="text-sm font-black text-primary">{{ dashboardStats.total_validadas_ambos }}</span>
                </div>
                <div class="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" :style="{
                        width: dashboardStats.total_alunos
                            ? `${Math.round((dashboardStats.total_validadas_ambos / dashboardStats.total_alunos) * 100)}%`
                            : '0%',
                    }" />
                </div>
                <p class="text-[11px] text-secondary">{{ dashboardStats.total_nao_validadas_ambos }} ainda não estão
                    prontas pelos dois validadores.</p>
            </div>

            <div class="bg-[#16161E] border border-white/10 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <p class="text-xs font-bold text-white">Publicadas</p>
                    <span class="text-sm font-black text-emerald-400">{{ dashboardStats.total_publicadas }}</span>
                </div>
                <div class="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" :style="{
                        width: dashboardStats.total_alunos
                            ? `${Math.round((dashboardStats.total_publicadas / dashboardStats.total_alunos) * 100)}%`
                            : '0%',
                    }" />
                </div>
                <p class="text-[11px] text-secondary">{{ dashboardStats.total_nao_publicadas }} ainda não publicadas.</p>
            </div>

            <div class="bg-[#16161E] border border-white/10 rounded-lg p-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <p class="text-xs font-bold text-white">Pendências atuais</p>
                        <p class="text-[11px] text-secondary mt-1">Critérios, coordenação e pedagogia.</p>
                    </div>
                    <button v-if="dashboardPendencias.length" @click="emit('open-pendencias')"
                        class="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">Ver
                        lista</button>
                </div>
                <div class="mt-3 space-y-2 text-[11px] text-secondary">
                    <div class="flex items-center justify-between">
                        <span>Critérios pendentes</span><strong class="text-amber-400">{{ totalPendenciasAvaliacao
                        }}</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>Sem coordenação</span><strong class="text-blue-400">{{ totalPendenciasCoordenador
                        }}</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>Sem pedagogo(a)</span><strong class="text-rose-400">{{ totalPendenciasPedagogo }}</strong>
                    </div>
                </div>
            </div>
        </template>

        <div v-else class="bg-[#16161E] border border-white/10 rounded-lg p-4 text-sm text-secondary">
            Sem dados de dashboard para o contexto atual.
        </div>
    </div>
</template>
