<template>
    <div class="flex flex-col gap-6">

        <!-- Loading -->
        <div v-if="perguntasCtx.loading.value" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando perguntas...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="perguntasCtx.perguntas.value.length === 0" class="col-span-full empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/20">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhuma pergunta cadastrada</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Crie perguntas para usar nos seus formulários</p>
                <button @click="perguntasCtx.openNova" class="empty-cta">
                    Cadastrar Primeira Pergunta
                </button>
            </div>

            <div
                v-for="p in perguntasCtx.perguntas.value"
                :key="p.id"
                class="perg-card"
                @click="!p.global && perguntasCtx.openEditar(p)"
                :class="{ 'perg-card--global': p.global }"
            >
                <div class="perg-accent-bar" />
                <div class="perg-card-inner">

                    <!-- Header: avatar + badges + ações -->
                    <div class="perg-card-header">
                        <div class="perg-avatar">
                            {{ (p.label || "?").charAt(0).toUpperCase() }}
                        </div>

                        <div class="perg-header-badges">
                            <span v-if="p.global" class="perg-badge-global">
                                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M6 1C4.5 3 4 4.5 4 6s.5 3 2 5M6 1c1.5 2 2 3.5 2 5s-.5 3-2 5M1 6h10" stroke="currentColor" stroke-width="1.2"/>
                                </svg>
                                Global
                            </span>
                            <span class="perg-badge-tipo">{{ p.tipo_pergunta }}</span>
                        </div>

                        <div v-if="!p.global" class="perg-card-actions" @click.stop>
                            <button @click="perguntasCtx.openEditar(p)" class="action-btn action-edit" title="Editar">
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button @click="perguntasCtx.handleDelete(p.id)" class="action-btn action-delete" title="Excluir">
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Label -->
                    <p class="perg-label">{{ p.label }}</p>

                    <!-- Nome interno -->
                    <p class="perg-interno">
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                            <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        {{ p.nome_interno }}
                    </p>
                </div>
            </div>
        </div>

        <FormulariosModalPergunta
            v-if="perguntasCtx.showModal.value"
            v-model="perguntasCtx.showModal.value"
            :isEdit="perguntasCtx.isEdit.value"
            :initialData="perguntasCtx.editData.value"
            :idEntidade="idEntidade"
            :onSave="perguntasCtx.handleSave"
            @saved="perguntasCtx.handleSaved"
        />
    </div>
</template>

<script setup lang="ts">
import type { useFormulariosPerguntas } from "~/composables/formularios/useFormulariosPerguntas";

defineProps<{
    perguntasCtx: ReturnType<typeof useFormulariosPerguntas>;
    idEntidade: string | null;
}>();
</script>

<style scoped>
/* ── Card ──────────────────────────────────────── */
.perg-card {
    position: relative;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.perg-card:hover {
    border-color: rgba(139, 92, 246, 0.28);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(139,92,246,0.12);
}
/* Cards globais: sem cursor de edição, hover mais sutil */
.perg-card--global { cursor: default; }
.perg-card--global:hover {
    border-color: rgba(245, 158, 11, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.perg-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0; transition: opacity 0.2s ease;
}
.perg-card:not(.perg-card--global):hover .perg-accent-bar { opacity: 1; }
.perg-card--global .perg-accent-bar {
    background: linear-gradient(180deg, #d97706, #fbbf24);
}
.perg-card--global:hover .perg-accent-bar { opacity: 0.6; }

.perg-card-inner {
    padding: 18px 18px 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
}

/* ── Header ─────────────────────────────────────── */
.perg-card-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.perg-avatar {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa; font-size: 13px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.perg-card--global .perg-avatar {
    background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); color: #fbbf24;
}

.perg-header-badges { display: flex; align-items: center; gap: 5px; }

.perg-badge-global {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
    padding: 3px 7px; border-radius: 10px;
    background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25); color: #fbbf24;
}
.perg-badge-tipo {
    font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
    padding: 3px 7px; border-radius: 10px;
    background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15); color: rgba(167,139,250,0.7);
}

.perg-card-actions {
    margin-left: auto; display: flex; gap: 5px;
    opacity: 0; transition: opacity 0.15s ease;
}
.perg-card:hover .perg-card-actions { opacity: 1; }

.action-btn {
    width: 26px; height: 26px; border-radius: 7px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.35);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: #c4b5fd; }
.action-delete:hover { background: rgba(239,68,68,0.15);  color: #fca5a5; }

/* ── Content ─────────────────────────────────────── */
.perg-label {
    font-size: 13px; font-weight: 900; color: rgba(232,230,240,0.92);
    line-height: 1.3; margin-top: 2px;
}
.perg-interno {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700;
    color: rgba(255,255,255,0.22); font-style: italic;
    font-variant-numeric: tabular-nums;
}

/* ── Empty state ─────────────────────────────────── */
.empty-state {
    display: flex; flex-direction: column; align-items: center;
    padding: 52px 24px;
    background: rgba(255,255,255,0.015); border-radius: 14px;
    border: 1px dashed rgba(255,255,255,0.07);
}
.empty-cta {
    margin-top: 16px; padding: 9px 20px; border-radius: 10px;
    background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25);
    color: #c4b5fd; font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer;
    transition: all 0.15s ease;
}
.empty-cta:hover { background: rgba(139,92,246,0.2); }
</style>
