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
  return doc.docente_nome || doc.nome_completo || doc.nome || '—'
}

function tipoConfig(tipo: string) {
  switch (tipo) {
    case 'titular':    return { cls: 'tipo--titular',    dot: '#10b981', label: 'Titular' }
    case 'substituto': return { cls: 'tipo--substituto', dot: '#f59e0b', label: 'Substituto' }
    case 'auxiliar':   return { cls: 'tipo--auxiliar',   dot: '#0284c7', label: 'Auxiliar' }
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
        <Icon name="ph:book-bookmark-duotone" class="w-4 h-4 text-primary" />
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
        <!-- Indicador de nível -->
        <div class="comp-level-bar" />

        <!-- Info do componente -->
        <div class="comp-info">
          <p class="comp-nome">{{ comp.componente_nome }}</p>
          <p class="comp-meta">
            <span v-if="comp.carga_horaria">{{ comp.carga_horaria }} min</span>
            <span v-if="comp.carga_horaria && (comp.obrigatorio !== undefined)"> · </span>
            <span v-if="comp.obrigatorio" class="text-emerald-500 font-medium">Obrigatório</span>
            <span v-else class="text-amber-500 font-medium">Eletivo</span>
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
                <Icon name="ph:x-bold" class="w-2.5 h-2.5" />
              </button>
            </div>
          </template>
          <span v-else class="comp-sem-docente">Nenhum docente atribuído</span>
        </div>

        <!-- Botão atribuir -->
        <div class="comp-actions">
          <button @click="emit('atribuir', ciclo, comp)" class="btn-atribuir">
            <Icon name="ph:plus-bold" class="w-3 h-3" />
            <span>Atribuir</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ciclo-card {
  background: var(--color-secondary-surface);
  border: 1px solid var(--color-divider);
  border-radius: 14px;
  overflow: hidden;
}

.ciclo-accent-bar {
  height: 3px;
  background: var(--color-primary);
}

.ciclo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-divider);
}

.ciclo-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(139,92,246,0.10);
  border: 1px solid rgba(139,92,246,0.20);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ciclo-header-info { flex: 1; min-width: 0; }
.ciclo-modulo-nome { font-size: 12px; font-weight: 800; color: var(--color-text); }
.ciclo-descricao { font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.6; margin-top: 1px; }

.ciclo-count-badge {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-secondary);
  opacity: 0.5;
  white-space: nowrap;
}

.comp-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-divider);
  flex-wrap: wrap;
  transition: background 0.15s ease;
}
.comp-row:hover {
  background: var(--color-secondary-surface-hover);
}
.comp-row:last-child { border-bottom: none; }

.comp-level-bar {
  width: 3px;
  height: 28px;
  border-radius: 2px;
  background: rgba(139,92,246,0.3);
  flex-shrink: 0;
}

.comp-info { flex: 1; min-width: 140px; }
.comp-nome { font-size: 12px; font-weight: 700; color: var(--color-text); }
.comp-meta { font-size: 10px; color: var(--color-secondary); opacity: 0.6; margin-top: 2px; }

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
  color: var(--color-secondary);
  opacity: 0.5;
}

.comp-actions { flex-shrink: 0; }

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
  opacity: 0.8;
}
.doc-badge-remove {
  margin-left: 2px;
  opacity: 0.6;
  transition: opacity 0.15s;
  display: flex;
  padding: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.doc-badge-remove:hover { opacity: 1; }

.tipo--titular {
  background: rgba(16,185,129,0.10);
  border-color: rgba(16,185,129,0.25);
  color: #10b981;
}
.tipo--substituto {
  background: rgba(245,158,11,0.10);
  border-color: rgba(245,158,11,0.25);
  color: #f59e0b;
}
.tipo--auxiliar {
  background: rgba(2,132,199,0.10);
  border-color: rgba(2,132,199,0.25);
  color: #0284c7;
}
.tipo--outro {
  background: var(--color-secondary-surface-hover);
  border-color: var(--color-divider);
  color: var(--color-secondary);
}

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
  color: var(--color-primary);
  border: 1px solid rgba(139,92,246,0.2);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-atribuir:hover { background: rgba(139,92,246,0.2); }
</style>
