<template>
    <div class="flex flex-col gap-3">
        <div v-for="prog in programas" :key="prog.id" class="prog-card">

            <!-- ── NÍVEL 1: PROGRAMA ─────────────────────────────── -->
            <div class="prog-accent-bar" />
            <div class="prog-header" @click="togglePrograma(prog)">
                <div class="prog-header-left">
                    <div class="prog-avatar">
                        {{ (prog.descricao || "?")[0].toUpperCase() }}
                    </div>
                    <div class="prog-header-info">
                        <p class="prog-name">{{ prog.descricao || "—" }}</p>
                        <p class="prog-curso" v-if="prog.nome_curso">{{ prog.nome_curso }}</p>
                    </div>
                </div>
                <div class="prog-header-right">
                    <div class="prog-badges">
                        <span v-if="prog.gratuito" class="badge badge--gratuito">Gratuito</span>
                        <span v-else class="badge badge--pago">Pago</span>
                    </div>
                    <button
                        class="prog-btn-add"
                        title="Novo Produto"
                        @click.stop="$emit('novo-produto', prog.id)"
                    >
                        <Icon name="ph:plus-bold" class="w-3 h-3 text-primary shrink-0" />
                        Novo Produto
                    </button>
                    <Icon
                        name="ph:caret-down-bold"
                        :class="['prog-chevron', { 'prog-chevron--open': expandidos[prog.id] }]"
                    />
                </div>
            </div>

            <!-- Body expandido do Programa -->
            <div v-if="expandidos[prog.id]" class="prog-body">

                <!-- Carregando produtos -->
                <div v-if="prog.carregando" class="level-loading">
                    <div class="w-4 h-4 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
                    <span>Carregando produtos...</span>
                </div>

                <!-- Sem produtos -->
                <div v-else-if="prog.produtos && prog.produtos.length === 0" class="level-empty">
                    <Icon name="ph:package-bold" class="w-5 h-5 text-secondary/30" />
                    <span>Nenhum produto vinculado a este programa</span>
                </div>

                <!-- ── NÍVEL 2: PRODUTOS ─────────────────────────── -->
                <div v-else-if="prog.produtos" class="prod-list">
                    <div v-for="prod in prog.produtos" :key="prod.id" class="prod-item">

                        <!-- Indicador de nível -->
                        <div class="prod-level-bar" />

                        <!-- Header do produto -->
                        <div class="prod-item-main" @click="toggleProduto(prod)">
                            <div class="prod-icon">
                                {{ (prod.nome_produto || "?")[0].toUpperCase() }}
                            </div>
                            <div class="prod-info">
                                <p class="prod-name">{{ prod.nome_produto }}</p>
                                <p v-if="prod.descricao" class="prod-desc">{{ prod.descricao }}</p>
                            </div>
                            <div class="prod-badges">
                                <span :class="['badge', prod.is_ativo ? 'badge--ativo' : 'badge--inativo']">
                                    {{ prod.is_ativo ? "Ativo" : "Inativo" }}
                                </span>
                            </div>
                            <div class="prod-actions">
                                <button
                                    class="action-btn action-btn--oferta"
                                    title="Nova Oferta"
                                    @click.stop="$emit('nova-oferta', prod.id)"
                                >
                                    <Icon name="ph:plus-circle-bold" class="w-3.5 h-3.5" />
                                </button>
                                <button
                                    class="action-btn action-btn--edit"
                                    title="Editar Produto"
                                    @click.stop="$emit('editar-produto', prod)"
                                >
                                    <Icon name="ph:pencil-simple-bold" class="w-3.5 h-3.5" />
                                </button>
                                <Icon
                                    name="ph:caret-down-bold"
                                    :class="['prod-chevron', { 'prod-chevron--open': produtosExpandidos[prod.id] }]"
                                />
                            </div>
                        </div>

                        <!-- ── NÍVEL 3: OFERTAS ──────────────────── -->
                        <div v-if="produtosExpandidos[prod.id]" class="oferta-section">

                            <!-- Carregando ofertas -->
                            <div v-if="carregandoOfertas[prod.id]" class="level-loading level-loading--sm">
                                <div class="w-3.5 h-3.5 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
                                <span>Carregando ofertas...</span>
                            </div>

                            <!-- Sem ofertas -->
                            <div
                                v-else-if="ofertasDoProduto(prod.id).length === 0"
                                class="level-empty level-empty--sm"
                            >
                                <Icon name="ph:tag-bold" class="w-4 h-4 text-secondary/30" />
                                <span>Nenhuma oferta para este produto</span>
                            </div>

                            <!-- Lista de ofertas -->
                            <div v-else class="oferta-list">
                                <div
                                    v-for="(of, idx) in ofertasDoProduto(prod.id)"
                                    :key="of.id"
                                    class="oferta-card"
                                >
                                    <!-- Indicador de nível 3 -->
                                    <div class="oferta-level-bar" />

                                    <!-- Numero -->
                                    <span class="oferta-idx">{{ String(idx + 1).padStart(2, "0") }}</span>

                                    <!-- Conteúdo -->
                                    <div class="oferta-card-body">
                                        <!-- Linha 1: slug + nome curto -->
                                        <div class="oferta-row">
                                            <span class="oferta-slug">/{{ of.slug }}</span>
                                            <span v-if="of.nome_curto" class="oferta-nome">{{ of.nome_curto }}</span>
                                        </div>
                                        <!-- Linha 2: valor + badges -->
                                        <div class="oferta-row">
                                            <span class="oferta-valor">{{ formatValor(of.valor_centavos) }}</span>
                                            <span
                                                v-if="of.tipo_pagamento === 'recorrente'"
                                                class="badge badge--recorrencia"
                                            >
                                                {{ of.recorrencia_periodo === "anual" ? "🔄 Anual" : "🔄 Mensal" }}
                                            </span>
                                            <span v-else class="badge badge--unico">
                                                {{ of.parcelamento_maximo > 1 ? `💳 ${of.parcelamento_maximo}x` : "💳 À vista" }}
                                            </span>
                                            <span :class="['badge', of.visibilidade === 'oculta' ? 'badge--oculta' : 'badge--publica']">
                                                {{ of.visibilidade === "oculta" ? "🔒 Oculta" : "🌍 Pública" }}
                                            </span>
                                            <span :class="['badge', of.is_ativa ? 'badge--ativo' : 'badge--inativo']">
                                                {{ of.is_ativa ? "Ativa" : "Inativa" }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Editar oferta -->
                                    <button
                                        class="oferta-edit-btn"
                                        title="Editar oferta"
                                        @click.stop="$emit('editar-oferta', of, prod.id)"
                                    >
                                        <Icon name="ph:pencil-simple-bold" class="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const props = defineProps<{
    programas: any[];
    ofertasPorProduto: Record<string, any[]>;
    carregandoOfertas: Record<string, boolean>;
}>();

