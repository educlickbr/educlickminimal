<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">{{
                loading ? "..." : programas.length + " programa(s)"
            }}</span>
            <button @click="openNovo" class="add-btn">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Novo Programa
            </button>
        </div>

        <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="programas.length === 0" class="col-span-full empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/20">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhum programa cadastrado</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Clique em "Novo Programa" para começar</p>
            </div>

            <div v-for="p in programas" :key="p.id" class="prog-card" @click="openEditar(p)">
                <div class="prog-accent-bar" />
                <div class="prog-card-inner">
                    <!-- Header: avatar + curso + ações -->
                    <div class="prog-card-header">
                        <div class="prog-avatar">{{ (p.descricao || "?")[0].toUpperCase() }}</div>
                        <div class="prog-card-actions" @click.stop>
                            <button @click="openEditar(p)" class="action-btn action-edit" title="Editar">✎</button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="prog-name">{{ p.descricao || "—" }}</p>

                    <!-- Curso -->
                    <p class="prog-curso" v-if="p.nome_curso">
                        <span class="prog-curso-label">Curso</span>
                        {{ p.nome_curso }}
                    </p>

                    <!-- Divider -->
                    <div class="prog-divider" />

                    <!-- Badges -->
                    <div class="prog-badges">
                        <span class="prog-badge-ciclos">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M6 3v3l2 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                            {{ p.qtd_ciclos || 0 }} ciclo{{ p.qtd_ciclos !== 1 ? 's' : '' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <AcademicoOfertaModalPrograma
            v-model="showModal"
            :isEdit="isEdit"
            :programaId="editData?.id"
            :initialData="editData"
            :cursos="cursosDisponiveis"
            :programaCtx="{
                loading: programaFormCtx.loading,
                listCursos: programaFormCtx.listCursos,
                listModulos: programaFormCtx.listModulos,
                listAreas: programaFormCtx.listAreas,
                loadingCiclos: programaFormCtx.loadingCiclos,
                ciclosEncontrados: programaFormCtx.ciclosEncontrados,
                modulosPendentesCurso: programaFormCtx.modulosPendentesCurso,
                temOverlapping: programaFormCtx.temOverlapping,
                fetchBaseLists: programaFormCtx.fetchBaseLists,
                fetchCursoCiclos: programaFormCtx.fetchCursoCiclos,
                fetchAllCiclos: programaFormCtx.fetchAllCiclos,
                checkOverlapping: programaFormCtx.checkOverlapping,
                toDateMs: programaFormCtx.toDateMs,
                handleSave: programaFormCtx.handleSave,
                initEdit: programaFormCtx.initEdit,
            }"
            @saved="handleSaved"
        />
    </div>
</template>

<script setup lang="ts">
import { useOfertaCore } from "~/composables/academico_oferta/useOfertaCore";
import { useOfertaProgramas } from "~/composables/academico_oferta/useOfertaProgramas";
import { useProgramaForm } from "~/composables/academico_oferta/useProgramaForm";
import { useToast } from "~/composables/useToast";

const { getEntidadeAtivaId, garantirEntidade } = useOfertaCore();
const toast = useToast();

const {
    programas,
    cursosDisponiveis,
    loading,
    showModal,
    isEdit,
    editData,
    fetchProgramas,
    openNovo,
    openEditar,
    handleSaved,
} = useOfertaProgramas({ getEntidadeAtivaId, garantirEntidade, toast });

const programaFormCtx = useProgramaForm({ getEntidadeAtivaId, garantirEntidade, toast });

onMounted(() => fetchProgramas());
</script>

<style scoped>
/* ── Card ──────────────────────────────────────── */
.prog-card {
    position: relative;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.prog-card:hover {
    border-color: rgba(139, 92, 246, 0.28);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(139,92,246,0.12);
}
.prog-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0; transition: opacity 0.2s ease;
}
.prog-card:hover .prog-accent-bar { opacity: 1; }

.prog-card-inner {
    padding: 18px 18px 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
}

/* ── Header ─────────────────────────────────────── */
.prog-card-header { display: flex; align-items: center; gap: 8px; }

.prog-avatar {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa; font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}

.prog-card-actions {
    margin-left: auto; display: flex; gap: 6px;
    opacity: 0; transition: opacity 0.15s ease;
}
.prog-card:hover .prog-card-actions { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover { background: rgba(139,92,246,0.18); color: #c4b5fd; }

/* ── Content ─────────────────────────────────────── */
.prog-name {
    font-size: 13px; font-weight: 900; color: rgba(232,230,240,0.92);
    line-height: 1.3; margin-top: 2px;
}
.prog-curso {
    font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35);
    display: flex; align-items: center; gap: 6px;
}
.prog-curso-label {
    font-size: 8px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.12em; color: rgba(139,92,246,0.6);
    background: rgba(139,92,246,0.07); padding: 2px 6px; border-radius: 4px;
}
.prog-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 2px 0; }

.prog-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.prog-badge-ciclos {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); color: #a78bfa;
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
