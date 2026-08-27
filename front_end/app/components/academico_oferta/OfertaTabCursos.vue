<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">{{
                loading ? "..." : cursos.length + " curso(s)"
            }}</span>
            <button @click="openNovo" class="ds-btn-primary">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Novo Curso
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="cursos.length === 0" class="col-span-full ds-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-secondary/40">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="text-sm font-bold text-secondary/60">Nenhum curso cadastrado</p>
                <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Clique em "Novo Curso" para começar</p>
            </div>

            <div v-for="c in cursos" :key="c.id" class="ds-card" @click="openEditar(c)">
                <div class="curso-accent-bar" />
                <div class="ds-card-inner">

                    <!-- Header: avatar + ações -->
                    <div class="flex items-center gap-2">
                        <div class="ds-avatar">{{ (c.nome_curso || "?")[0].toUpperCase() }}</div>
                        <div class="ml-auto flex items-center gap-1.5" @click.stop>
                            <button @click="openEditar(c)" class="action-btn action-edit" title="Editar">✎</button>
                            <button @click="confirmDelete(c.id)" class="action-btn action-delete" title="Excluir">✕</button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="ds-name">{{ c.nome_curso || "—" }}</p>

                    <!-- Divider -->
                    <div class="curso-divider" />

                    <!-- Badges -->
                    <div class="curso-badges">
                        <span v-if="c.nome_area" class="curso-badge-area">
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5"/></svg>
                            {{ c.nome_area }}
                        </span>
                        <span class="curso-badge-modulos">
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="7" y="1" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="1" y="7" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="7" y="7" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.3"/></svg>
                            {{ c.qtd_modulos || 0 }} módulo{{ c.qtd_modulos !== 1 ? 's' : '' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <AcademicoOfertaModalCurso
            v-model="showModal"
            :isEdit="isEdit"
            :cursoId="editData?.id"
            :initialData="editData"
            :modulos="modulosDisponiveis"
            :cursoCtx="{
                areasDisponiveis,
                loadingListAreas,
                loadingArea,
                fetchAreas,
                saveArea: handleSaveArea,
                deleteArea: handleDeleteArea,
                saveCurso: handleSaveCurso,
                modulosDoCurso,
                loadingModulosCurso,
                loadingCM,
                fetchModulosDoCurso,
                addModulo: handleAddModulo,
                removeModulo: handleRemoveModulo,
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
import { useOfertaCursos } from "~/composables/academico_oferta/useOfertaCursos";
import { useToast } from "~/composables/useToast";

const { getEntidadeAtivaId, garantirEntidade } = useOfertaCore();
const toast = useToast();

const {
    cursos,
    modulosDisponiveis,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    isDeleting,
    fetchCursos,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
    handleSaveCurso,
    areasDisponiveis,
    loadingListAreas,
    loadingArea,
    fetchAreas,
    handleSaveArea,
    handleDeleteArea,
    modulosDoCurso,
    loadingModulosCurso,
    loadingCM,
    fetchModulosDoCurso,
    handleAddModulo,
    handleRemoveModulo,
} = useOfertaCursos({ getEntidadeAtivaId, garantirEntidade, toast });

onMounted(() => fetchCursos());
</script>

<style scoped>
.curso-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.ds-card:hover .curso-accent-bar { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: var(--color-secondary-surface-hover);
    color: var(--color-secondary);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: var(--color-primary); }
.action-delete:hover { background: rgba(239,68,68,0.15);  color: var(--color-danger); }

/* ── Badges de curso ──────────────────────────── */
.curso-divider {
    height: 1px;
    background: var(--color-divider);
    margin: 2px 0;
}
.curso-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 2px;
}
.curso-badge-area, .curso-badge-modulos {
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
.curso-badge-area {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.2);
    color: var(--color-primary);
}
</style>

