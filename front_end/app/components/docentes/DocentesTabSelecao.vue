<script setup lang="ts">
import type { UseDocentesSelecaoReturn } from "~/composables/docentes/useDocentesSelecao";

const props = defineProps<{
    ctx: UseDocentesSelecaoReturn;
}>();

const emit = defineEmits<{
    (e: "avaliar", inscricao: any): void;
}>();

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    aguardando: {
        label: "○ Aguardando",
        cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
    aprovado: {
        label: "✓ Aprovado",
        cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    },
    recusado: {
        label: "✕ Recusado",
        cls: "bg-red-500/10 border-red-500/20 text-red-400",
    },
    suplente: {
        label: "◷ Suplente",
        cls: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    },
};

function getStatusInfo(status: string) {
    return STATUS_MAP[status] || STATUS_MAP.aguardando;
}

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR");
}

watch(
    () => props.ctx.editalSelecionado.value,
    () => {
        props.ctx.pagina.value = 1;
        props.ctx.fetchInscricoes();
    },
);

onMounted(() => {
    props.ctx.fetchEditaisDropdown();
});
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Filtros -->
        <div class="filter-bar">
            <select v-model="ctx.editalSelecionado.value" class="filter-select">
                <option value="" disabled>Selecione um edital</option>
                <option
                    v-for="e in ctx.editaisDisponiveis.value"
                    :key="e.id"
                    :value="e.id"
                >
                    {{ e.nome }}
                </option>
            </select>

            <span class="filter-count">
                {{ ctx.total.value }} candidato(s)
            </span>
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

            <!-- Nenhum edital selecionado -->
            <div
                v-else-if="!ctx.editalSelecionado.value"
                class="empty-state"
            >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="mb-3 text-white/20">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Selecione um edital</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Escolha um edital no filtro acima para ver os candidatos</p>
            </div>

            <!-- Empty -->
            <div
                v-else-if="ctx.inscricoes.value.length === 0"
                class="empty-state"
            >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="mb-3 text-white/20">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhuma inscrição</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Nenhum candidato se inscreveu neste edital ainda</p>
            </div>

            <!-- Cards -->
            <template v-else>
                <div
                    v-for="insc in ctx.inscricoes.value"
                    :key="insc.id"
                    class="card-item"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <div class="card-avatar">
                                {{ (insc.nome_completo || "?")[0].toUpperCase() }}
                            </div>
                            <div class="flex flex-col gap-0.5 min-w-0">
                                <span class="text-sm font-bold text-text truncate">
                                    {{ insc.nome_completo || "—" }}
                                </span>
                                <span class="text-[10px] text-secondary/60 truncate">
                                    {{ insc.email || "—" }}
                                </span>
                                <span class="text-[9px] text-secondary/40">
                                    Inscrito em {{ formatDate(insc.criado_em) }}
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <span
                                class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                                :class="getStatusInfo(insc.status)!.cls"
                            >
                                {{ getStatusInfo(insc.status)!.label }}
                            </span>
                            <button
                                @click="emit('avaliar', insc)"
                                class="card-btn-card"
                            >
                                Avaliar
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Paginação -->
        <div
            v-if="ctx.totalPaginas.value > 1"
            class="flex items-center justify-center gap-2 shrink-0 pt-3 pb-1 border-t border-white/5 mt-3"
        >
            <button
                :disabled="ctx.pagina.value <= 1"
                @click="ctx.irParaPagina(ctx.pagina.value - 1)"
                class="paginate-btn"
            >
                Anterior
            </button>
            <span class="text-[10px] text-secondary/40 font-bold px-2">
                {{ ctx.pagina.value }} / {{ ctx.totalPaginas.value }}
            </span>
            <button
                :disabled="ctx.pagina.value >= ctx.totalPaginas.value"
                @click="ctx.irParaPagina(ctx.pagina.value + 1)"
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
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    flex-shrink: 0;
}
.filter-select {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 12px;
    padding-right: 28px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.8);
    outline: none;
    transition: border-color 0.15s;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 6px center;
    background-repeat: no-repeat;
    background-size: 1em;
}
.filter-select:focus {
    border-color: rgba(139,92,246,0.35);
}
.filter-count {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.25);
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
    background: rgba(255,255,255,0.015);
    border: 2px dashed rgba(255,255,255,0.08);
    border-radius: 1rem;
    text-align: center;
}

/* ── Card ──────────────────────────────────────────── */
.card-item {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 14px;
    padding: 14px 16px;
    transition: all 0.15s ease;
}
.card-item:hover {
    border-color: rgba(139,92,246,0.3);
    background: rgba(139,92,246,0.03);
    transform: translateX(2px);
}
.card-avatar {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    background: rgba(139,92,246,0.1);
    border: 1px solid rgba(139,92,246,0.2);
    color: #a78bfa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14px;
    flex-shrink: 0;
}
.card-btn-card {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.45);
    cursor: pointer;
    transition: all 0.15s;
}
.card-btn-card:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
}

/* ── Paginação ────────────────────────────────────── */
.paginate-btn {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.45);
    cursor: pointer;
    transition: all 0.15s;
}
.paginate-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
}
.paginate-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
}

/* ── Scrollbar ────────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
</style>
