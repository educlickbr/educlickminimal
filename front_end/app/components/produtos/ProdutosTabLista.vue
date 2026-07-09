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
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 0v10M0 5h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                        Novo Produto
                    </button>
                    <svg
                        :class="['prog-chevron', { 'prog-chevron--open': expandidos[prog.id] }]"
                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                    >
                        <path d="M4 5l3 3 3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>

            <!-- Body expandido do Programa -->
            <div v-if="expandidos[prog.id]" class="prog-body">

                <!-- Carregando produtos -->
                <div v-if="prog.carregando" class="level-loading">
                    <div class="mini-spinner" />
                    <span>Carregando produtos...</span>
                </div>

                <!-- Sem produtos -->
                <div v-else-if="prog.produtos && prog.produtos.length === 0" class="level-empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-white/15">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
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
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.3"/>
                                        <path d="M4 6h4M6 4v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                                    </svg>
                                </button>
                                <button
                                    class="action-btn action-btn--edit"
                                    title="Editar Produto"
                                    @click.stop="$emit('editar-produto', prod)"
                                >
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                <svg
                                    :class="['prod-chevron', { 'prod-chevron--open': produtosExpandidos[prod.id] }]"
                                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                                >
                                    <path d="M4 4l2.5 3L9 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </div>

                        <!-- ── NÍVEL 3: OFERTAS ──────────────────── -->
                        <div v-if="produtosExpandidos[prod.id]" class="oferta-section">

                            <!-- Carregando ofertas -->
                            <div v-if="carregandoOfertas[prod.id]" class="level-loading level-loading--sm">
                                <div class="mini-spinner mini-spinner--sm" />
                                <span>Carregando ofertas...</span>
                            </div>

                            <!-- Sem ofertas -->
                            <div
                                v-else-if="ofertasDoProduto(prod.id).length === 0"
                                class="level-empty level-empty--sm"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-white/15">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
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
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                                        </svg>
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
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.prog-card:hover {
    border-color: rgba(139, 92, 246, 0.22);
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
}

/* Accent bar violet — LATERAL esquerda (mesmo padrão dos sub-níveis) */
.prog-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
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
.prog-header:hover { background: rgba(139, 92, 246, 0.03); }

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
    color: #a78bfa; font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.prog-name {
    font-size: 13px; font-weight: 900; color: rgba(232, 230, 240, 0.92); line-height: 1.3;
}
.prog-curso {
    font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); margin-top: 1px;
}
.prog-chevron {
    color: rgba(255, 255, 255, 0.25); transition: transform 0.2s ease; flex-shrink: 0;
}
.prog-chevron--open { transform: rotate(180deg); color: #a78bfa; }

.prog-btn-add {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 7px; border: none;
    background: rgba(139, 92, 246, 0.07); border: 1px solid rgba(139, 92, 246, 0.15);
    color: #a78bfa; font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease;
    opacity: 0;
}
.prog-card:hover .prog-btn-add { opacity: 1; }
.prog-btn-add:hover { background: rgba(139, 92, 246, 0.16); border-color: rgba(139, 92, 246, 0.3); }

.prog-body {
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    padding: 10px 14px 14px;
}

/* ═══════════════════════════════════════════════════
   NÍVEL 2 — PRODUTO
═══════════════════════════════════════════════════ */
.prod-list { display: flex; flex-direction: column; gap: 5px; }

.prod-item {
    position: relative;
    background: rgba(255, 255, 255, 0.018);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    overflow: hidden;
    transition: border-color 0.15s ease;
}
.prod-item:hover { border-color: rgba(99, 102, 241, 0.25); }

/* Accent bar azul-índigo na LATERAL esquerda — diferencia do violet do prog */
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
    background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.15);
    color: #818cf8; font-size: 11px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.prod-info { flex: 1; min-width: 0; }
.prod-name { font-size: 12px; font-weight: 800; color: rgba(232, 230, 240, 0.85); }
.prod-desc {
    font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.25);
    margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.prod-badges { display: flex; gap: 4px; flex-shrink: 0; }
