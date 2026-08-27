<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span
                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest"
                >{{ loading ? "..." : modulos.length + " módulo(s)" }}</span
            >
            <button @click="openNovo" class="ds-btn-primary">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                        d="M6 1v10M1 6h10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
                Novo Módulo
            </button>
        </div>

        <!-- Loading -->
        <div
            v-if="loading"
            class="py-16 flex flex-col items-center justify-center gap-3"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest"
                >Carregando...</span
            >
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="modulos.length === 0" class="col-span-full ds-empty">
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    class="mb-2 text-secondary/40"
                >
                    <rect
                        x="3"
                        y="3"
                        width="7"
                        height="7"
                        rx="1.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                    <rect
                        x="14"
                        y="3"
                        width="7"
                        height="7"
                        rx="1.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                    <rect
                        x="3"
                        y="14"
                        width="7"
                        height="7"
                        rx="1.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                    <rect
                        x="14"
                        y="14"
                        width="7"
                        height="7"
                        rx="1.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                </svg>
                <p class="text-sm font-bold text-secondary/60">
                    Nenhum módulo cadastrado
                </p>
                <p
                    class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest"
                >
                    Clique em "Novo Módulo" para começar
                </p>
            </div>

            <div
                v-for="m in modulos"
                :key="m.id"
                class="ds-card"
                @click="openEditar(m)"
            >
                <div class="mod-accent-bar" />
                <div class="ds-card-inner">
                    <!-- Header: avatar + ações -->
                    <div class="flex items-center gap-2">
                        <div class="ds-avatar">
                            {{ (m.nome_modulo || "?")[0].toUpperCase() }}
                        </div>
                        <div class="ml-auto flex items-center gap-1.5" @click.stop>
                            <button
                                @click="openEditar(m)"
                                class="action-btn action-edit"
                                title="Editar"
                            >
                                ✎
                            </button>
                            <button
                                @click="confirmDelete(m.id)"
                                class="action-btn action-delete"
                                title="Excluir"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="ds-name">{{ m.nome_modulo || "—" }}</p>

                    <!-- Divider -->
                    <div class="mod-divider" />

                    <!-- Badges -->
                    <div class="mod-badges">
                        <span class="mod-badge-comp">
                            <svg
                                width="9"
                                height="9"
                                viewBox="0 0 12 12"
                                fill="none"
                            >
                                <rect
                                    x="1"
                                    y="1"
                                    width="4"
                                    height="4"
                                    rx="1"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                />
                                <rect
                                    x="7"
                                    y="1"
                                    width="4"
                                    height="4"
                                    rx="1"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                />
                                <rect
                                    x="1"
                                    y="7"
                                    width="4"
                                    height="4"
                                    rx="1"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                />
                                <rect
                                    x="7"
                                    y="7"
                                    width="4"
                                    height="4"
                                    rx="1"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                />
                            </svg>
                            {{ m.qtd_componentes || 0 }} componente{{
                                m.qtd_componentes !== 1 ? "s" : ""
                            }}
                        </span>
                        <span class="mod-badge-planos">
                            <svg
                                width="9"
                                height="9"
                                viewBox="0 0 12 12"
                                fill="none"
                            >
                                <path
                                    d="M9.5 2h-7a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                />
                                <path
                                    d="M2.5 4.5h7M7 2.5v2M5 2.5v2"
                                    stroke="currentColor"
                                    stroke-width="1.3"
                                    stroke-linecap="round"
                                />
                            </svg>
                            {{ m.qtd_planos || 0 }} plano{{
                                m.qtd_planos !== 1 ? "s" : ""
                            }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <AcademicoOfertaModalModulo
            v-model="showModal"
            :isEdit="isEdit"
            :moduloId="editData?.id"
            :initialData="editData"
            :componentes="componentesDisponiveis"
            :moduloCtx="{
                saveModulo: handleSaveModulo,
                componentesDoModulo,
                loadingComponentesModulo,
                loadingAddComponente,
                fetchComponentesDoModulo,
                addComponente: handleAddComponente,
                removeComponente: handleRemoveComponente,
                planos,
                loadingPlanos,
                loadingPlano,
                fetchPlanos,
                savePlano: handleSavePlano,
                deletePlano: handleDeletePlano,
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
import { useOfertaModulos } from "~/composables/academico_oferta/useOfertaModulos";
import { useToast } from "~/composables/useToast";

const { getEntidadeAtivaId, garantirEntidade } = useOfertaCore();
const toast = useToast();

const {
    modulos,
    componentesDisponiveis,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    isDeleting,
    fetchModulos,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
    handleSaveModulo,
    componentesDoModulo,
    loadingComponentesModulo,
    loadingAddComponente,
    fetchComponentesDoModulo,
    handleAddComponente,
    handleRemoveComponente,
    planos,
    loadingPlanos,
    loadingPlano,
    fetchPlanos,
    handleSavePlano,
    handleDeletePlano,
} = useOfertaModulos({ getEntidadeAtivaId, garantirEntidade, toast });

onMounted(() => fetchModulos());
</script>

<style scoped>
.mod-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.ds-card:hover .mod-accent-bar { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: var(--color-secondary-surface-hover);
    color: var(--color-secondary);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: var(--color-primary); }
.action-delete:hover { background: rgba(239,68,68,0.15); color: var(--color-danger); }

/* ── Badges de módulo ──────────────────────────── */
.mod-divider {
    height: 1px;
    background: var(--color-divider);
    margin: 2px 0;
}
.mod-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 2px;
}
.mod-badge-comp, .mod-badge-planos {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface);
    color: var(--color-secondary);
}
</style>

