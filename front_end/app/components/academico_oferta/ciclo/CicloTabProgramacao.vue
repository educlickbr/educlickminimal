<template>
  <div class="flex flex-col gap-6">

    <!-- ① Grade Semanal -->
    <section class="prog-section">
      <div class="prog-section-header">
        <div class="prog-section-title">
          <span class="prog-step">1</span>
          <div>
            <h4 class="prog-label">Grade Semanal Regular</h4>
            <p class="prog-sublabel">Defina os dias e horários fixos de aula</p>
          </div>
        </div>
        <span v-if="diasSemana.length > 0" class="prog-badge">
          {{ diasSemana.length }} dia{{ diasSemana.length > 1 ? 's' : '' }}
        </span>
      </div>

      <div class="prog-card">
        <!-- Formulário -->
        <div class="prog-form-row">
          <div class="prog-field prog-field--wide">
            <label class="prog-field-label">Dia da Semana</label>
            <select v-model="formSemana.dia_sem" class="prog-select">
              <option :value="null" disabled>Selecione...</option>
              <option v-for="d in DOW_OPTIONS" :key="d.val" :value="d.val">{{ d.label }}</option>
            </select>
          </div>
          <div class="prog-field">
            <label class="prog-field-label">Início</label>
            <input type="time" v-model="formSemana.hora_ini" class="prog-input" />
          </div>
          <div class="prog-field">
            <label class="prog-field-label">Fim</label>
            <input type="time" v-model="formSemana.hora_fim" class="prog-input" />
          </div>
          <button @click="$emit('addDiaSemana')" class="prog-add-btn">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Adicionar
          </button>
        </div>

        <!-- Chips de dias -->
        <div v-if="diasSemana.length > 0" class="prog-chips">
          <div v-for="(d, idx) in diasSemana" :key="idx" class="prog-chip prog-chip--primary">
            <span class="prog-chip-day">{{ getDowLabel(d.dia_sem).substring(0, 3).toUpperCase() }}</span>
            <span class="prog-chip-time">{{ d.hora_ini }} – {{ d.hora_fim }}</span>
            <button @click="$emit('removeDiaSemana', idx)" class="prog-chip-remove">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ② Verificação de Carga -->
    <section class="prog-section">
      <div class="prog-section-header">
        <div class="prog-section-title">
          <span class="prog-step">2</span>
          <div>
            <h4 class="prog-label">Verificação de Carga Horária</h4>
            <p class="prog-sublabel">O calendário só pode ser gravado se o saldo for zero</p>
          </div>
        </div>
        <button
          @click="$emit('simularCalendario')"
          :disabled="loadingSimulacao || diasSemana.length === 0"
          class="prog-sim-btn"
        >
          <svg v-if="loadingSimulacao" class="prog-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1a6 6 0 1 1 0 12A6 6 0 0 1 7 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="18" stroke-dashoffset="6"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 1 1 10 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 7l-2-2M12 7l-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ loadingSimulacao ? "Calculando..." : "Simular Cronograma" }}
        </button>
      </div>

      <!-- Resultados -->
      <div v-if="simulacaoData?.success" class="prog-sim-results">
        <div class="prog-sim-stat">
          <span class="prog-sim-stat-label">Encontros</span>
          <span class="prog-sim-stat-value">{{ simulacaoData.dias_gerados?.filter((d: any) => ['regular','extra'].includes(d.tipo)).length || 0 }}</span>
        </div>
        <div class="prog-sim-stat">
          <span class="prog-sim-stat-label">Início</span>
          <span class="prog-sim-stat-value prog-sim-stat-value--sm">{{ formatDateShort(dataIni) }}</span>
        </div>
        <div class="prog-sim-stat">
          <span class="prog-sim-stat-label">Fim Previsto</span>
          <span class="prog-sim-stat-value prog-sim-stat-value--sm">{{ formatDateShort(simulacaoData.data_fim) }}</span>
        </div>
        <div class="prog-sim-status" :class="simulacaoData.saldo_minutos === 0 ? 'prog-sim-status--ok' : 'prog-sim-status--err'">
          <svg v-if="simulacaoData.saldo_minutos === 0" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v5M9 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <div>
            <span class="prog-sim-status-label">Status da Carga</span>
            <span class="prog-sim-status-value">
              {{ simulacaoData.saldo_minutos === 0 ? "Grade Completa" : simulacaoData.saldo_minutos > 0 ? `Falta ${formatCarga(simulacaoData.saldo_minutos)}` : `Excede ${formatCarga(Math.abs(simulacaoData.saldo_minutos))}` }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="simulacaoData && !simulacaoData.success" class="prog-error">
        Erro: {{ simulacaoData.message }}
      </div>
    </section>

    <!-- ③ Dias Extras -->
    <section v-if="simulacaoData" class="prog-section">
      <div class="prog-section-header">
        <div class="prog-section-title">
          <span class="prog-step prog-step--orange">3</span>
          <div>
            <h4 class="prog-label">Ajustes de Reposição / Inclusões Extras</h4>
            <p class="prog-sublabel">Adicione datas avulsas para fechar a carga horária</p>
          </div>
        </div>
        <span v-if="diasExtras.length > 0" class="prog-badge prog-badge--orange">
          {{ diasExtras.length }} inclusão{{ diasExtras.length > 1 ? 'ões' : '' }}
        </span>
      </div>

      <div class="prog-card prog-card--orange">
        <div class="prog-form-row">
          <div class="prog-field">
            <label class="prog-field-label">Data</label>
            <input type="date" v-model="formExtra.data" class="prog-input" />
          </div>
          <div class="prog-field">
            <label class="prog-field-label">Início</label>
            <input type="time" v-model="formExtra.hora_ini" class="prog-input" />
          </div>
          <div class="prog-field">
            <label class="prog-field-label">Fim</label>
            <input type="time" v-model="formExtra.hora_fim" class="prog-input" />
          </div>
          <div class="prog-field prog-field--wide">
            <label class="prog-field-label">Motivo</label>
            <input type="text" v-model="formExtra.observacoes" placeholder="Ex: Reposição feriado" class="prog-input" />
          </div>
          <button @click="$emit('addDiaExtra')" class="prog-add-btn prog-add-btn--orange">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Incluir
          </button>
        </div>

        <div v-if="diasExtras.length > 0" class="prog-chips">
          <div v-for="(d, idx) in diasExtras" :key="idx" class="prog-chip prog-chip--orange">
            <span class="prog-chip-day">{{ formatDateShort(d.data) }}</span>
            <span class="prog-chip-time">{{ d.hora_ini }} – {{ d.hora_fim }}</span>
            <button @click="$emit('removeDiaExtra', idx)" class="prog-chip-remove">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ④ Cronograma Detalhado -->
    <section v-if="simulacaoData?.success" class="prog-section">
      <div class="prog-section-header">
        <div class="prog-section-title">
          <span class="prog-step prog-step--muted">4</span>
          <div>
            <h4 class="prog-label">Cronograma Detalhado Gerado</h4>
            <p class="prog-sublabel">Visualização de todos os encontros e suspensões</p>
          </div>
        </div>
      </div>

      <div class="prog-schedule">
        <div
          v-for="(dia, i) in simulacaoData.dias_gerados || []"
          :key="i"
          class="prog-schedule-row"
          :class="{
            'prog-schedule-row--regular': dia.tipo === 'regular',
            'prog-schedule-row--extra':   dia.tipo === 'extra',
            'prog-schedule-row--feriado': dia.tipo === 'feriado',
            'prog-schedule-row--evento':  dia.tipo === 'evento',
          }"
        >
          <!-- Número da aula -->
          <div class="prog-sch-num">
            <span v-if="['regular','extra'].includes(dia.tipo)">#{{ getAulaNumber(dia, i) }}</span>
          </div>

          <!-- Data -->
          <div class="prog-sch-date">
            <span class="prog-sch-date-val">{{ formatDateShort(dia.data) }}</span>
            <span class="prog-sch-dow">{{ getDowLabel(new Date(dia.data + 'T12:00:00').getUTCDay()).substring(0, 3) }}</span>
          </div>

          <!-- Tipo badge -->
          <span class="prog-sch-type" :class="`prog-sch-type--${dia.tipo}`">{{ dia.tipo }}</span>

          <!-- Observação -->
          <span class="prog-sch-obs">{{ dia.observacao }}</span>

          <!-- Horário -->
          <div class="prog-sch-time">
            <template v-if="dia.hora_ini && dia.hora_fim">
              <span>{{ dia.hora_ini }}<span class="prog-sch-sep">–</span>{{ dia.hora_fim }}</span>
              <span class="prog-sch-dur">{{ formatCarga(dia.duracao_minutos) }}</span>
            </template>
            <span v-else class="prog-sch-suspended">Suspenso</span>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  diasSemana: any[]; formSemana: { dia_sem: number | null; hora_ini: string; hora_fim: string }; DOW_OPTIONS: { val: number; label: string }[];
  diasExtras: any[]; formExtra: { data: string; hora_ini: string; hora_fim: string; observacoes: string };
  simulacaoData: any; loadingSimulacao: boolean; dataIni: string;
  formatCarga: (minutos: any) => string; formatDateShort: (dateStr: string) => string;
  getDowLabel: (val: number) => string; getAulaNumber: (dia: any, index: number | string) => number;
}>();
defineEmits<{ addDiaSemana: []; removeDiaSemana: [index: number]; simularCalendario: []; addDiaExtra: []; removeDiaExtra: [index: number] }>();
</script>

