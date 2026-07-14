<script setup lang="ts">
const props = defineProps<{
    statsData?: Record<string, any>
    isLoading?: boolean
}>()

const totalInscricoes = computed(() => Number(props.statsData?.total_inscricoes || 0))
const mediaIntegrantes = computed(() => Number(props.statsData?.segundo_tempo?.media_integrantes_por_grupo || 0))
const qualTempoFiltro = computed(() => String(props.statsData?.filtros?.qual_tempo || 'todos'))
const showAtividadesCard = computed(() => qualTempoFiltro.value !== 'segundo_tempo')
const showSegundoTempoCards = computed(() => qualTempoFiltro.value !== 'primeiro_tempo')

const regioes = computed(() => {
    const rows = Array.isArray(props.statsData?.segundo_tempo?.regioes_administrativas)
        ? props.statsData.segundo_tempo.regioes_administrativas
        : []
    const max = Math.max(1, ...rows.map((r: any) => Number(r?.qtd || 0)))
    return rows.map((r: any) => ({
        ...r,
        qtd: Number(r?.qtd || 0),
        pct: Math.round((Number(r?.qtd || 0) / max) * 100),
    }))
})

const atividadeOpcoesAgrupadas = computed(() => {
    const rows = Array.isArray(props.statsData?.primeiro_tempo?.atividade_opcoes)
        ? props.statsData.primeiro_tempo.atividade_opcoes
        : []

    const byPergunta = new Map<string, any>()

    for (const row of rows) {
        const key = `${row.id_atividade}::${row.id_pergunta}`
        if (!byPergunta.has(key)) {
            byPergunta.set(key, {
                id_atividade: row.id_atividade,
                atividade_nome: row.atividade_nome,
                atividade_ordem: Number(row.atividade_ordem || 0),
                id_pergunta: row.id_pergunta,
                pergunta: row.pergunta,
                pergunta_ordem: Number(row.pergunta_ordem || 0),
                opcoes: [],
            })
        }

        byPergunta.get(key).opcoes.push({
            id_opcao: row.id_opcao,
            opcao_label: row.opcao_label,
            qtd: Number(row.qtd || 0),
            opcao_ordem: Number(row.opcao_ordem || 0),
        })
    }

    const perguntas = Array.from(byPergunta.values())
        .map((p) => {
            const totalPergunta = p.opcoes.reduce((acc: number, o: any) => acc + o.qtd, 0)
            const max = Math.max(1, ...p.opcoes.map((o: any) => o.qtd))
            const opcoes = p.opcoes
                .sort((a: any, b: any) => b.qtd - a.qtd || a.opcao_ordem - b.opcao_ordem)
                .map((o: any) => ({ ...o, pct: Math.round((o.qtd / max) * 100) }))

            return {
                ...p,
                totalPergunta,
                opcoes,
            }
        })
        .sort((a, b) => a.atividade_ordem - b.atividade_ordem || a.pergunta_ordem - b.pergunta_ordem)

    return perguntas
})
</script>

<template>
    <div class="space-y-4">
        <div v-if="isLoading" class="bg-[#16161E] border border-white/10 rounded-lg p-4 flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>

        <template v-else>
            <div class="bg-[#16161E] border border-white/10 rounded-lg p-4">
                <div class="text-[10px] text-secondary/70 uppercase tracking-wide mb-1">Total</div>
                <div class="text-3xl font-black text-white">{{ totalInscricoes }}</div>
                <div class="text-[10px] text-secondary/60 mt-0.5">inscricoes no filtro</div>
            </div>

            <div v-if="showSegundoTempoCards" class="bg-[#16161E] border border-white/10 rounded-lg p-4">
                <div class="text-xs font-semibold text-white mb-1">Media de Integrantes por Grupo</div>
                <div class="text-2xl font-black text-primary">{{ mediaIntegrantes.toFixed(2) }}</div>
                <div class="text-[10px] text-secondary/60 mt-0.5">segundo tempo</div>
            </div>

            <div v-if="showSegundoTempoCards" class="bg-[#16161E] border border-white/10 rounded-lg p-4">
                <div class="text-xs font-semibold text-white mb-3">Regiao Administrativa</div>
                <div v-if="regioes.length === 0" class="text-[11px] text-secondary/70">Sem dados para o filtro atual.</div>
                <div v-else class="space-y-2">
                    <div v-for="row in regioes" :key="row.value" class="space-y-1">
                        <div class="flex justify-between text-[10px] gap-2">
                            <span class="text-secondary truncate">{{ row.label }}</span>
                            <span class="text-white font-bold">{{ row.qtd }}</span>
                        </div>
                        <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-primary to-pink-400 rounded-full" :style="{ width: row.pct + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showAtividadesCard" class="bg-[#16161E] border border-white/10 rounded-lg p-4">
                <div class="text-xs font-semibold text-white mb-3">Escolhas por Atividade (Primeiro Tempo)</div>
                <div v-if="atividadeOpcoesAgrupadas.length === 0" class="text-[11px] text-secondary/70">Sem escolhas registradas para o filtro atual.</div>
                <div v-else class="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                    <div v-for="pergunta in atividadeOpcoesAgrupadas" :key="`${pergunta.id_atividade}-${pergunta.id_pergunta}`" class="space-y-2 border border-white/5 rounded-md p-2">
                        <p class="text-[10px] text-primary font-bold uppercase tracking-wider">{{ pergunta.atividade_nome }}</p>
                        <p class="text-[11px] text-white font-semibold">{{ pergunta.pergunta }}</p>
                        <div class="space-y-1">
                            <div v-for="opcao in pergunta.opcoes" :key="opcao.id_opcao" class="space-y-1">
                                <div class="flex justify-between text-[10px] gap-2">
                                    <span class="text-secondary truncate">{{ opcao.opcao_label }}</span>
                                    <span class="text-white font-bold">{{ opcao.qtd }}</span>
                                </div>
                                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" :style="{ width: opcao.pct + '%' }"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
