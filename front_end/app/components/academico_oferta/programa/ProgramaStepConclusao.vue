<template>
  <div class="flex flex-col gap-6">

    <!-- Aviso de overlapping -->
    <div v-if="temOverlapping" class="step-alert step-alert--warn">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="shrink-0 mt-0.5">
        <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M8 6v4M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <div>
        <p class="step-alert-title">Aviso de Calendário</p>
        <p class="step-alert-desc">Foram selecionados ciclos que ocorrem numa mesma faixa de datas.</p>
      </div>
    </div>

    <!-- Estratégia de agrupamento -->
    <div v-if="!isEdit && ciclosSelecionados.length > 1" class="flex flex-col gap-3">
      <h4 class="step-section-title">Estratégia de Agrupamento</h4>
      <div class="grid grid-cols-2 gap-3">
        <label
          class="estrategia-option"
          :class="estrategia === 'unica' ? 'estrategia-option--active' : ''"
        >
          <input type="radio" :checked="estrategia === 'unica'" @change="$emit('update:estrategia', 'unica')" class="sr-only" />
          <div class="radio-dot" :class="estrategia === 'unica' ? 'radio-dot--active' : ''">
            <div v-if="estrategia === 'unica'" class="radio-dot-inner"></div>
          </div>
          <div>
            <span class="estrategia-title">Oferta Única</span>
            <span class="estrategia-desc">1 programa com todos os ciclos</span>
          </div>
        </label>
        <label
          class="estrategia-option estrategia-option--orange"
          :class="estrategia === 'separada' ? 'estrategia-option--active-orange' : ''"
        >
          <input type="radio" :checked="estrategia === 'separada'" @change="$emit('update:estrategia', 'separada')" class="sr-only" />
          <div class="radio-dot radio-dot--orange" :class="estrategia === 'separada' ? 'radio-dot--active-orange' : ''">
            <div v-if="estrategia === 'separada'" class="radio-dot-inner radio-dot-inner--orange"></div>
          </div>
          <div>
            <span class="estrategia-title estrategia-title--orange">Ofertas Múltiplas</span>
            <span class="estrategia-desc">{{ ciclosSelecionados.length }} programas distintos</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Identificação visual -->
    <div class="flex flex-col gap-4">
      <h4 class="step-section-title">Identificação Visual</h4>

      <!-- Curso vinculado (edit) -->
      <div v-if="isEdit" class="step-field">
        <label class="step-field-label">Curso Vinculado</label>
        <select :value="idCurso" disabled class="step-input step-input--disabled">
          <option :value="null" disabled>Nenhum curso (Ciclo Isolado)</option>
          <option v-for="c in listCursos" :key="c.id" :value="c.id">{{ c.nome_curso }}</option>
        </select>
      </div>

      <!-- Área acadêmica -->
      <div class="step-field">
        <label class="step-field-label">Área Acadêmica</label>
        <div v-if="origem === 'curso'" class="step-input-readonly">Herdada automaticamente do curso vinculado</div>
        <select
          v-else
          :value="idArea"
          @change="$emit('update:idArea', ($event.target as HTMLSelectElement).value)"
          class="step-input"
        >
          <option :value="null" disabled>Selecione a área...</option>
          <option v-for="a in listAreas" :key="a.id" :value="a.id">{{ a.nome_area }}</option>
        </select>
      </div>

      <!-- Nome(s) da oferta -->
      <div class="step-field">
        <label class="step-field-label">
          {{ estrategia === 'separada' && ciclosSelecionados.length > 1 && !isEdit ? "Nomes das Ofertas" : "Nome da Oferta" }}
        </label>

        <!-- Múltiplos nomes (separada) -->
        <div v-if="estrategia === 'separada' && ciclosSelecionados.length > 1 && !isEdit" class="flex flex-col gap-3">
          <div v-for="cId in ciclosSelecionados" :key="cId" class="step-nome-multiplo">
            <span class="step-nome-ciclo-tag">
              {{ ciclosEncontrados.find((c: any) => c.id === cId)?.modulo_nome || "Módulo" }}
            </span>
            <input
              type="text"
              :value="descricoesMultiplas[cId]"
              @input="$emit('update:descricaoMultipla', cId, ($event.target as HTMLInputElement).value)"
              class="step-input"
            />
          </div>
        </div>

        <!-- Nome único -->
        <input
          v-else
          type="text"
          :value="descricao"
          @input="$emit('update:descricao', ($event.target as HTMLInputElement).value)"
          placeholder="Ex: Formação Fullstack — 2026.1"
          class="step-input"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  isEdit?: boolean;
  origem: string | null;
  idCurso: string | null;
  idArea: string | null;
  estrategia: string;
  descricao: string;
  descricoesMultiplas: Record<string, string>;
  ciclosSelecionados: string[];
  ciclosEncontrados: any[];
  listCursos: any[];
  listAreas: any[];
  temOverlapping: boolean;
}>();

defineEmits<{
  'update:estrategia': [val: string];
  'update:idArea': [val: string | null];
  'update:descricao': [val: string];
  'update:descricaoMultipla': [cId: string, val: string];
}>();
</script>

<style scoped>
/* ── Section ─────────────────────────────────────── */
.step-section-title {
  font-size: 10px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.14em; color: rgba(255,255,255,0.4);
  padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);
}

/* ── Alerts ──────────────────────────────────────── */
.step-alert {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
}
.step-alert--warn { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
.step-alert-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; }
.step-alert-desc  { font-size: 10px; font-weight: 600; opacity: 0.75; line-height: 1.5; }

/* ── Fields ──────────────────────────────────────── */
.step-field { display: flex; flex-direction: column; gap: 6px; }
.step-field-label {
  font-size: 9px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.14em; color: rgba(255,255,255,0.35);
}
.step-input {
  width: 100%; padding: 11px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(232,230,240,0.9); font-size: 13px; font-weight: 700;
  outline: none; transition: border-color 0.15s ease;
}
.step-input:focus { border-color: rgba(139,92,246,0.45); }
.step-input--disabled { opacity: 0.4; cursor: not-allowed; }
.step-input-readonly {
  padding: 11px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.3); font-style: italic;
}

/* ── Estratégia ──────────────────────────────────── */
.estrategia-option {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  border-radius: 12px; border: 2px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.025); cursor: pointer;
  transition: all 0.15s ease;
}
.estrategia-option:hover { border-color: rgba(139,92,246,0.3); }
.estrategia-option--active { border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.06); }
.estrategia-option--active-orange { border-color: rgba(249,115,22,0.4); background: rgba(249,115,22,0.06); }

.radio-dot {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
  border: 2px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.radio-dot--active { border-color: #8b5cf6; }
.radio-dot--orange.radio-dot--active-orange { border-color: #f97316; }
.radio-dot-inner { width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6; }
.radio-dot-inner--orange { background: #f97316; }

.estrategia-title {
  display: block; font-size: 11px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.08em; color: #c4b5fd; margin-bottom: 2px;
}
.estrategia-title--orange { color: #fb923c; }
.estrategia-desc { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); }

/* ── Nome múltiplo ───────────────────────────────── */
.step-nome-multiplo {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
}
.step-nome-ciclo-tag {
  font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em;
  color: #fb923c;
}
</style>