<style scoped>
/* ── Section wrapper ───────────────────────────── */
.prog-section { display: flex; flex-direction: column; gap: 12px; }

.prog-section-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.prog-section-title { display: flex; align-items: flex-start; gap: 12px; }

.prog-step {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.22);
  color: #a78bfa; font-size: 11px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  margin-top: 1px;
}
.prog-step--orange {
  background: rgba(249,115,22,0.12); border-color: rgba(249,115,22,0.22); color: #fb923c;
}
.prog-step--muted {
  background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3);
}

.prog-label {
  font-size: 11px; font-weight: 900; color: rgba(232,230,240,0.85);
  text-transform: uppercase; letter-spacing: 0.12em;
}
.prog-sublabel {
  font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.28);
  margin-top: 3px;
}

.prog-badge {
  padding: 4px 10px; border-radius: 20px; white-space: nowrap;
  font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); color: #a78bfa;
  flex-shrink: 0;
}
.prog-badge--orange {
  background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.2); color: #fb923c;
}

/* ── Card ──────────────────────────────────────── */
.prog-card {
  background: rgba(139,92,246,0.04);
  border: 1px solid rgba(139,92,246,0.1);
  border-radius: 14px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.prog-card--orange {
  background: rgba(249,115,22,0.04);
  border-color: rgba(249,115,22,0.1);
}

/* ── Form row ──────────────────────────────────── */
.prog-form-row {
  display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;
}
.prog-field { display: flex; flex-direction: column; gap: 6px; min-width: 120px; flex: 1; }
.prog-field--wide { flex: 2; min-width: 180px; }

.prog-field-label {
  font-size: 9px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.14em; color: rgba(255,255,255,0.35); padding: 0 2px;
}
.prog-input, .prog-select {
  width: 100%; padding: 10px 12px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.04);
  color: rgba(232,230,240,0.9); font-size: 12px; font-weight: 700;
  outline: none; transition: border-color 0.15s ease, background 0.15s ease;
}
.prog-input:focus, .prog-select:focus {
  border-color: rgba(139,92,246,0.45);
  background: rgba(139,92,246,0.06);
  box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
}

