<script setup lang="ts">
import { computed, watch } from "vue";
import type { useProcessos } from "~/composables/processos/useProcessos";

const props = defineProps<{
    areas: any[];
    activeTab: string;
    setActiveTab: (k: string) => void;
    ctx: ReturnType<typeof useProcessos>;
}>();

const emit = defineEmits<{
    (e: "verDetalhes", idInscricao: string): void;
    (e: "avaliar", idInscricao: string, dados: any): void;
}>();

// Filtro client-side: programa
const inscricoesVisiveis = computed(() => {
    const lista = props.ctx.inscricoes.value;
    if (!props.ctx.filtroPrograma.value) return lista;
    return lista.filter(
        (i: any) => String(i.id_programa) === props.ctx.filtroPrograma.value,
    );
});

watch(
    [
        () => props.activeTab,
        props.ctx.filtroAnoSemestre,
        props.ctx.filtroBusca,
        props.ctx.pagina,
    ],
    () => {
        const areaId = props.activeTab === "todas" ? null : props.activeTab;
        props.ctx.fetchInscricoes(areaId);
    },
);

// Resetar página ao mudar aba ou filtro
watch(
    [() => props.activeTab, props.ctx.filtroAnoSemestre, props.ctx.filtroBusca],
    () => {
        props.ctx.pagina.value = 1;
    },
);

function getInitial(nome: string) {
    return (nome || "?").charAt(0).toUpperCase();
}

function formatDateTime(dateStr: string) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return dateStr;
    }
}

function statusBadgeClass(status: string | undefined) {
    switch (status) {
        case "aprovado":
            return "bg-green-500/10 border-green-500/20 text-green-400";
        case "reprovado":
            return "bg-red-500/10 border-red-500/20 text-red-400";
        default:
            return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    }
}

function statusBadgeLabel(label: string, status: string | undefined) {
    if (status === "aprovado") return "✓ " + label;
    if (status === "reprovado") return "✕ " + label;
    return "○ " + label;
}
</script>

