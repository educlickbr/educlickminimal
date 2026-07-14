<script setup lang="ts">
import type { UseDocentesEditaisReturn } from "~/composables/docentes/useDocentesEditais";

const props = defineProps<{
    ctx: UseDocentesEditaisReturn;
}>();

const emit = defineEmits<{
    (e: "novo-edital"): void;
    (e: "editar-edital", edital: any): void;
}>();

async function handleExcluir(id: string) {
    if (confirm("Excluir este edital? As inscrições também serão removidas.")) {
        await props.ctx.excluirEdital(id);
    }
}

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4 shrink-0">
            <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                Editais de Seleção
            </span>
            <button
                @click="emit('novo-edital')"
                class="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
            >
                <Icon name="ph:plus-bold" class="w-3.5 h-3.5" />
                Novo Edital
            </button>
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
                v-else-if="ctx.editais.value.length === 0"
                class="empty-state"
            >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="mb-3 text-white/20">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhum edital criado</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Crie editais para selecionar novos docentes</p>
                <button
                    @click="emit('novo-edital')"
                    class="mt-5 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                >
                    Criar Primeiro Edital
                </button>
            </div>

            <!-- Cards -->
            <template v-else>
                <div
                    v-for="edital in ctx.editais.value"
                    :key="edital.id"
                    class="card-item"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex flex-col gap-1 flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h4 class="text-sm font-bold text-text truncate">
                                    {{ edital.nome }}
                                </h4>
                                <span
                                    class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                                    :class="
                                        edital.status === 'ativo'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-white/[0.04] border-white/10 text-white/40'
                                    "
                                >
                                    {{ edital.status === 'ativo' ? '● Ativo' : '○ Inativo' }}
                                </span>
                            </div>

                            <p v-if="edital.descricao" class="text-xs text-secondary/60 line-clamp-2">
                                {{ edital.descricao }}
                            </p>

                            <div class="flex items-center gap-4 mt-1">
                                <span class="text-[10px] text-secondary/40 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Icon name="ph:calendar-light" class="w-3 h-3" />
                                    {{ formatDate(edital.data_ini) }} — {{ formatDate(edital.data_fim) }}
                                </span>
                                <span class="text-[10px] text-primary font-bold flex items-center gap-1">
                                    <Icon name="ph:users-light" class="w-3 h-3" />
                                    {{ edital.qtd_inscricoes }} inscrição(ões)
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <button
                                @click="emit('editar-edital', edital)"
                                class="card-btn-icon"
                                title="Editar"
                            >
                                <Icon name="ph:pencil-light" class="w-4 h-4" />
                            </button>
                            <button
                                @click="handleExcluir(edital.id)"
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
    </div>
</template>

<style scoped>
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
.card-btn-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
}
.card-btn-icon:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.6);
}

/* ── Scrollbar ────────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
</style>
