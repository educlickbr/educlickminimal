<template>
  <div class="flex flex-col gap-6">

    <!-- Seletor de Curso (origem: curso) -->
    <template v-if="origem === 'curso'">
      <div class="step-field">
        <label class="step-field-label">Curso Base</label>
        <select
          :model-value="idCurso"
          @change="$emit('update:idCurso', ($event.target as HTMLSelectElement).value); $emit('fetchCursoCiclos')"
          class="step-select"
        >
          <option :value="null" disabled>Selecione um curso...</option>
          <option v-for="c in listCursos" :key="c.id" :value="c.id">{{ c.nome_curso }}</option>
        </select>
      </div>
    </template>

    <!-- Loading ciclos -->
    <div v-if="loadingCiclos" class="ciclos-loading">
      <div class="ciclos-loading-spinner" />
      <span>Buscando ciclos disponíveis...</span>
    </div>

    <!-- Lista de ciclos -->
    <div v-else-if="ciclosEncontrados.length > 0" class="flex flex-col gap-3">
      <div class="step-section-header">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="text-green-500">
          <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Ciclos Disponíveis</span>
        <span class="step-count">{{ ciclosSelecionados.length }} / {{ ciclosEncontrados.length }} selecionados</span>
      </div>

      <div class="ciclos-list">
        <label
          v-for="ciclo in ciclosEncontrados"
          :key="ciclo.id"
          class="ciclo-item"
          :class="{ 'ciclo-item--selected': ciclosSelecionados.includes(ciclo.id) }"
        >
          <div class="ciclo-checkbox">
            <input
              type="checkbox"
              :value="ciclo.id"
              :checked="ciclosSelecionados.includes(ciclo.id)"
              @change="toggleCiclo(ciclo.id, ($event.target as HTMLInputElement).checked)"
              class="sr-only"
            />
            <div class="ciclo-checkbox-box">
              <svg v-if="ciclosSelecionados.includes(ciclo.id)" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="ciclo-info">
            <p class="ciclo-modulo">{{ ciclo.modulo_nome }}</p>
            <p class="ciclo-desc">{{ ciclo.descricao || "Sem descrição" }}</p>
            <div class="ciclo-periodo">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2" width="10" height="9" rx="2" stroke="currentColor" stroke-width="1.2"/>
                <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              {{ formatDateShort(ciclo.data_ini) }} → {{ formatDateShort(ciclo.data_fim) }}
            </div>
          </div>
        </label>
      </div>

      <!-- Aviso de matriz incompleta -->
      <div v-if="origem === 'curso' && modulosPendentesCurso.length > 0" class="step-warning">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="shrink-0">
          <path d="M8 2L14.5 13H1.5L8 2z" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M8 6v4M8 11.5v.5" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <div>
          <p class="step-warning-title">Matriz Incompleta</p>
          <p class="step-warning-desc">Existem módulos deste curso sem nenhum ciclo programado disponível.</p>
        </div>
      </div>
    </div>

    <!-- Vazio -->
    <div
      v-else-if="(origem === 'curso' && idCurso) || origem === 'ciclo'"
      class="ciclos-empty"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="text-white/20 mb-2">
        <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Nenhum ciclo programado encontrado
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  origem: string | null;
  idCurso: string | null;
  ciclosSelecionados: string[];
  listCursos: any[];
  ciclosEncontrados: any[];
  loadingCiclos: boolean;
  modulosPendentesCurso: string[];
  formatDateShort: (d: string) => string;
}>();

const emit = defineEmits<{
  'update:idCurso': [value: string | null];
  'update:ciclosSelecionados': [value: string[]];
  fetchCursoCiclos: [];
}>();

function toggleCiclo(id: string, checked: boolean) {
  const updated = checked
    ? [...props.ciclosSelecionados, id]
    : props.ciclosSelecionados.filter((c) => c !== id);
  emit('update:ciclosSelecionados', updated);
}
</script>

<style scoped>
.step-field { display: flex; flex-direction: column; gap: 6px; }
.step-field-label {
  font-size: 9px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.14em; color: rgba(255,255,255,0.35); padding: 0 2px;
}
.step-select {
  width: 100%; padding: 11px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(232,230,240,0.9); font-size: 13px; font-weight: 700;
  outline: none; transition: border-color 0.15s ease;
}
.step-select:focus { border-color: rgba(139,92,246,0.45); }

.step-section-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 10px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.12em; color: rgba(255,255,255,0.5);
}
.step-count {
  margin-left: auto; font-size: 9px; font-weight: 900;
  padding: 3px 8px; border-radius: 10px;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  color: #a78bfa;
}

/* ── Ciclos list ─────────────────────────────────── */
.ciclos-list { display: flex; flex-direction: column; gap: 8px; }

.ciclo-item {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 14px 16px; border-radius: 12px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.025);
  transition: border-color 0.15s ease, background 0.15s ease;
}
.ciclo-item:hover { border-color: rgba(139,92,246,0.2); background: rgba(139,92,246,0.04); }
.ciclo-item--selected {
  border-color: rgba(139,92,246,0.3);
  background: rgba(139,92,246,0.06);
}

.ciclo-checkbox { padding-top: 1px; flex-shrink: 0; }
.ciclo-checkbox-box {
  width: 18px; height: 18px; border-radius: 5px;
  border: 2px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.03);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s ease;
}
.ciclo-item--selected .ciclo-checkbox-box {
  border-color: #8b5cf6; background: rgba(139,92,246,0.2); color: #c4b5fd;
}

.ciclo-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.ciclo-modulo { font-size: 12px; font-weight: 900; color: rgba(232,230,240,0.9); }
.ciclo-desc { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); }
.ciclo-periodo {
  display: flex; align-items: center; gap: 5px; margin-top: 4px;
  font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3);
  font-variant-numeric: tabular-nums;
}

/* ── States ──────────────────────────────────────── */
.ciclos-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 40px;
  color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.12em;
}
.ciclos-loading-spinner {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.08); border-top-color: #8b5cf6;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ciclos-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08);
  font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 0.1em;
}

.step-warning {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  border-radius: 12px; background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2);
}
.step-warning-title {
  font-size: 10px; font-weight: 900; color: #fb923c;
  text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px;
}
.step-warning-desc { font-size: 10px; font-weight: 600; color: rgba(251,146,60,0.75); line-height: 1.5; }
</style>
