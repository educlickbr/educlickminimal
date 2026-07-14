<script setup lang="ts">
import { computed, watch } from "vue";
import type { useMatriculas } from "~/composables/matriculas/useMatriculas";

const props = defineProps<{
    areas: any[];
    activeTab: string;
    setActiveTab: (k: string) => void;
    ctx: ReturnType<typeof useMatriculas>;
}>();

const emit = defineEmits<{
    (e: "verDetalhes", idMatricula: string): void;
    (e: "inativar", idMatricula: string, dados: any): void;
}>();

const inscricoesVisiveis = computed(() => props.ctx.matriculasVisiveis.value);

watch(
    [
        () => props.activeTab,
        props.ctx.filtroAnoSemestre,
        props.ctx.filtroBusca,
        props.ctx.filtroStatus,
        props.ctx.pagina,
    ],
    () => {
        const areaId = props.activeTab === "todas" ? null : props.activeTab;
        props.ctx.fetchMatriculas(areaId);
    },
    { immediate: true },
);

watch(
    [
        () => props.activeTab,
        props.ctx.filtroAnoSemestre,
        props.ctx.filtroBusca,
        props.ctx.filtroStatus,
    ],
    () => { props.ctx.pagina.value = 1; },
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
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        }).format(d);
    } catch { return dateStr; }
}

function statusConfig(status: string | undefined) {
    switch (status) {
        case "ativa":    return { cls: "status--ativa",    dot: "#34d399", label: "Ativa" };
        case "inativa":  return { cls: "status--inativa",  dot: "rgba(255,255,255,0.25)", label: "Inativa" };
        case "cancelada":return { cls: "status--cancelada",dot: "#f87171", label: "Cancelada" };
        default:         return { cls: "status--pendente", dot: "#fbbf24", label: status || "—" };
    }
}
</script>

