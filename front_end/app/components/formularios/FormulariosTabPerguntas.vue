<template>
    <div class="flex flex-col gap-6">

        <!-- Loading -->
        <div v-if="perguntasCtx.loading.value" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando perguntas...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="perguntasCtx.perguntas.value.length === 0" class="col-span-full ds-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-secondary">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="ds-name">Nenhuma pergunta cadastrada</p>
                <p class="ds-desc text-center mt-1">Crie perguntas para usar nos seus formulários</p>
                <button @click="perguntasCtx.openNova" class="ds-btn-primary mt-4">
                    Cadastrar Primeira Pergunta
                </button>
            </div>

            <div
                v-for="p in perguntasCtx.perguntas.value"
                :key="p.id"
                class="ds-card"
                @click="!p.global && perguntasCtx.openEditar(p)"
                :class="{ 'perg-card--global': p.global }"
            >
                <div class="perg-accent-bar" />
                <div class="ds-card-inner">

                    <!-- Header: avatar + badges + ações -->
                    <div class="perg-card-header">
                        <div class="ds-avatar">
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
                    <p class="ds-name">{{ p.label }}</p>

                    <!-- Nome interno -->
                    <p class="perg-interno ds-desc">
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
/* ── Card (thema-aware base via .ds-card) ──────── */
/* Cards globais: sem cursor de edição, hover mais sutil */
.perg-card--global { cursor: default; }
.perg-card--global:hover {
    border-color: rgba(245, 158, 11, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.perg-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.ds-card:not(.perg-card--global):hover .perg-accent-bar { opacity: 1; }
.perg-card--global .perg-accent-bar {
    background: linear-gradient(180deg, #d97706, #fbbf24);
}
.perg-card--global:hover .perg-accent-bar { opacity: 0.6; }

/* ── Header ─────────────────────────────────────── */
.perg-card-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.perg-card--global .ds-avatar {
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
    background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2);
    color: var(--color-primary);
}

.perg-card-actions {
    margin-left: auto; display: flex; gap: 5px;
    opacity: 0; transition: opacity 0.15s ease;
}
.ds-card:hover .perg-card-actions { opacity: 1; }

.action-btn {
    width: 26px; height: 26px; border-radius: 7px; border: none;
    background: var(--color-secondary-surface); color: var(--color-secondary);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-btn:hover { background: var(--color-secondary-surface-hover); color: var(--color-text); }
.action-edit:hover   { background: rgba(139,92,246,0.18); color: var(--color-primary); }
.action-delete:hover { background: rgba(239,68,68,0.15);  color: #fca5a5; }

/* ── Content ─────────────────────────────────────── */
.perg-interno {
    display: flex; align-items: center; gap: 5px;
    font-style: italic;
    font-variant-numeric: tabular-nums;
}
</style>
