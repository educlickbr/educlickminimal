<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">{{
                loading ? "..." : ciclos.length + " ciclo(s)"
            }}</span>
            <button @click="openNovo" class="add-btn">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Novo Ciclo
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid de ciclos -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="ciclos.length === 0" class="col-span-full empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/20">
                    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhum ciclo cadastrado</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Clique em "Novo Ciclo" para começar</p>
            </div>

            <div v-for="c in ciclos" :key="c.id" class="ciclo-card" @click="openEditar(c)">
                <!-- Accent bar animada -->
                <div class="ciclo-accent-bar" />

                <div class="ciclo-card-inner">
                    <!-- Topo: badge do ano + turno -->
                    <div class="ciclo-card-header">
                        <div class="ciclo-year-badge">
                            {{ c.data_ini ? new Date(c.data_ini).getFullYear() : "—" }}
                        </div>
                        <span
                            v-if="c.turno"
                            class="ciclo-turno-badge"
                        >{{ c.turno }}</span>
                        <div class="ciclo-card-actions" @click.stop>
                            <button @click="openEditar(c)" class="action-btn action-edit" title="Editar">
                                ✎
                            </button>
                            <button @click="confirmDelete(c.id)" class="action-btn action-delete" title="Excluir">
                                ✕
                            </button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="ciclo-name">{{ c.descricao || "Ciclo Sem Nome" }}</p>

                    <!-- Módulo -->
                    <p class="ciclo-modulo">
                        <span class="ciclo-modulo-label">Módulo</span>
                        {{ c.aca_modulo?.nome_modulo || "—" }}
                    </p>

                    <!-- Divisor -->
                    <div class="ciclo-divider" />

                    <!-- Período -->
                    <div class="ciclo-periodo">
                        <span class="ciclo-periodo-label">Período</span>
                        <div class="ciclo-periodo-datas">
                            <span class="ciclo-data">
                                {{ c.data_ini ? new Date(c.data_ini).toLocaleDateString("pt-BR") : "—" }}
                            </span>
                            <svg width="14" height="8" viewBox="0 0 14 8" fill="none" class="text-primary/30">
                                <path d="M1 4h12M9 1l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span class="ciclo-data">
                                {{ c.data_fim ? new Date(c.data_fim).toLocaleDateString("pt-BR") : "—" }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <AcademicoOfertaModalCiclo
            v-model="showModal"
            :isEdit="isEdit"
            :cicloId="editData?.id || editData?.id_ciclo"
            :initialData="editData"
            :modulos="modulosDisponiveis"
            :cicloCtx="{
                simularCalendario,
                handleSaveCiclo,
                fetchDiasConfig,
            }"
            @saved="handleSaved"
        />
        <GlobalModalConfirmacao
            v-model="showConfirmDelete"
            title="Excluir"
            message="Confirmar?"
            type="danger"
            confirmText="Excluir"
            :loading="isDeleting"
            @confirm="handleDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { useOfertaCore } from "~/composables/academico_oferta/useOfertaCore";
import { useOfertaCiclos } from "~/composables/academico_oferta/useOfertaCiclos";
import { useToast } from "~/composables/useToast";

const { getEntidadeAtivaId, garantirEntidade } = useOfertaCore();
const toast = useToast();

const {
    ciclos,
    modulosDisponiveis,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    isDeleting,
    fetchCiclos,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
    simularCalendario,
    handleSaveCiclo,
    fetchDiasConfig,
} = useOfertaCiclos({ getEntidadeAtivaId, garantirEntidade, toast });

onMounted(() => fetchCiclos());
</script>

<style scoped>
/* ─── Card ──────────────────────────────────────── */
.ciclo-card {
    position: relative;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.ciclo-card:hover {
    border-color: rgba(139, 92, 246, 0.28);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.12);
}

/* Accent bar lateral */
.ciclo-accent-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0;
    transition: opacity 0.2s ease;
}
.ciclo-card:hover .ciclo-accent-bar {
    opacity: 1;
}

.ciclo-card-inner {
    padding: 18px 18px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* ─── Header ─────────────────────────────────────── */
.ciclo-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ciclo-year-badge {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    font-size: 10px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    letter-spacing: 0;
}

.ciclo-turno-badge {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
}

/* Botões de ação — só visíveis no hover */
.ciclo-card-actions {
    margin-left: auto;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.15s ease;
}
.ciclo-card:hover .ciclo-card-actions {
    opacity: 1;
}

.action-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
}
.action-edit:hover {
    background: rgba(139, 92, 246, 0.18);
    color: #c4b5fd;
}
.action-delete:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
}

/* ─── Conteúdo ───────────────────────────────────── */
.ciclo-name {
    font-size: 13px;
    font-weight: 900;
    color: rgba(232, 230, 240, 0.92);
    line-height: 1.3;
    margin-top: 2px;
}

.ciclo-modulo {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.35);
    display: flex;
    align-items: center;
    gap: 6px;
}
.ciclo-modulo-label {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(139, 92, 246, 0.6);
    background: rgba(139, 92, 246, 0.07);
    padding: 2px 6px;
    border-radius: 4px;
}

.ciclo-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: 2px 0;
}

/* ─── Período ────────────────────────────────────── */
.ciclo-periodo {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.ciclo-periodo-label {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(139, 92, 246, 0.55);
}
.ciclo-periodo-datas {
    display: flex;
    align-items: center;
    gap: 8px;
}
.ciclo-data {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.65);
    font-variant-numeric: tabular-nums;
}

/* ─── Empty state ────────────────────────────────── */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 52px 24px;
    background: rgba(255, 255, 255, 0.015);
    border-radius: 14px;
    border: 1px dashed rgba(255, 255, 255, 0.07);
}

/* ─── Add button ─────────────────────────────────── */
.add-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border: 1px solid rgba(139, 92, 246, 0.4);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}
.add-btn:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.45);
    transform: translateY(-1px);
}
</style>