.prog-add-btn {
  display: flex; align-items: center; gap: 6px; white-space: nowrap;
  padding: 10px 18px; border-radius: 9px; border: none;
  background: linear-gradient(135deg,#7c3aed,#8b5cf6);
  color: #fff; font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(139,92,246,0.3);
  flex-shrink: 0; height: 40px;
}
.prog-add-btn:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); transform: translateY(-1px); }
.prog-add-btn--orange {
  background: linear-gradient(135deg,#ea580c,#f97316);
  box-shadow: 0 4px 12px rgba(249,115,22,0.3);
}
.prog-add-btn--orange:hover { background: linear-gradient(135deg,#c2410c,#ea580c); }

/* ── Chips ─────────────────────────────────────── */
.prog-chips {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.05);
}
.prog-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
}
.prog-chip--primary { border-color: rgba(139,92,246,0.2); }
.prog-chip--orange  { border-color: rgba(249,115,22,0.2);  }

.prog-chip-day {
  font-size: 10px; font-weight: 900;
  color: #a78bfa;
}
.prog-chip--orange .prog-chip-day { color: #fb923c; }

.prog-chip-time {
  font-size: 10px; font-weight: 600;
  color: rgba(255,255,255,0.45);
  font-variant-numeric: tabular-nums;
}
.prog-chip-remove {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.25); display: flex; padding: 0;
  transition: color 0.15s;
}
.prog-chip-remove:hover { color: #f87171; }

/* ── Simulação results ─────────────────────────── */
.prog-sim-btn {
  display: flex; align-items: center; gap: 7px; white-space: nowrap;
  padding: 10px 20px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.6); font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease; flex-shrink: 0;
}
.prog-sim-btn:hover:not(:disabled) {
  background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.3); color: #c4b5fd;
}
.prog-sim-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.prog-spin { animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.prog-sim-results {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px;
}
.prog-sim-stat {
  display: flex; flex-direction: column; gap: 6px; align-items: center;
  padding: 16px 12px; border-radius: 12px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
}
.prog-sim-stat-label {
  font-size: 8px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.12em; color: rgba(255,255,255,0.3);
}
.prog-sim-stat-value {
  font-size: 22px; font-weight: 900; color: rgba(232,230,240,0.9); line-height: 1;
}
.prog-sim-stat-value--sm { font-size: 12px; font-variant-numeric: tabular-nums; }

.prog-sim-status {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; border-radius: 12px; grid-column: span 2;
}
.prog-sim-status--ok  { background: rgba(34,197,94,0.08);  border: 1px solid rgba(34,197,94,0.2);  color: #4ade80; }
.prog-sim-status--err { background: rgba(239,68,68,0.08);   border: 1px solid rgba(239,68,68,0.2);  color: #f87171; }

.prog-sim-status-label {
  font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em;
  opacity: 0.7; display: block;
}
.prog-sim-status-value {
  font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;
}

.prog-error {
  padding: 14px 16px; border-radius: 10px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  color: #f87171; font-size: 11px; font-weight: 700;
}

/* ── Schedule ──────────────────────────────────── */
.prog-schedule {
  border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
  background: rgba(255,255,255,0.02); overflow: hidden;
  max-height: 320px; overflow-y: auto;
}
.prog-schedule-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; border-left: 3px solid transparent;
  transition: background 0.1s;
}
.prog-schedule-row:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.04); }
.prog-schedule-row:hover { background: rgba(255,255,255,0.025); }
.prog-schedule-row--regular { border-left-color: rgba(139,92,246,0.4); }
.prog-schedule-row--extra   { border-left-color: rgba(249,115,22,0.4); }
.prog-schedule-row--feriado { border-left-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.03); }
.prog-schedule-row--evento  { border-left-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.03); }

