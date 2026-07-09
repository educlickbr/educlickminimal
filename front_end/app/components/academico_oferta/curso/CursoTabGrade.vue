<template>
    <div class="flex flex-col gap-5">

        <!-- Estado: curso ainda não salvo -->
        <div v-if="!savedCursoId" class="grade-pending">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-3 text-white/15">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 8v4M12 16v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p class="grade-pending-title">Salve o curso primeiro</p>
            <p class="grade-pending-desc">Para gerenciar a grade curricular, o curso precisa ser salvo na aba "Informações Gerais".</p>
        </div>

        <div v-else class="flex flex-col gap-5">

            <!-- Form de adicionar módulo -->
            <div class="grade-form-card">
                <h4 class="grade-form-title">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                        <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                        <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                        <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                    </svg>
                    Adicionar Módulo à Grade
                </h4>
                <div class="grade-form-row">
                    <div class="grade-field" style="flex: 3">
                        <label class="grade-label">Módulo Acadêmico</label>
                        <select v-model="formCM.id_modulo" class="grade-select">
                            <option :value="null" disabled>Selecione um módulo disponível...</option>
                            <option v-for="m in modulosDisponiveis" :key="m.id" :value="m.id">
                                {{ m.nome_modulo }}
                            </option>
                        </select>
                    </div>
                    <div class="grade-field" style="flex: 1; min-width: 90px">
                        <label class="grade-label">Posição</label>
                        <input type="number" v-model="formCM.ordem" class="grade-input" />
                    </div>
                    <button
                        @click="$emit('addModulo')"
                        :disabled="loadingCM || !formCM.id_modulo"
                        class="grade-add-btn"
                    >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        {{ loadingCM ? "Vinculando..." : "Vincular" }}
                    </button>
                </div>
            </div>

            <!-- Lista de módulos -->
            <div class="flex flex-col gap-2">
                <div class="grade-list-header">
                    <span>Grade Curricular</span>
                    <span class="grade-list-count">{{ modulosDoCurso.length }} módulo{{ modulosDoCurso.length !== 1 ? 's' : '' }}</span>
                </div>

                <div v-if="loadingModulosCurso" class="grade-loading">
                    <div class="grade-spinner" />
                </div>

                <div
                    v-else-if="modulosDoCurso.length === 0"
                    class="grade-empty"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/15">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    Nenhum módulo vinculado a este curso
                </div>

                <div
                    v-for="mc in modulosDoCurso"
                    :key="mc.id_modulo"
                    class="grade-row"
                >
                    <!-- Ordem -->
                    <div class="grade-row-ordem">{{ mc.ordem ?? 0 }}</div>

                    <!-- Info -->
                    <div class="grade-row-info">
                        <p class="grade-row-nome">{{ mc.nome_modulo }}</p>
                        <div class="grade-row-meta">
                            <span v-if="mc.carga_horaria" class="grade-row-carga">
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.3"/>
                                    <path d="M6 3v3l2 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                                </svg>
                                {{ mc.carga_horaria }} min
                            </span>
                            <span v-if="mc.descricao" class="grade-row-desc">
                                {{ mc.descricao?.replace(/<[^>]*>/g, '').substring(0, 70) }}...
                            </span>
                        </div>
                    </div>

                    <!-- Ação -->
                    <button
                        @click="$emit('removeModulo', mc.id_modulo)"
                        class="grade-row-remove"
                        title="Remover da Grade"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    savedCursoId: string | null;
    formCM: { id_modulo: string | null; ordem: number };
    modulosDisponiveis: { id: string; nome_modulo: string }[];
    modulosDoCurso: any[];
    loadingModulosCurso: boolean;
    loadingCM: boolean;
}>();
defineEmits<{ addModulo: []; removeModulo: [id_modulo: string] }>();
</script>

<style scoped>
/* ── Pending state ───────────────────────────────── */
.grade-pending {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 48px 24px; border-radius: 12px;
    background: rgba(255,255,255,0.015); border: 1px dashed rgba(255,255,255,0.07);
}
.grade-pending-title { font-size: 12px; font-weight: 900; color: rgba(255,255,255,0.35); margin-bottom: 6px; }
.grade-pending-desc  { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.2); line-height: 1.5; max-width: 280px; }

/* ── Form card ───────────────────────────────────── */
.grade-form-card {
    display: flex; flex-direction: column; gap: 14px;
    padding: 18px 20px; border-radius: 12px;
    background: rgba(139,92,246,0.04); border: 1px solid rgba(139,92,246,0.1);
}
.grade-form-title {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.14em; color: #a78bfa;
}
.grade-form-row {
    display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;
}
.grade-field { display: flex; flex-direction: column; gap: 6px; }
.grade-label {
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.14em; color: rgba(255,255,255,0.3);
}
.grade-input, .grade-select {
    width: 100%; padding: 10px 12px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.04);
    color: rgba(232,230,240,0.9); font-size: 12px; font-weight: 700;
    outline: none; transition: border-color 0.15s;
}
.grade-input:focus, .grade-select:focus { border-color: rgba(139,92,246,0.45); }

.grade-add-btn {
    display: flex; align-items: center; gap: 6px; white-space: nowrap;
    padding: 10px 16px; border-radius: 9px; border: none; flex-shrink: 0;
    background: linear-gradient(135deg,#7c3aed,#8b5cf6);
    color: #fff; font-size: 10px; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s;
    box-shadow: 0 3px 10px rgba(139,92,246,0.3); height: 38px;
}
.grade-add-btn:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); }
.grade-add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── List ────────────────────────────────────────── */
.grade-list-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.14em; color: rgba(255,255,255,0.25); padding: 0 2px;
}
.grade-list-count {
    padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 900;
    background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.15); color: #a78bfa;
}

.grade-loading { display: flex; justify-content: center; padding: 20px; }
.grade-spinner {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.06); border-top-color: #8b5cf6;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.grade-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 32px 16px; border-radius: 10px;
    background: rgba(255,255,255,0.015); border: 1px dashed rgba(255,255,255,0.06);
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.2);
}

/* ── Module row ──────────────────────────────────── */
.grade-row {
    display: flex; align-items: center; gap: 0;
    border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02); overflow: hidden;
    transition: border-color 0.15s ease;
}
.grade-row:hover { border-color: rgba(139,92,246,0.18); }

.grade-row-ordem {
    width: 40px; min-height: 48px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(139,92,246,0.06); border-right: 1px solid rgba(255,255,255,0.04);
    font-size: 10px; font-weight: 900; color: rgba(139,92,246,0.5);
    font-variant-numeric: tabular-nums;
}

.grade-row-info {
    flex: 1; min-width: 0; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;
}
.grade-row-nome { font-size: 12px; font-weight: 900; color: rgba(232,230,240,0.88); }
.grade-row-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.grade-row-carga {
    display: flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 700; color: rgba(139,92,246,0.6);
}
.grade-row-desc {
    font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.2);
    font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;
}

.grade-row-remove {
    width: 42px; min-height: 48px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; border-left: 1px solid rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.2); cursor: pointer; transition: all 0.15s;
}
.grade-row-remove:hover { background: rgba(239,68,68,0.08); color: #f87171; }
</style>
