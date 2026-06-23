<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">{{
                loading ? "..." : cursos.length + " curso(s)"
            }}</span>
            <button @click="openNovo" class="add-btn">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Novo Curso
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="cursos.length === 0" class="col-span-full empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/20">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhum curso cadastrado</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Clique em "Novo Curso" para começar</p>
            </div>

            <div v-for="c in cursos" :key="c.id" class="curso-card" @click="openEditar(c)">
                <div class="curso-accent-bar" />
                <div class="curso-card-inner">

                    <!-- Header: avatar + ações -->
                    <div class="curso-card-header">
                        <div class="curso-avatar">{{ (c.nome_curso || "?")[0].toUpperCase() }}</div>
                        <div class="curso-card-actions" @click.stop>
                            <button @click="openEditar(c)" class="action-btn action-edit" title="Editar">✎</button>
                            <button @click="confirmDelete(c.id)" class="action-btn action-delete" title="Excluir">✕</button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="curso-name">{{ c.nome_curso || "—" }}</p>

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
/* ── Card ──────────────────────────────────────── */
.curso-card {
    position: relative;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.curso-card:hover {
    border-color: rgba(139, 92, 246, 0.28);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.12);
}
.curso-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0; transition: opacity 0.2s ease;
}
.curso-card:hover .curso-accent-bar { opacity: 1; }

.curso-card-inner {
    padding: 18px 18px 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
}

/* ── Header ─────────────────────────────────────── */
.curso-card-header { display: flex; align-items: center; gap: 8px; }

.curso-avatar {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa; font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}

.curso-card-actions {
    margin-left: auto; display: flex; gap: 6px;
    opacity: 0; transition: opacity 0.15s ease;
}
.curso-card:hover .curso-card-actions { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: #c4b5fd; }
.action-delete:hover { background: rgba(239,68,68,0.15);  color: #fca5a5; }

/* ── Content ─────────────────────────────────────── */
.curso-name {
    font-size: 13px; font-weight: 900; color: rgba(232,230,240,0.92);
    line-height: 1.3; margin-top: 2px;
}
.curso-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 2px 0; }

.curso-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.curso-badge-area {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(139,92,246,0.14); border: 1px solid rgba(139,92,246,0.25); color: #c4b5fd;
}
.curso-badge-modulos {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.15); color: #a78bfa;
}

/* ── Empty state ─────────────────────────────────── */
.empty-state {
    display: flex; flex-direction: column; align-items: center;
    padding: 52px 24px;
    background: rgba(255,255,255,0.015); border-radius: 14px;
    border: 1px dashed rgba(255,255,255,0.07);
}

/* ── Add button ──────────────────────────────────── */
.add-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border: 1px solid rgba(139,92,246,0.4); color: #fff;
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(139,92,246,0.3);
}
.add-btn:hover {
    background: linear-gradient(135deg,#6d28d9,#7c3aed);
    box-shadow: 0 6px 20px rgba(139,92,246,0.45); transform: translateY(-1px);
}
</style>
