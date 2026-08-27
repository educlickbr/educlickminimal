<script setup lang="ts">
import type { UseDocentesCurriculosReturn } from "~/composables/docentes/useDocentesCurriculos";

const props = defineProps<{
    ctx: UseDocentesCurriculosReturn;
}>();

const FILTROS = [
    { id: "todas", label: "Todas" },
    { id: "nao_vistas", label: "Não Vistas" },
    { id: "vistas", label: "Vistas" },
    { id: "consideradas", label: "Consideradas" },
];

function getStatusInfo(proposta: any) {
    if (!proposta.visto) return { label: "Novo", cls: "bg-sky-500/10 border-sky-500/20 text-sky-400" };
    if (proposta.considerado === true) return { label: "Chamar", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
    if (proposta.considerado === false) return { label: "Dispensado", cls: "bg-div-15 border border-divider text-secondary" };
    return { label: "Visto", cls: "bg-div-15 border border-divider text-secondary" };
}

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR");
}

watch(
    () => props.ctx.filtro.value,
    () => {
        props.ctx.pagina.value = 1;
        props.ctx.fetchPropostas();
    },
);

onMounted(() => {
    props.ctx.fetchPropostas();
});
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Filtros -->
        <div class="filter-bar">
            <button
                v-for="f in FILTROS"
                :key="f.id"
                @click="ctx.filtro.value = f.id"
                class="filter-tag"
                :class="ctx.filtro.value === f.id ? 'filter-tag--active' : ''"
            >
                {{ f.label }}
            </button>
            <span class="filter-count">{{ ctx.total.value }} currículo(s)</span>
        </div>

        <!-- Conteúdo scrollável -->
        <div class="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1 space-y-3">

            <!-- Loading -->
            <div
                v-if="ctx.loading.value"
                class="flex items-center justify-center py-16"
            >
                <div class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            </div>

            <!-- Empty -->
            <div
                v-else-if="ctx.propostas.value.length === 0"
                class="empty-state"
            >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="mb-3 text-secondary/40">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-secondary/60">Nenhum currículo recebido</p>
                <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Os currículos enviados pela página pública aparecerão aqui</p>
            </div>

            <!-- Cards -->
            <template v-else>
                <div
                    v-for="p in ctx.propostas.value"
                    :key="p.id"
                    class="card-item"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex flex-col gap-1 flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h4 class="text-sm font-bold text-text truncate">
                                    {{ p.nome || "—" }}
                                </h4>
                                <span
                                    class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                                    :class="getStatusInfo(p).cls"
                                >
                                    {{ getStatusInfo(p).label }}
                                </span>
                            </div>

                            <div class="flex items-center gap-3 text-[10px] text-secondary/60">
                                <span class="flex items-center gap-1">
                                    <Icon name="ph:envelope-light" class="w-3 h-3" />
                                    {{ p.email || "—" }}
                                </span>
                                <span v-if="p.telefone" class="flex items-center gap-1">
                                    <Icon name="ph:phone-light" class="w-3 h-3" />
                                    {{ p.telefone }}
                                </span>
                            </div>

                            <p v-if="p.minibio" class="text-xs text-secondary line-clamp-2 mt-1">
                                {{ p.minibio }}
                            </p>

                            <div class="flex items-center gap-3 mt-1 text-[9px] text-secondary/50">
                                <span>Enviado: {{ formatDate(p.criado_em) }}</span>
                                <span v-if="p.edital_nome">Edital: {{ p.edital_nome }}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                            <a
                                v-if="p.id_curriculo"
                                :href="`/api/r2/sign?id=${p.id_curriculo}`"
                                target="_blank"
                                class="card-btn-icon"
                                title="Visualizar currículo"
                            >
                                <Icon name="ph:file-light" class="w-4 h-4" />
                            </a>

                            <button
                                v-if="!p.visto"
                                @click="ctx.marcarVisto(p.id)"
                                class="card-btn-icon"
                                title="Marcar como visto"
                            >
                                <Icon name="ph:eye-light" class="w-4 h-4" />
                            </button>

                            <button
                                v-if="p.visto && p.considerado !== true"
                                @click="ctx.considerar(p.id, true)"
                                class="card-btn-icon"
                                title="Chamar"
                            >
                                <Icon name="ph:phone-call-light" class="w-4 h-4" />
                            </button>

                            <button
                                v-if="p.visto && p.considerado !== false"
                                @click="ctx.considerar(p.id, false)"
                                class="card-btn-icon"
                                title="Dispensar"
                            >
                                <Icon name="ph:x-light" class="w-4 h-4" />
                            </button>

                            <button
                                @click="ctx.excluirProposta(p.id)"
                                class="card-btn-icon"
                                title="Excluir"
                            >
                                <Icon name="ph:trash-light" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Paginação -->
        <div
            v-if="ctx.totalPaginas.value > 1"
            class="flex items-center justify-center gap-2 shrink-0 pt-3 pb-1 border-t border-divider mt-3"
        >
            <button
                :disabled="ctx.pagina.value <= 1"
                @click="ctx.irParaPagina(ctx.pagina.value - 1); ctx.fetchPropostas()"
                class="paginate-btn"
            >
                Anterior
            </button>
            <span class="text-[10px] text-secondary/50 font-bold px-2">
                {{ ctx.pagina.value }} / {{ ctx.totalPaginas.value }}
            </span>
            <button
                :disabled="ctx.pagina.value >= ctx.totalPaginas.value"
                @click="ctx.irParaPagina(ctx.pagina.value + 1); ctx.fetchPropostas()"
                class="paginate-btn"
            >
                Próximo
            </button>
        </div>
    </div>
</template>

<style scoped>
/* ── Filter bar ───────────────────────────────────── */
.filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    padding: 10px 14px;
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 12px;
    flex-shrink: 0;
}
.filter-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 6px 14px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--color-secondary);
    cursor: pointer;
    transition: all 0.15s;
}
.filter-tag:hover {
    color: var(--color-text);
}
.filter-tag--active {
    background: rgba(139,92,246,0.14);
    color: var(--color-primary);
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.filter-count {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-secondary);
    opacity: 0.5;
    white-space: nowrap;
    margin-left: auto;
}

/* ── Empty state ──────────────────────────────────── */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    background: var(--color-secondary-surface);
    border: 2px dashed var(--color-divider);
    border-radius: 1rem;
    text-align: center;
}

/* ── Card ──────────────────────────────────────────── */
.card-item {
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 14px;
    padding: 14px 16px;
    transition: all 0.15s ease;
}
.card-item:hover {
    border-color: rgba(139,92,246,0.3);
    background: var(--color-secondary-surface-hover);
    transform: translateX(2px);
}
.card-btn-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
}
.card-btn-icon:hover {
    background: var(--color-secondary-surface-hover);
    color: var(--color-text);
}

/* ── Paginação ────────────────────────────────────── */
.paginate-btn {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: transparent;
    border: 1px solid var(--color-divider);
    color: var(--color-secondary);
    cursor: pointer;
    transition: all 0.15s;
}
.paginate-btn:hover:not(:disabled) {
    background: var(--color-secondary-surface-hover);
    color: var(--color-text);
}
.paginate-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
}

/* ── Scrollbar ────────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 4px; }
</style>