.prog-sch-num {
  width: 28px; flex-shrink: 0;
  font-size: 9px; font-weight: 900; color: rgba(255,255,255,0.2);
}
.prog-sch-date { flex-shrink: 0; width: 60px; }
.prog-sch-date-val { font-size: 11px; font-weight: 700; color: rgba(232,230,240,0.8); display: block; font-variant-numeric: tabular-nums; }
.prog-sch-dow  { font-size: 8px;  font-weight: 900; color: rgba(255,255,255,0.2); text-transform: uppercase; }

.prog-sch-type {
  flex-shrink: 0; font-size: 8px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 3px 8px; border-radius: 5px;
}
.prog-sch-type--regular { background: rgba(139,92,246,0.12); color: #a78bfa; }
.prog-sch-type--extra   { background: rgba(249,115,22,0.12);  color: #fb923c; }
.prog-sch-type--feriado { background: rgba(239,68,68,0.12);   color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
.prog-sch-type--evento  { background: rgba(245,158,11,0.12);  color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }

.prog-sch-obs { flex: 1; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.35); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.prog-sch-time { flex-shrink: 0; text-align: right; }
.prog-sch-time span { font-size: 11px; font-weight: 700; color: rgba(232,230,240,0.7); font-variant-numeric: tabular-nums; }
.prog-sch-sep  { color: rgba(255,255,255,0.2); margin: 0 2px; }
.prog-sch-dur  { display: block; font-size: 8px; font-weight: 700; color: rgba(255,255,255,0.25); margin-top: 2px; }
.prog-sch-suspended { font-size: 10px; font-style: italic; color: rgba(255,255,255,0.25); font-weight: 700; }
</style>