<template>
    <!-- Tabs -->
    <div class="page-top-row">
        <nav class="tabs-nav">
            <button
                v-for="tab in [{ key: 'todas', label: 'Todas' }, ...areas.map((a: any) => ({ key: a.id, label: a.nome_area }))]"
                :key="tab.key"
                @click="setActiveTab(tab.key)"
                :class="['tab-btn', activeTab === tab.key ? 'tab-btn--active' : '']"
            >{{ tab.label }}</button>
        </nav>
    </div>

    <!-- Filtros -->
    <div class="filter-bar">
        <select v-model="ctx.filtroAnoSemestre.value" class="filter-select">
            <option value="">Todos os semestres</option>
            <option v-for="as in ctx.opcoesAnoSemestre.value" :key="as" :value="as">{{ as }}</option>
        </select>

        <select v-model="ctx.filtroTurma.value" class="filter-select">
            <option value="">Todas as turmas</option>
            <option v-for="turma in ctx.opcoesTurmas.value" :key="turma.id" :value="turma.id">
                {{ turma.nome }}<template v-if="turma.ano_semestre"> ({{ turma.ano_semestre }})</template>
            </option>
        </select>

        <select v-model="ctx.filtroStatus.value" class="filter-select">
            <option value="">Todos os status</option>
            <option value="ativa">● Ativa</option>
            <option value="inativa">○ Inativa</option>
            <option value="cancelada">✕ Cancelada</option>
        </select>

        <input
            v-model="ctx.filtroBusca.value"
            type="text"
            placeholder="Buscar por nome ou email..."
            class="filter-input"
        />

        <span class="filter-count">{{ inscricoesVisiveis.length }} matrícula(s)</span>
    </div>

    <!-- Lista -->
    <div class="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">

        <!-- Skeleton -->
        <div v-if="ctx.loading.value" class="flex flex-col gap-3">
            <div v-for="i in 6" :key="i" class="h-28 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
        </div>

        <!-- Empty -->
        <div v-else-if="inscricoesVisiveis.length === 0" class="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="mb-3 text-white/20">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p class="text-sm font-bold text-white/30">Nenhuma matrícula encontrada</p>
            <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Tente ajustar os filtros ou selecionar outra área</p>
        </div>

        <!-- Lista de cards -->
        <div v-else class="flex flex-col gap-3">
            <div
                v-for="mat in inscricoesVisiveis"
                :key="mat.id"
                class="person-card"
                @click="emit('verDetalhes', mat.id)"
            >
                <div class="person-accent-bar" />
                <div class="person-card-inner">

                    <!-- Header: avatar + nome + ações -->
                    <div class="person-card-header">
                        <!-- Avatar / Foto -->
                        <div
                            class="person-avatar"
                            :class="ctx.fotos.value[mat.id] ? 'person-avatar--photo' : ''"
                        >
                            <img
                                v-if="ctx.fotos.value[mat.id]"
                                :src="ctx.fotos.value[mat.id]"
                                :alt="mat.nome_completo"
                                class="w-full h-full object-cover"
                            />
                            <span v-else>{{ getInitial(mat.nome_completo) }}</span>
                        </div>

                        <!-- Nome + email -->
                        <div class="person-identity">
                            <p class="person-name">{{ mat.nome_completo || "—" }}</p>
                            <p class="person-email">{{ mat.email || "—" }}</p>
                        </div>

                        <!-- Ações hover -->
                        <div class="person-actions" @click.stop>
                            <button @click="emit('verDetalhes', mat.id)" class="act-btn act-btn--neutral" title="Detalhes">
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.3"/>
                                    <path d="M6 4v4M6 3.5v.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <button
                                @click="emit('inativar', mat.id, mat)"
                                class="act-btn act-btn--warn"
                                title="Inativar"
                                :disabled="mat.status === 'inativa' || mat.status === 'cancelada'"
                            >
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.3"/>
                                    <path d="M4.5 4.5l3 3M7.5 4.5l-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Programa + badges de contexto -->
                    <div class="person-meta">
                        <span class="person-programa">{{ mat.programa_descricao || "—" }}</span>
                        <span v-if="mat.nome_area" class="meta-badge">{{ mat.nome_area }}</span>
                        <span v-if="mat.turma?.nome_turma" class="meta-badge meta-badge--amber">{{ mat.turma.nome_turma }}</span>
                    </div>

                    <!-- Divisor -->
                    <div class="person-divider" />

                    <!-- Footer: status + data -->
                    <div class="person-footer">
                        <div
                            class="person-status"
                            :class="statusConfig(mat.status).cls"
                        >
                            <div class="status-dot" :style="{ background: statusConfig(mat.status).dot }" />
                            {{ statusConfig(mat.status).label }}
                        </div>
                        <div class="person-date">
                            <span class="date-label">Matrícula em</span>
                            <span class="date-value">{{ formatDateTime(mat.criado_em) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Paginação -->
    <div
        v-if="ctx.total.value > 0 && !ctx.loading.value"
        class="shrink-0 flex items-center justify-center pt-4 border-t border-white/5"
    >
        <div class="flex items-center gap-1">
            <button :disabled="ctx.pagina.value <= 1" @click="ctx.irParaPagina(ctx.pagina.value - 1)" class="pag-btn">‹ Anterior</button>
            <template v-for="p in ctx.totalPaginas.value" :key="p">
                <button
                    v-if="p <= 5 || p > ctx.totalPaginas.value - 2 || Math.abs(p - ctx.pagina.value) <= 1"
                    @click="ctx.irParaPagina(p)"
                    class="pag-num"
                    :class="p === ctx.pagina.value ? 'pag-num--active' : ''"
                >{{ p }}</button>
                <span v-else-if="p === 6 || p === ctx.totalPaginas.value - 1" class="text-secondary/30 text-[10px] px-1">...</span>
            </template>
            <button :disabled="ctx.pagina.value >= ctx.totalPaginas.value" @click="ctx.irParaPagina(ctx.pagina.value + 1)" class="pag-btn">Próximo ›</button>
        </div>
    </div>
</template>

<style scoped>
/* ── Tabs ─────────────────────────────────────────── */
.page-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
.tabs-nav { display: flex; gap: 4px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 4px; }
.tab-btn { padding: 7px 16px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.28); border: none; background: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.tab-btn:hover { color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.04); }
.tab-btn--active { background: rgba(139,92,246,0.14); color: #c4b5fd; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }

/* ── Filter bar ───────────────────────────────────── */
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; flex-shrink: 0; }
.filter-select, .filter-input {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8);
    outline: none; transition: border-color 0.15s; cursor: pointer;
}
.filter-select { padding-right: 28px; appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 6px center; background-repeat: no-repeat; background-size: 1em;
}
.filter-input { flex: 1; min-width: 180px; }
.filter-input::placeholder { color: rgba(255,255,255,0.2); text-transform: none; }
.filter-select:focus, .filter-input:focus { border-color: rgba(139,92,246,0.35); }
.filter-count { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.25); white-space: nowrap; margin-left: auto; }

