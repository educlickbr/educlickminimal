<template>
    <div class="rounded-xl border border-white/10 bg-[#12121A] p-4">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="space-y-1">
                <h3 class="text-white font-bold text-sm md:text-base">
                    {{ item.nome_curso }}
                </h3>
                <p class="text-xs text-secondary">
                    <span v-if="item.cod_curso">{{ item.cod_curso }}</span>
                    <span v-if="item.cod_turma_contexto">
                        • Turma {{ item.cod_turma_contexto }}</span
                    >
                    <span v-if="item.ano_semestre_contexto">
                        • {{ item.ano_semestre_contexto }}</span
                    >
                </p>
                <p class="text-[11px] text-secondary/80">
                    Período:
                    {{ formatDataCurta(item.dt_ini_curso_contexto) }} a
                    {{ formatDataCurta(item.dt_fim_curso_contexto) }}
                </p>
                <p class="text-[11px] text-secondary/80">
                    Aprovado em: {{ formatDataCurta(item.aprovado_em) }}
                    <span v-if="item.aprovado_por_nome">
                        • por {{ item.aprovado_por_nome }}</span
                    >
                </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
                <span
                    class="px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider"
                    :class="getAreaBadgeClass(item.area_curso)"
                >
                    {{ normalizarArea(item.area_curso) }}
                </span>
                <span
                    class="px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                    Aprovado
                </span>
            </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
            <button
                @click="$emit('open-public', item.id_certificado_emitido)"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors"
                title="Abrir Página Pública"
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
                        stroke-width="1.8"
                        d="M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5zm12 1h1m2 0h1m-5 2h5m-3-3v5"
                    />
                </svg>
            </button>
            <button
                @click="$emit('open-name-choice', item)"
                class="px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider bg-primary hover:brightness-110 text-white transition-colors ring-2 ring-primary/40 shadow-lg shadow-primary/25"
            >
                Visualizar / Imprimir
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    item: any;
    normalizarArea: (area?: string | null) => string;
    getAreaBadgeClass: (area?: string | null) => string;
    formatDataCurta: (iso?: string | null) => string;
}>();

defineEmits<{
    "open-public": [id: string];
    "open-name-choice": [item: any];
}>();
</script>