<template>
    <!-- Tabs -->
    <div class="tabs-bar mb-6 shrink-0">
        <nav class="tabs-nav">
            <button
                @click="setActiveTab('todas')"
                :class="[
                    'tab-btn',
                    activeTab === 'todas' ? 'tab-btn--active' : '',
                ]"
            >
                Todas
                <span class="tab-badge">{{ areas.length }}</span>
            </button>
            <button
                v-for="area in areas"
                :key="area.id"
                @click="setActiveTab(area.id)"
                :class="[
                    'tab-btn',
                    activeTab === area.id ? 'tab-btn--active' : '',
                ]"
            >
                {{ area.nome_area }}
                <span v-if="area.qtd_processos_ativos > 0" class="tab-badge">
                    {{ area.qtd_processos_ativos }}
                </span>
            </button>
        </nav>
    </div>

    <!-- Filtros -->
    <div
        class="flex flex-wrap items-center gap-3 mb-8 bg-[#0f0f17] border border-white/5 rounded-xl p-3 shrink-0"
    >
        <select
            v-model="ctx.filtroAnoSemestre.value"
            class="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-primary/30 transition-colors appearance-none cursor-pointer"
        >
            <option value="">Todos os semestres</option>
            <option
                v-for="as in ctx.opcoesAnoSemestre.value"
                :key="as"
                :value="as"
            >
                {{ as }}
            </option>
        </select>

        <select
            v-model="ctx.filtroPrograma.value"
            class="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-primary/30 transition-colors appearance-none cursor-pointer"
        >
            <option value="">Todos os programas</option>
            <option
                v-for="prog in ctx.opcoesProgramas.value"
                :key="prog.id"
                :value="prog.id"
            >
                {{ prog.nome }}
            </option>
        </select>

        <input
            v-model="ctx.filtroBusca.value"
            type="text"
            placeholder="Buscar por nome ou email do inscrito..."
            class="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] border border-white/10 text-white placeholder:text-secondary/30 focus:outline-none focus:border-primary/30 transition-colors"
        />

        <span
            class="text-[10px] font-bold text-secondary/40 uppercase tracking-wider whitespace-nowrap"
        >
            {{ inscricoesVisiveis.length }} inscrito(s)
        </span>
    </div>

    <!-- Área de cards (scroll interno) -->
    <div class="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
        <div v-if="ctx.loading.value" class="space-y-4">
            <div
                v-for="i in 5"
                :key="i"
                class="h-20 rounded-xl bg-white/5 animate-pulse border border-white/5"
            />
        </div>

        <div
            v-else-if="inscricoesVisiveis.length === 0"
            class="text-center py-20 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-2xl"
        >
            <Icon
                name="ph:users-light"
                class="w-16 h-16 text-secondary/20 mb-4 mx-auto"
            />
            <p
                class="text-sm font-bold text-secondary/40 uppercase tracking-widest"
            >
                Nenhum inscrito encontrado
            </p>
            <p class="text-[10px] text-secondary/30 mt-2">
                Tente ajustar os filtros ou selecionar outra área.
            </p>
        </div>

        <div v-else class="space-y-3">
            <div
                v-for="insc in inscricoesVisiveis"
                :key="insc.id"
                class="group flex items-center gap-5 bg-[#0f0f17] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all"
            >
                <!-- Avatar / Foto -->
                <div
                    class="w-12 h-12 rounded-xl border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden"
                    :class="
                        ctx.fotos.value[insc.id]
                            ? 'bg-transparent'
                            : 'bg-primary/10'
                    "
                >
                    <img
                        v-if="ctx.fotos.value[insc.id]"
                        :src="ctx.fotos.value[insc.id]"
                        :alt="insc.nome_completo"
                        class="w-full h-full object-cover"
                    />
                    <span v-else class="text-sm font-black text-primary">
                        {{ getInitial(insc.nome_completo) }}
                    </span>
                </div>

                <!-- Info principal -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1">
                        <h3 class="text-sm font-black text-white truncate">
                            {{ insc.nome_completo || "—" }}
                        </h3>
                        <span
                            class="text-[9px] font-bold text-secondary/40 truncate"
                        >
                            {{ insc.email || "—" }}
                        </span>
                    </div>
                    <div class="flex items-center gap-3 flex-wrap">
                        <span
                            class="text-[10px] font-bold text-primary/80 uppercase tracking-wider"
                        >
                            {{ insc.nome_display || "—" }}
                        </span>
                        <span
                            v-if="insc.nome_area"
                            class="text-[9px] font-bold text-secondary/40 uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.03] border border-white/5"
                        >
                            {{ insc.nome_area }}
                        </span>
                        <span
                            v-if="insc.ano_semestre"
                            class="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider"
                        >
                            {{ insc.ano_semestre }}
                        </span>
                    </div>

                    <!-- Badges de status -->
                    <div class="flex items-center gap-2 mt-2">
                        <span
                            class="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                            :class="statusBadgeClass(insc.status_dados)"
                        >
                            {{ statusBadgeLabel("Dados", insc.status_dados) }}
                        </span>
                        <span
                            class="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                            :class="statusBadgeClass(insc.status_documentacao)"
                        >
                            {{
                                statusBadgeLabel(
                                    "Docs",
                                    insc.status_documentacao,
                                )
                            }}
                        </span>
                        <span
                            class="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                            :class="statusBadgeClass(insc.status_candidatura)"
                        >
                            {{
                                statusBadgeLabel(
                                    "Candidatura",
                                    insc.status_candidatura,
                                )
                            }}
                        </span>
                    </div>
                </div>

                <!-- Data + Ações -->
                <div
                    class="text-right flex-shrink-0 flex flex-col items-end gap-2"
                >
                    <div>
                        <p
                            class="text-[9px] font-black text-secondary/40 uppercase tracking-widest"
                        >
                            Inscrito em
                        </p>
                        <p class="text-[10px] font-bold text-white/70">
                            {{ formatDateTime(insc.criado_em) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button
                            @click="emit('verDetalhes', insc.id)"
                            class="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border border-white/10 text-secondary hover:text-white hover:bg-white/5 transition-all"
                        >
                            Detalhes
                        </button>
                        <button
                            @click="emit('avaliar', insc.id, insc)"
                            class="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                        >
                            Avaliar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Paginação (rodapé fixo) -->
    <div
        v-if="ctx.total.value > 0 && !ctx.loading.value"
        class="shrink-0 flex items-center justify-center pt-4 border-t border-white/5"
    >
        <div class="flex items-center gap-1">
            <button
                :disabled="ctx.pagina.value <= 1"
                @click="ctx.irParaPagina(ctx.pagina.value - 1)"
                class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10 text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                Anterior
            </button>
            <template v-for="p in ctx.totalPaginas.value" :key="p">
                <button
                    v-if="
                        p <= 5 ||
                        p > ctx.totalPaginas.value - 2 ||
                        Math.abs(p - ctx.pagina.value) <= 1
                    "
                    @click="ctx.irParaPagina(p)"
                    class="w-8 h-8 rounded-lg text-[10px] font-bold transition-all"
                    :class="
                        p === ctx.pagina.value
                            ? 'bg-primary text-white'
                            : 'text-secondary hover:text-white hover:bg-white/5'
                    "
                >
                    {{ p }}
                </button>
                <span
                    v-else-if="p === 6 || p === ctx.totalPaginas.value - 1"
                    class="text-secondary/30 text-[10px] px-1"
                    >...</span
                >
            </template>
            <button
                :disabled="ctx.pagina.value >= ctx.totalPaginas.value"
                @click="ctx.irParaPagina(ctx.pagina.value + 1)"
                class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10 text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                Próximo
            </button>
        </div>
    </div>
</template>