/* ── Card ─────────────────────────────────────────── */
.person-card {
    position: relative; background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
    overflow: hidden; cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.person-card:hover {
    border-color: rgba(139,92,246,0.28); transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(139,92,246,0.1);
}
.person-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0; transition: opacity 0.2s ease;
}
.person-card:hover .person-accent-bar { opacity: 1; }

.person-card-inner { padding: 16px 16px 14px 20px; display: flex; flex-direction: column; gap: 10px; }

/* ── Header ──────────────────────────────────────── */
.person-card-header { display: flex; align-items: center; gap: 10px; }

.person-avatar {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
    color: #a78bfa; font-size: 15px; font-weight: 900;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.person-avatar--photo { background: transparent; border-color: rgba(255,255,255,0.08); }

.person-identity { flex: 1; min-width: 0; }
.person-name { font-size: 13px; font-weight: 900; color: rgba(232,230,240,0.92); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.person-email { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.person-actions { display: flex; gap: 5px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s ease; }
.person-card:hover .person-actions { opacity: 1; }

.act-btn { width: 28px; height: 28px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.act-btn--neutral { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.35); }
.act-btn--neutral:hover { background: rgba(139,92,246,0.16); color: #c4b5fd; }
.act-btn--warn { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25); }
.act-btn--warn:hover:not(:disabled) { background: rgba(239,68,68,0.14); color: #f87171; }
.act-btn--warn:disabled { opacity: 0.25; cursor: not-allowed; }

/* ── Meta ────────────────────────────────────────── */
.person-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.person-programa { font-size: 10px; font-weight: 800; color: rgba(167,139,250,0.8); text-transform: uppercase; letter-spacing: 0.06em; }
.meta-badge { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 7px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.35); }
.meta-badge--amber { background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.18); color: #fbbf24; }

.person-divider { height: 1px; background: rgba(255,255,255,0.04); }

/* ── Footer ──────────────────────────────────────── */
.person-footer { display: flex; align-items: center; justify-content: space-between; }

.person-status { display: inline-flex; align-items: center; gap: 5px; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 9px; border-radius: 20px; border: 1px solid transparent; }
.status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.status--ativa    { background: rgba(52,211,153,0.08);  border-color: rgba(52,211,153,0.18);  color: #34d399; }
.status--inativa  { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); }
.status--cancelada{ background: rgba(239,68,68,0.08);   border-color: rgba(239,68,68,0.18);   color: #f87171; }
.status--pendente { background: rgba(251,191,36,0.08);  border-color: rgba(251,191,36,0.18);  color: #fbbf24; }

.person-date { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.date-label { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.2); }
.date-value { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.55); }

/* ── Empty ───────────────────────────────────────── */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 24px; background: rgba(255,255,255,0.015); border-radius: 14px; border: 1px dashed rgba(255,255,255,0.07); text-align: center; }

/* ── Pagination ──────────────────────────────────── */
.pag-btn { padding: 6px 12px; border-radius: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s; }
.pag-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #fff; }
.pag-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.pag-num { width: 30px; height: 30px; border-radius: 8px; font-size: 10px; font-weight: 800; border: none; background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.15s; }
.pag-num:hover { background: rgba(255,255,255,0.06); color: #fff; }
.pag-num--active { background: linear-gradient(135deg,#7c3aed,#8b5cf6); color: #fff; box-shadow: 0 4px 10px rgba(139,92,246,0.3); }

/* ── Scrollbar ───────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
</style>
