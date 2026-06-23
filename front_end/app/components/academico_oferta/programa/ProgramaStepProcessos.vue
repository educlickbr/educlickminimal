<template>
    <div class="flex flex-col gap-6">

        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h4 class="step-section-title">Processos Seletivos</h4>
                <p class="step-section-desc">Cadastre as janelas de seleção. Os períodos não podem se sobrepor.</p>
            </div>
            <button
                @click="$emit('addProcesso')"
                :disabled="!canAddProcesso"
                class="add-processo-btn"
                :class="{ 'add-processo-btn--disabled': !canAddProcesso }"
            >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Novo Processo
            </button>
        </div>

        <!-- Processo cards -->
        <div class="flex flex-col gap-4">
            <div
                v-for="(processo, idx) in processos"
                :key="processo.id || idx"
                class="processo-card"
            >
                <!-- Card header -->
                <div class="processo-card-header">
                    <div class="processo-badge">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <path d="M4 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.4"/>
                            <path d="M5 6h4M5 8.5h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                        </svg>
                        Processo {{ idx + 1 }}
                    </div>
                    <button
                        v-if="processos.length > 1"
                        @click="$emit('removeProcesso', idx)"
                        class="remove-btn"
                        title="Remover"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>

                <!-- Nome do processo -->
                <div class="proc-field">
                    <label class="proc-label">Nome do Processo</label>
                    <input
                        type="text"
                        v-model="processo.nome_processo"
                        placeholder="Ex: Vestibular 2026/1"
                        class="proc-input"
                    />
                </div>

                <!-- Grid de datas -->
                <div class="proc-dates-grid">
                    <!-- Processo seletivo -->
                    <div class="proc-date-group">
                        <div class="proc-date-group-header proc-date-group-header--primary">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/>
                                <path d="M1 6h12M4 1v2M10 1v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                            </svg>
                            Período do Processo Seletivo
                        </div>
                        <div class="proc-date-row">
                            <div class="proc-field">
                                <label class="proc-label">Início</label>
                                <input type="datetime-local" v-model="processo.data_inicio" class="proc-input" />
                            </div>
                            <div class="proc-field">
                                <label class="proc-label">Fim</label>
                                <input type="datetime-local" v-model="processo.data_fim" class="proc-input" />
                            </div>
                        </div>
                    </div>

                    <!-- Matrícula -->
                    <div class="proc-date-group">
                        <div class="proc-date-group-header proc-date-group-header--green">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/>
                                <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                                <path d="M10 7l1.5 1.5L13 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Período de Matrícula
                            <span class="proc-optional-tag">Opcional</span>
                        </div>
                        <div class="proc-date-row">
                            <div class="proc-field">
                                <label class="proc-label">Início</label>
                                <input type="datetime-local" v-model="processo.matricula_inicio" class="proc-input proc-input--green" />
                            </div>
                            <div class="proc-field">
                                <label class="proc-label">Fim</label>
                                <input type="datetime-local" v-model="processo.matricula_fim" class="proc-input proc-input--green" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Validação -->
        <div v-if="validationMessage" class="proc-validation proc-validation--err">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="shrink-0 mt-0.5">
                <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M8 6v4M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>{{ validationMessage }}</p>
        </div>
        <div v-else class="proc-validation proc-validation--ok">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Regra ativa: sem sobreposição entre processos.</p>
        </div>

    </div>
</template>

<script setup lang="ts">
defineProps<{
    processos: {
        id: string | null;
        nome_processo: string;
        data_inicio: string | null;
        data_fim: string | null;
        matricula_inicio: string | null;
        matricula_fim: string | null;
    }[];
    canAddProcesso: boolean;
    validationMessage: string | null;
}>();

defineEmits<{
    addProcesso: [];
    removeProcesso: [index: number];
}>();
</script>

<style scoped>
/* ── Section header ──────────────────────────────── */
.step-section-title {
    font-size: 13px; font-weight: 900; color: rgba(232,230,240,0.9);
    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;
}
.step-section-desc { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); }

/* ── Add button ──────────────────────────────────── */
.add-processo-btn {
    display: flex; align-items: center; gap: 6px; white-space: nowrap;
    padding: 9px 16px; border-radius: 10px;
    border: 1px solid rgba(139,92,246,0.25); background: rgba(139,92,246,0.08);
    color: #a78bfa; font-size: 10px; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s ease; flex-shrink: 0;
}
.add-processo-btn:hover { background: rgba(139,92,246,0.14); border-color: rgba(139,92,246,0.4); }
.add-processo-btn--disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Process card ────────────────────────────────── */
.processo-card {
    display: flex; flex-direction: column; gap: 16px;
    padding: 20px; border-radius: 14px;
    background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
}

.processo-card-header {
    display: flex; align-items: center; justify-content: space-between;
}
.processo-badge {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em;
    color: #a78bfa; background: rgba(139,92,246,0.1);
    border: 1px solid rgba(139,92,246,0.2);
    padding: 6px 12px; border-radius: 20px;
}
.remove-btn {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.06);
    color: #f87171; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.remove-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); }

/* ── Fields ──────────────────────────────────────── */
.proc-field { display: flex; flex-direction: column; gap: 6px; }
.proc-label {
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.14em; color: rgba(255,255,255,0.3);
}
.proc-input {
    width: 100%; padding: 10px 12px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.04);
    color: rgba(232,230,240,0.9); font-size: 12px; font-weight: 700;
    outline: none; transition: border-color 0.15s ease;
}
.proc-input:focus { border-color: rgba(139,92,246,0.45); }
.proc-input--green:focus { border-color: rgba(34,197,94,0.4); }

/* ── Date groups ─────────────────────────────────── */
.proc-dates-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
@media (max-width: 600px) {
    .proc-dates-grid { grid-template-columns: 1fr; }
}
.proc-date-group { display: flex; flex-direction: column; gap: 12px; }

.proc-date-group-header {
    display: flex; align-items: center; gap: 7px;
    font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em;
    padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.proc-date-group-header--primary { color: #a78bfa; }
.proc-date-group-header--green   { color: #4ade80; }

.proc-optional-tag {
    margin-left: auto; font-size: 8px; font-weight: 900;
    padding: 2px 6px; border-radius: 4px;
    background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);
    color: rgba(74,222,128,0.7); text-transform: uppercase; letter-spacing: 0.1em;
}

.proc-date-row { display: flex; flex-direction: column; gap: 8px; }

/* ── Validação ───────────────────────────────────── */
.proc-validation {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px; border-radius: 10px;
    font-size: 10px; font-weight: 700; line-height: 1.5;
}
.proc-validation--err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
.proc-validation--ok  { background: rgba(34,197,94,0.08);  border: 1px solid rgba(34,197,94,0.2);  color: #4ade80; }
</style>
