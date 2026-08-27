<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">{{
                loading ? "..." : ciclos.length + " ciclo(s)"
            }}</span>
            <button @click="openNovo" class="ds-btn-primary">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Novo Ciclo
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid de ciclos -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="ciclos.length === 0" class="col-span-full ds-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-secondary/40">
                    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-secondary/60">Nenhum ciclo cadastrado</p>
                <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Clique em "Novo Ciclo" para começar</p>
            </div>

            <div v-for="c in ciclos" :key="c.id" class="ds-card" @click="openEditar(c)">
                <!-- Accent bar animada -->
                <div class="ciclo-accent-bar" />

                <div class="ds-card-inner">
                    <!-- Topo: badge do ano + turno -->
                    <div class="flex items-center gap-2">
                        <div class="ciclo-year-badge">
                            {{ c.data_ini ? new Date(c.data_ini).getFullYear() : "—" }}
                        </div>
                        <span
                            v-if="c.turno"
                            class="ciclo-turno-badge"
                        >{{ c.turno }}</span>
                        <div class="ml-auto flex items-center gap-1.5" @click.stop>
                            <button @click="openEditar(c)" class="action-btn action-edit" title="Editar">
                                ✎
                            </button>
                            <button @click="confirmDelete(c.id)" class="action-btn action-delete" title="Excluir">
                                ✕
                            </button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="ds-name">{{ c.descricao || "Ciclo Sem Nome" }}</p>

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
.ciclo-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.ds-card:hover .ciclo-accent-bar { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: var(--color-secondary-surface-hover);
    color: var(--color-secondary);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: var(--color-primary); }
.action-delete:hover { background: rgba(239,68,68,0.15); color: var(--color-danger); }

/* ── Badges de ciclo ──────────────────────────── */
.ciclo-year-badge {
    font-size: 11px;
    font-weight: 900;
    color: var(--color-primary);
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 8px;
    padding: 3px 10px;
    letter-spacing: 0.05em;
}
.ciclo-turno-badge {
    display: inline-flex;
    align-items: center;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(16, 185, 129, 0.2);
    background: rgba(16, 185, 129, 0.08);
    color: #34d399;
}
.ciclo-modulo {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    gap: 5px;
}
.ciclo-modulo-label {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
}
.ciclo-divider {
    height: 1px;
    background: var(--color-divider);
    margin: 2px 0;
}
.ciclo-periodo {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.ciclo-periodo-label {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-secondary);
    opacity: 0.6;
}
.ciclo-periodo-datas {
    display: flex;
    align-items: center;
    gap: 6px;
}
.ciclo-data {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-secondary);
}
</style>

