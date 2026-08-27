<script setup lang="ts">
definePageMeta({ layout: "base" });

import { useMeusProcessos } from "~/composables/meus-processos/useMeusProcessos";

const ctx = useMeusProcessos();

// Modal de Detalhes (reaproveitado de processos)
const showDetalhes = ref(false);
const detalhesId = ref<string | null>(null);

function verDetalhes(id: string) {
    detalhesId.value = id;
    showDetalhes.value = true;
}

async function irParaMatricula(insc: any) {
    if (insc?.id_programa) {
        // Vai pro formulário de matrícula (que decide se redireciona ao checkout)
        // area_id = "0" significa sem filtro de área
        navigateTo(`/form/matricula/estudante/0/${insc.id_programa}`);
    }
}

onMounted(() => {
    ctx.fetchInscricoes();
});

/** Gera array de páginas para a navegação (igual a Processos) */
const paginasVisiveis = computed(() => {
    const t = ctx.totalPaginas.value;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);

    const atual = ctx.pagina.value;
    const ps = new Set<number>();
    // primeiras 3
    for (let i = 1; i <= 3; i++) ps.add(i);
    // últimas 2
    for (let i = t - 1; i <= t; i++) ps.add(i);
    // entorno da atual
    for (let i = atual - 1; i <= atual + 1; i++) {
        if (i >= 1 && i <= t) ps.add(i);
    }
    const sorted = [...ps].sort((a, b) => a - b);

    // injeta -1 onde há salto
    const result: number[] = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) result.push(-1);
        result.push(sorted[i]!);
    }
    return result;
});
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Cabeçalho -->
        <div class="flex items-center justify-between mb-6 shrink-0">
            <div>
                <h2 class="text-xl font-black tracking-tight text-text">
                    Minhas Inscrições
                </h2>
                <p class="text-[11px] text-secondary/60 font-bold mt-1 uppercase tracking-wider">
                    Acompanhe o status das suas inscrições em processos seletivos
                </p>
            </div>
            <NuxtLink
                to="/oferta"
                class="add-btn"
            >
                Ver Cursos
            </NuxtLink>
        </div>

        <!-- Loading -->
        <div
            v-if="ctx.isLoading.value"
            class="flex-1 flex flex-col items-center justify-center gap-3"
        >
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando inscrições...</span>
        </div>

        <!-- Empty -->
        <div
            v-else-if="ctx.inscricoes.value.length === 0"
            class="flex-1 flex items-center justify-center"
        >
            <div class="empty-state max-w-md mx-auto w-full">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="mb-3 text-secondary/50">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="text-sm font-bold text-secondary/60">Nenhuma inscrição encontrada</p>
                <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Você ainda não se inscreveu em nenhum processo seletivo</p>
                <NuxtLink
                    to="/oferta"
                    class="empty-cta mt-4"
                >
                    Ver cursos disponíveis
                </NuxtLink>
            </div>
        </div>

        <!-- Grid de Cards (2 colunas) -->
        <template v-else>
            <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                        v-for="insc in ctx.inscricoes.value"
                        :key="insc.id_inscricao"
                        class="insc-card"
                        @click="verDetalhes(insc.id_inscricao)"
                    >
                        <div class="insc-accent-bar" />
                        <div class="insc-card-inner">
                            
                            <!-- Top: Avatar + Badges de Categoria -->
                            <div class="insc-card-header">
                                <div class="insc-avatar">
                                    {{ (insc.nome_curso || insc.nome_processo || "?")[0].toUpperCase() }}
                                </div>
                                <div class="insc-header-badges">
                                    <span
                                        v-if="insc.nome_area"
                                        class="insc-badge-area"
                                    >
                                        {{ insc.nome_area }}
                                    </span>
                                    <span
                                        v-if="insc.ano_semestre"
                                        class="insc-badge-semestre"
                                    >
                                        {{ ctx.formatarAnoSemestre(insc.ano_semestre) }}
                                    </span>
                                    <span
                                        v-if="insc.turno"
                                        class="insc-badge-turno"
                                    >
                                        {{ insc.turno }}
                                    </span>
                                </div>
                            </div>

                            <!-- Nome do Curso / Processo -->
                            <div class="mt-1">
                                <h3 class="insc-name">
                                    {{ insc.nome_curso || insc.nome_processo }}
                                </h3>
                                <p class="insc-date">
                                    Inscrito em {{ ctx.formatarData(insc.data_inscricao) }}
                                </p>
                            </div>

                            <!-- Etapas de Status -->
                            <div class="insc-status-row">
                                <!-- Dados -->
                                <div 
                                    class="insc-status-item"
                                    :class="{
                                        'insc-status-item--pending': insc.status_dados === 'pendente',
                                        'insc-status-item--approved': insc.status_dados === 'aprovado',
                                        'insc-status-item--rejected': insc.status_dados === 'reprovado',
                                    }"
                                >
                                    <div class="status-dot"></div>
                                    <span>Dados</span>
                                </div>

                                <!-- Docs -->
                                <div 
                                    class="insc-status-item"
                                    :class="{
                                        'insc-status-item--pending': insc.status_documentacao === 'pendente',
                                        'insc-status-item--approved': insc.status_documentacao === 'aprovado',
                                        'insc-status-item--rejected': insc.status_documentacao === 'reprovado',
                                    }"
                                >
                                    <div class="status-dot"></div>
                                    <span>Docs</span>
                                </div>

                                <!-- Candidatura -->
                                <div 
                                    class="insc-status-item"
                                    :class="{
                                        'insc-status-item--pending': insc.status_candidatura === 'pendente',
                                        'insc-status-item--approved': insc.status_candidatura === 'aprovado',
                                        'insc-status-item--rejected': insc.status_candidatura === 'reprovado',
                                    }"
                                >
                                    <div class="status-dot"></div>
                                    <span>Candidatura</span>
                                </div>
                            </div>

                            <!-- Divider -->
                            <div class="insc-divider" />

                            <!-- Base: Ações -->
                            <div class="insc-card-actions" @click.stop>
                                <button
                                    @click="verDetalhes(insc.id_inscricao)"
                                    class="action-btn-secondary"
                                >
                                    Detalhes
                                </button>
                                <span
                                    v-if="insc.ja_matriculado"
                                    class="action-btn-primary !bg-green-500/10 !border-green-500/20 !text-green-400 cursor-default"
                                >
                                    ✅ Matriculado
                                </span>
                                <button
                                    v-else-if="insc.status_candidatura === 'aprovado'"
                                    @click="irParaMatricula(insc)"
                                    class="action-btn-primary"
                                >
                                    Matricular
                                </button>
                                <button
                                    v-else
                                    class="action-btn-primary"
                                    disabled
                                    title="Aguardando aprovação"
                                >
                                    Matricular
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <!-- Paginação -->
            <div
                v-if="ctx.total.value > 20"
                class="shrink-0 flex items-center justify-center gap-1 pt-4 border-t border-divider mt-4"
            >
                <button
                    :disabled="ctx.pagina.value === 1"
                    @click="ctx.irParaPagina(ctx.pagina.value - 1)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-secondary hover:text-text hover:bg-div-15 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    ‹
                </button>
                <template v-for="p in paginasVisiveis" :key="p">
                    <span
                        v-if="p === -1"
                        class="text-secondary/30 text-[10px] px-1"
                        >...</span
                    >
                    <button
                        v-else
                        @click="ctx.irParaPagina(p)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all"
                        :class="
                            p === ctx.pagina.value
                                ? 'bg-primary text-white'
                                : 'text-secondary hover:text-text hover:bg-div-15'
                        "
                    >
                        {{ p }}
                    </button>
                </template>
                <button
                    :disabled="ctx.pagina.value >= ctx.totalPaginas.value"
                    @click="ctx.irParaPagina(ctx.pagina.value + 1)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-secondary hover:text-text hover:bg-div-15 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    ›
                </button>
            </div>
        </template>

        <!-- Modal Detalhes (reaproveitado) -->
        <ProcessosModalDetalhes
            v-model="showDetalhes"
            :idInscricao="detalhesId || ''"
        />
    </div>
