<script setup lang="ts">
const props = defineProps<{
    dashboard?: Record<string, any> | null
    editais?: any[]
    selectedEditalId?: string | null
    isLoading?: boolean
}>()

const emit = defineEmits<{
    (e: 'change-edital', id: string): void
}>()

const localSelected = ref('')

watch(
    () => props.selectedEditalId,
    (next) => {
        localSelected.value = next || ''
    },
    { immediate: true }
)

const series = computed(() => {
    const rows = Array.isArray(props.dashboard?.por_dia) ? props.dashboard?.por_dia : []
    const max = Math.max(1, ...rows.map((r: any) => Number(r?.qtd || 0)))

    return rows.map((r: any) => ({
        dia: String(r?.dia || ''),
        qtd: Number(r?.qtd || 0),
        pct: Math.round((Number(r?.qtd || 0) / max) * 100),
    }))
})

const totalInscricoes = computed(() => Number(props.dashboard?.total_inscricoes || 0))
const editalTitulo = computed(() => String(props.dashboard?.edital_titulo || ''))

const formatDia = (isoDate: string) => {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    if (!y || !m || !d) return isoDate
    return `${d}/${m}`
}

const handleChange = () => {
    if (!localSelected.value) return
    emit('change-edital', localSelected.value)
}
</script>

<template>
    <div class="space-y-4">
        <div class="bg-[#16161E] border border-white/10 rounded-lg p-4">
            <p class="text-[10px] text-secondary/70 uppercase tracking-wide">Instrucao</p>
            <p class="text-xs text-secondary mt-1">Selecione um edital para ver o grafico diario.</p>
            <div class="mt-3">
                <select
                    v-model="localSelected"
                    @change="handleChange"
                    class="w-full bg-background border border-secondary/10 text-white text-xs rounded-lg p-2.5 outline-none"
                >
                    <option v-for="edital in (editais || [])" :key="edital.id || edital.id_edital" :value="edital.id || edital.id_edital">
                        {{ edital.edital_titulo || edital.titulo || (edital.id || edital.id_edital) }}
                    </option>
                </select>
            </div>
        </div>

        <div v-if="isLoading" class="bg-[#16161E] border border-white/10 rounded-lg p-4 flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>

        <template v-else>
            <div class="bg-[#16161E] border border-white/10 rounded-lg p-4">
                <div class="text-[10px] text-secondary/70 uppercase tracking-wide mb-1">Total</div>
                <div class="text-3xl font-black text-white">{{ totalInscricoes }}</div>
                <div class="text-[10px] text-secondary/60 mt-0.5">inscricoes do edital</div>
            </div>

            <div class="bg-[#16161E] border border-white/10 rounded-lg p-4">
                <div class="text-xs font-semibold text-white mb-2">Inscricoes por Dia</div>
                <p v-if="editalTitulo" class="text-[11px] text-secondary mb-1 truncate">{{ editalTitulo }}</p>
                <p class="text-[10px] text-secondary/70 mb-3">Dias sem inscricao nao sao exibidos.</p>

                <div v-if="series.length === 0" class="text-[11px] text-secondary/70">Sem inscricoes para o edital selecionado.</div>
                <div v-else class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    <div v-for="row in series" :key="row.dia" class="space-y-1">
                        <div class="flex justify-between text-[10px] gap-2">
                            <span class="text-secondary truncate">{{ formatDia(row.dia) }}</span>
                            <span class="text-white font-bold">{{ row.qtd }}</span>
                        </div>
                        <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-primary to-pink-400 rounded-full" :style="{ width: row.pct + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