const emit = defineEmits<{
    expandir: [programaId: string];
    "expandir-oferta": [produtoId: string];
    "editar-produto": [produto: any];
    "novo-produto": [programaId: string];
    "nova-oferta": [produtoId: string];
    "editar-oferta": [oferta: any, produtoId: string];
}>();

const expandidos = reactive<Record<string, boolean>>({});
const produtosExpandidos = reactive<Record<string, boolean>>({});

function togglePrograma(prog: any) {
    const ja = expandidos[prog.id];
    expandidos[prog.id] = !ja;
    if (!ja && prog.produtos === null) emit("expandir", prog.id);
}

function toggleProduto(prod: any) {
    const ja = produtosExpandidos[prod.id];
    produtosExpandidos[prod.id] = !ja;
    if (!ja && props.ofertasPorProduto[prod.id] === undefined)
        emit("expandir-oferta", prod.id);
}

function ofertasDoProduto(prodId: string): any[] {
    return props.ofertasPorProduto[prodId] || [];
}

function formatValor(centavos: number): string {
    if (centavos === 0) return "Grátis";
    return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   NÍVEL 1 — PROGRAMA
═══════════════════════════════════════════════════ */
.prog-card {
    position: relative;
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.prog-card:hover {
    border-color: rgba(139, 92, 246, 0.3);
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.prog-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
    z-index: 1;
}
.prog-card:hover .prog-accent-bar { opacity: 1; }

.prog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    cursor: pointer;
    gap: 12px;
    transition: background 0.15s ease;
}
.prog-header:hover { background: var(--color-secondary-surface-hover); }

.prog-header-left {
    display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;
}
.prog-header-right {
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
}
.prog-header-info { flex: 1; min-width: 0; }

.prog-avatar {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2);
    color: var(--color-primary); font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.prog-name {
    font-size: 13px; font-weight: 900; color: var(--color-text); line-height: 1.3;
}
.prog-curso {
    font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.6; margin-top: 1px;
}
.prog-chevron {
    color: var(--color-secondary); opacity: 0.5; transition: transform 0.2s ease; flex-shrink: 0; width: 14px; height: 14px;
}
.prog-chevron--open { transform: rotate(180deg); color: var(--color-primary); opacity: 1; }

.prog-btn-add {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 7px; border: none;
    background: rgba(139, 92, 246, 0.07); border: 1px solid rgba(139, 92, 246, 0.18);
    color: var(--color-primary); font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease;
    opacity: 0;
}
.prog-card:hover .prog-btn-add { opacity: 1; }
.prog-btn-add:hover { background: rgba(139, 92, 246, 0.16); border-color: rgba(139, 92, 246, 0.35); }

.prog-body {
    border-top: 1px solid var(--color-divider);
    padding: 10px 14px 14px;
}

/* ═══════════════════════════════════════════════════
   NÍVEL 2 — PRODUTO
═══════════════════════════════════════════════════ */
.prod-list { display: flex; flex-direction: column; gap: 6px; }

.prod-item {
    position: relative;
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 10px;
    overflow: hidden;
    transition: border-color 0.15s ease;
}
.prod-item:hover { border-color: rgba(99, 102, 241, 0.3); background: var(--color-secondary-surface-hover); }

.prod-level-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(180deg, #6366f1, #818cf8);
    opacity: 0; transition: opacity 0.15s ease;
}
.prod-item:hover .prod-level-bar { opacity: 1; }

.prod-item-main {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px 10px 16px;
    cursor: pointer;
}
.prod-icon {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2);
    color: #6366f1; font-size: 11px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.prod-info { flex: 1; min-width: 0; }
.prod-name { font-size: 12px; font-weight: 800; color: var(--color-text); }
.prod-desc {
    font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.6;
    margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.prod-badges { display: flex; gap: 4px; flex-shrink: 0; }
.prod-actions { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
.prod-chevron {
    color: var(--color-secondary); opacity: 0.4; transition: transform 0.2s ease; flex-shrink: 0; width: 12px; height: 12px;
}
.prod-chevron--open { transform: rotate(180deg); color: #6366f1; opacity: 1; }

.action-btn {
    width: 24px; height: 24px; border-radius: 6px; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
    opacity: 0; font-size: 10px;
}
.prod-item:hover .action-btn { opacity: 1; }

.action-btn--oferta {
    background: rgba(16, 185, 129, 0.08); color: #10b981;
}
.action-btn--oferta:hover { background: rgba(16, 185, 129, 0.2); }

.action-btn--edit {
    background: var(--color-secondary-surface-hover); color: var(--color-secondary);
}
.action-btn--edit:hover { background: rgba(99, 102, 241, 0.15); color: #6366f1; }

/* ═══════════════════════════════════════════════════
   NÍVEL 3 — OFERTA
═══════════════════════════════════════════════════ */
.oferta-section {
    border-top: 1px solid var(--color-divider);
    background: var(--color-div-15);
}
.oferta-list {
    display: flex; flex-direction: column; gap: 4px;
    padding: 6px 12px 8px 16px;
}

.oferta-card {
    position: relative;
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 8px;
    padding: 8px 10px 8px 12px;
    display: flex; align-items: center; gap: 8px;
    transition: border-color 0.15s ease, background 0.15s ease;
    overflow: hidden;
}
.oferta-card:hover {
    border-color: rgba(96, 165, 250, 0.3);
    background: var(--color-secondary-surface-hover);
}

.oferta-level-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(180deg, #3b82f6, #60a5fa);
    opacity: 0; transition: opacity 0.15s ease;
}
.oferta-card:hover .oferta-level-bar { opacity: 1; }

.oferta-idx {
    font-size: 9px; font-weight: 900; color: var(--color-secondary); opacity: 0.5;
    font-variant-numeric: tabular-nums; flex-shrink: 0; width: 16px; text-align: center;
}
.oferta-card-body {
    flex: 1; display: flex; flex-direction: column; gap: 4px;
}
.oferta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.oferta-slug {
    font-size: 11px; font-weight: 900;
    color: var(--color-primary); font-family: monospace;
}
.oferta-nome {
    font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.7;
}
.oferta-valor {
    font-size: 12.5px; font-weight: 900; color: var(--color-text);
}
.oferta-edit-btn {
    width: 24px; height: 24px; border-radius: 6px; border: none; flex-shrink: 0;
    background: var(--color-secondary-surface-hover); color: var(--color-secondary);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
    opacity: 0;
}
.oferta-card:hover .oferta-edit-btn { opacity: 1; }
.oferta-edit-btn:hover { background: rgba(96, 165, 250, 0.15); color: #3b82f6; }

/* ═══════════════════════════════════════════════════
   ESTADOS COMUNS
═══════════════════════════════════════════════════ */
.level-loading {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 20px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--color-secondary); opacity: 0.6;
}
.level-loading--sm { padding: 12px; }

.level-empty {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 20px; border-radius: 8px;
    background: var(--color-secondary-surface); border: 1px dashed var(--color-divider);
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--color-secondary); opacity: 0.6;
}
.level-empty--sm { padding: 10px; font-size: 9px; }

/* ═══════════════════════════════════════════════════
   BADGES
═══════════════════════════════════════════════════ */
.badge {
    display: inline-flex; align-items: center;
    font-size: 8px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.1em; padding: 3px 7px; border-radius: 20px;
}
.badge--gratuito   { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; }
.badge--pago       { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); color: #f59e0b; }
.badge--ativo      { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; }
.badge--inativo    { background: var(--color-secondary-surface-hover); border: 1px solid var(--color-divider); color: var(--color-secondary); }
.badge--publica    { background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.25); color: #0284c7; }
.badge--oculta     { background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.25); color: var(--color-primary); }
.badge--recorrencia{ background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); color: #f59e0b; }
.badge--unico      { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; }
.prog-badges { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