</template>

<style scoped>
/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.1);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

/* ── Card ──────────────────────────────────────── */
.insc-card {
    position: relative;
    background: var(--color-secondary-surface);
    border: 1px solid var(--field-border);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.insc-card:hover {
    border-color: rgba(139, 92, 246, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(139,92,246,0.12);
}

.insc-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.insc-card:hover .insc-accent-bar { opacity: 1; }

.insc-card-inner {
    padding: 18px 18px 16px 20px;
    display: flex; flex-direction: column; gap: 10px;
}

/* ── Header ─────────────────────────────────────── */
.insc-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.insc-avatar {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    flex-shrink: 0;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: var(--color-primary);
    font-size: 14px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
}

.insc-header-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.insc-badge-area {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: var(--color-primary);
}

.insc-badge-semestre {
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--color-secondary-surface);
    border: 1px solid var(--field-border);
    color: var(--color-secondary);
}

.insc-badge-turno {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #34d399;
}

/* ── Content ─────────────────────────────────────── */
.insc-name {
    font-size: 13px;
    font-weight: 900;
    color: var(--color-text);
    line-height: 1.3;
}
.insc-date {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-secondary);
    margin-top: 2px;
}

/* ── Status Row ────────────────────────────────── */
.insc-status-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    flex-wrap: wrap;
}

.insc-status-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 16px;
    border: 1px solid transparent;
}

.status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
}

.insc-status-item--pending {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
}

.insc-status-item--approved {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.15);
    color: #34d399;
}

.insc-status-item--rejected {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.15);
    color: #f87171;
}

/* ── Actions / Divider ───────────────────────────── */
.insc-divider {
    height: 1px;
    background: var(--field-border);
    margin: 4px 0;
}

.insc-card-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.action-btn-secondary {
    padding: 7px 14px;
    border-radius: 8px;
    border: 1px solid var(--field-border);
    background: var(--color-secondary-surface);
    color: var(--color-secondary);
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
}
.action-btn-secondary:hover {
    background: var(--color-secondary-surface-hover);
    color: var(--color-text);
    border-color: var(--color-primary);
}

.action-btn-primary {
    padding: 7px 16px;
    border-radius: 8px;
    border: none;
    background: var(--color-primary);
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
}
.action-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
}
.action-btn-primary:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
}

/* ── Empty state / Add button ────────────────────── */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 52px 24px;
    background: var(--color-secondary-surface);
    border-radius: 14px;
    border: 1px dashed var(--field-border);
    text-align: center;
}
.empty-cta {
    display: inline-flex;
    align-items: center;
    padding: 9px 18px;
    border-radius: 10px;
    background: rgba(139,92,246,0.12);
    border: 1px solid rgba(139,92,246,0.25);
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
}
.empty-cta:hover {
    background: rgba(139,92,246,0.2);
}

.add-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: 12px;
    background: var(--color-primary);
    border: 1px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.3);
}
.add-btn:hover {
    background: var(--color-primary-hover);
    box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.45);
    transform: translateY(-1px);
}
</style>
