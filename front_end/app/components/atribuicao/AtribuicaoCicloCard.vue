<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  ciclo: any
}>()

const emit = defineEmits<{
  (e: 'atribuir', ciclo: any, comp: any): void
  (e: 'remover', idAtribuicao: string): void
}>()

function getDocenteNome(doc: any): string {
  if (!doc) return '—'
  // Tenta todos os nomes possíveis retornados pelas RPCs
  return doc.docente_nome || doc.nome_completo || doc.nome || '—'
}

function tipoConfig(tipo: string) {
  switch (tipo) {
    case 'titular':    return { cls: 'tipo--titular',    dot: '#34d399', label: 'Titular' }
    case 'substituto': return { cls: 'tipo--substituto', dot: '#fbbf24', label: 'Substituto' }
    case 'auxiliar':   return { cls: 'tipo--auxiliar',   dot: '#38bdf8', label: 'Auxiliar' }
    default:           return { cls: 'tipo--outro',      dot: '#888',    label: tipo }
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return dateStr.split('-').reverse().join('/')
}
</script>

<template>
  <div class="ciclo-card">
    <!-- Accent bar violet no topo -->
    <div class="ciclo-accent-bar" />

    <!-- Header do ciclo -->
    <div class="ciclo-header">
      <div class="ciclo-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <div class="ciclo-header-info">
        <h3 class="ciclo-modulo-nome">{{ ciclo.modulo_nome }}</h3>
        <p class="ciclo-descricao">
          {{ ciclo.ciclo_descricao }}
          <span v-if="ciclo.data_ini"> · {{ formatDate(ciclo.data_ini) }}</span>
          <span v-if="ciclo.data_fim"> até {{ formatDate(ciclo.data_fim) }}</span>
        </p>
      </div>
      <div class="ciclo-count-badge">
        {{ ciclo.componentes?.length || 0 }} componente{{ ciclo.componentes?.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- ── Componentes ─────────────────────────── -->
    <div class="componentes-list">
      <div
        v-for="comp in ciclo.componentes || []"
        :key="comp.id_modulo_componente"
        class="comp-row"
      >
        <!-- Indicador de nível (indigo lateral) -->
        <div class="comp-level-bar" />

        <!-- Info do componente -->
        <div class="comp-info">
          <p class="comp-nome">{{ comp.componente_nome }}</p>
          <p class="comp-meta">
            <span v-if="comp.carga_horaria">{{ comp.carga_horaria }} min</span>
            <span v-if="comp.carga_horaria && (comp.obrigatorio !== undefined)"> · </span>
            <span v-if="comp.obrigatorio" class="text-emerald-400/70">Obrigatório</span>
            <span v-else class="text-amber-400/60">Eletivo</span>
          </p>
        </div>

        <!-- Docentes atribuídos -->
        <div class="comp-docentes">
          <template v-if="comp.docentes?.length">
            <div
              v-for="doc in comp.docentes"
              :key="doc.id_atribuicao"
              class="doc-badge"
              :class="tipoConfig(doc.tipo).cls"
            >
              <div class="doc-badge-dot" :style="{ background: tipoConfig(doc.tipo).dot }" />
              <span class="doc-badge-nome" :title="JSON.stringify(doc)">{{ doc.docente_nome || doc.nome_completo || doc.nome || '—' }}</span>
              <span class="doc-badge-sep">·</span>
              <span class="doc-badge-tipo">{{ tipoConfig(doc.tipo).label }}</span>
              <button
                @click="emit('remover', doc.id_atribuicao)"
                class="doc-badge-remove"
                title="Remover atribuição"
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </template>
          <span v-else class="comp-sem-docente">Nenhum docente atribuído</span>
        </div>

        <!-- Botão atribuir -->
        <div class="comp-actions">
          <button @click="emit('atribuir', ciclo, comp)" class="btn-atribuir">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Atribuir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ciclo-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  overflow: hidden;
}

.ciclo-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, rgba(139,92,246,0.7), rgba(139,92,246,0.15));
}

.ciclo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.ciclo-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(139,92,246,0.08);
  border: 1px solid rgba(139,92,246,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(139,92,246,0.6);
  flex-shrink: 0;
}

.ciclo-header-info { flex: 1; min-width: 0; }
.ciclo-modulo-nome { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.75); }
.ciclo-descricao { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); margin-top: 1px; }

.ciclo-count-badge {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.18);
  white-space: nowrap;
}

/* ── Componentes ───────────────────────────── */
.componentes-list { }

.comp-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  flex-wrap: wrap;
}
.comp-row:last-child { border-bottom: none; }

.comp-level-bar {
  width: 3px;
  height: 28px;
  border-radius: 2px;
  background: rgba(99,102,241,0.25);
  flex-shrink: 0;
}

.comp-info { flex: 1; min-width: 140px; }
.comp-nome { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.65); }
.comp-meta { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 2px; }

.comp-docentes {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 180px;
}

.comp-sem-docente {
  font-size: 10px;
  font-style: italic;
  color: rgba(255,255,255,0.15);
}

.comp-actions { flex-shrink: 0; }

/* ── Badges ────────────────────────────────── */
.doc-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid;
}
.doc-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.doc-badge-nome { white-space: nowrap; }
.doc-badge-sep { opacity: 0.4; }
.doc-badge-tipo {
  text-transform: uppercase;
  font-size: 8px;
  letter-spacing: 0.04em;
  opacity: 0.7;
}
.doc-badge-remove {
  margin-left: 2px;
  opacity: 0.4;
  transition: opacity 0.15s;
  display: flex;
  padding: 2px;
}
.doc-badge-remove:hover { opacity: 0.9; }

/* ── Tipos ─────────────────────────────────── */
.tipo--titular {
  background: rgba(52,211,153,0.08);
  border-color: rgba(52,211,153,0.15);
  color: rgba(52,211,153,0.85);
}
.tipo--substituto {
  background: rgba(251,191,36,0.08);
  border-color: rgba(251,191,36,0.15);
  color: rgba(251,191,36,0.85);
}
.tipo--auxiliar {
  background: rgba(56,189,248,0.08);
  border-color: rgba(56,189,248,0.15);
  color: rgba(56,189,248,0.85);
}
.tipo--outro {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
}

/* ── Botão Atribuir ────────────────────────── */
.btn-atribuir {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(139,92,246,0.1);
  color: rgba(139,92,246,0.75);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-atribuir:hover { background: rgba(139,92,246,0.18); }
</style>