.prod-actions { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
.prod-chevron {
    color: rgba(255,255,255,0.2); transition: transform 0.2s ease; flex-shrink: 0;
}
.prod-chevron--open { transform: rotate(180deg); color: #818cf8; }

.action-btn {
    width: 24px; height: 24px; border-radius: 6px; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
    opacity: 0; font-size: 10px;
}
.prod-item:hover .action-btn { opacity: 1; }

.action-btn--oferta {
    background: rgba(16, 185, 129, 0.06); color: rgba(52, 211, 153, 0.6);
}
.action-btn--oferta:hover { background: rgba(16, 185, 129, 0.14); color: #34d399; }

.action-btn--edit {
    background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3);
}
.action-btn--edit:hover { background: rgba(99, 102, 241, 0.14); color: #818cf8; }

/* ═══════════════════════════════════════════════════
   NÍVEL 3 — OFERTA
═══════════════════════════════════════════════════ */
.oferta-section {
    border-top: 1px solid rgba(255, 255, 255, 0.03);
    background: rgba(0, 0, 0, 0.12);
}
.oferta-list {
    display: flex; flex-direction: column; gap: 3px;
    padding: 6px 12px 8px 16px;
}

.oferta-card {
    position: relative;
    background: rgba(255, 255, 255, 0.012);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 7px;
    padding: 8px 10px 8px 12px;
    display: flex; align-items: center; gap: 8px;
    transition: border-color 0.15s ease, background 0.15s ease;
    overflow: hidden;
}
.oferta-card:hover {
    border-color: rgba(96, 165, 250, 0.18);
    background: rgba(96, 165, 250, 0.03);
}

/* Accent bar azul claro — diferencia dos dois níveis anteriores */
.oferta-level-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(180deg, #3b82f6, #60a5fa);
    opacity: 0; transition: opacity 0.15s ease;
}
.oferta-card:hover .oferta-level-bar { opacity: 1; }

.oferta-idx {
    font-size: 9px; font-weight: 900; color: rgba(96, 165, 250, 0.35);
    font-variant-numeric: tabular-nums; flex-shrink: 0; width: 16px; text-align: center;
}
.oferta-card-body {
    flex: 1; display: flex; flex-direction: column; gap: 5px;
}
.oferta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.oferta-slug {
    font-size: 11px; font-weight: 900;
    color: rgba(96, 165, 250, 0.7); font-family: monospace;
}
.oferta-nome {
    font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3);
}
.oferta-valor {
    font-size: 13px; font-weight: 900; color: rgba(232, 230, 240, 0.9);
}
.oferta-edit-btn {
    width: 22px; height: 22px; border-radius: 5px; border: none; flex-shrink: 0;
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
    opacity: 0;
}
.oferta-card:hover .oferta-edit-btn { opacity: 1; }
.oferta-edit-btn:hover { background: rgba(96, 165, 250, 0.14); color: #60a5fa; }

/* ═══════════════════════════════════════════════════
   ESTADOS COMUNS
═══════════════════════════════════════════════════ */
.level-loading {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 20px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: rgba(255,255,255,0.2);
}
.level-loading--sm { padding: 12px; }

.level-empty {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 20px; border-radius: 8px;
    background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.05);
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: rgba(255,255,255,0.2);
}
.level-empty--sm { padding: 10px; font-size: 9px; }

.mini-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.06); border-top-color: #8b5cf6;
    animation: spin 0.7s linear infinite;
}
.mini-spinner--sm { width: 12px; height: 12px; border-top-color: #818cf8; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════════════════════
   BADGES
═══════════════════════════════════════════════════ */
.badge {
    display: inline-flex; align-items: center;
    font-size: 8px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.1em; padding: 3px 7px; border-radius: 20px;
}
.badge--gratuito   { background: rgba(52, 211, 153, 0.1);   border: 1px solid rgba(52,211,153,0.25);  color: #34d399; }
.badge--pago       { background: rgba(251, 191, 36, 0.1);   border: 1px solid rgba(251,191,36,0.25);  color: #fbbf24; }
.badge--ativo      { background: rgba(52, 211, 153, 0.08);  border: 1px solid rgba(52,211,153,0.2);   color: #34d399; }
.badge--inativo    { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.1);  color: rgba(255,255,255,0.3); }
.badge--publica    { background: rgba(96, 165, 250, 0.08);  border: 1px solid rgba(96,165,250,0.2);   color: #60a5fa; }
.badge--oculta     { background: rgba(168, 85, 247, 0.08);  border: 1px solid rgba(168,85,247,0.2);   color: #c4b5fd; }
.badge--recorrencia{ background: rgba(251, 191, 36, 0.08);  border: 1px solid rgba(251,191,36,0.2);   color: #fbbf24; }
.badge--unico      { background: rgba(52, 211, 153, 0.08);  border: 1px solid rgba(52,211,153,0.2);   color: #34d399; }
.prog-badges { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
