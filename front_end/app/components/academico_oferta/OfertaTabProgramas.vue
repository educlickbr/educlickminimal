<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span
                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest"
                >{{ loading ? "..." : programas.length + " programa(s)" }}</span
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
                Novo Programa
            </button>
        </div>

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

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
                v-if="programas.length === 0"
                class="col-span-full ds-empty"
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    class="mb-2 text-secondary/40"
                >
                    <path
                        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                </svg>
                <p class="text-sm font-bold text-secondary/60">
                    Nenhum programa cadastrado
                </p>
                <p
                    class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest"
                >
                    Clique em "Novo Programa" para começar
                </p>
            </div>

            <div
                v-for="p in programas"
                :key="p.id"
                class="ds-card"
                @click="openEditar(p)"
            >
                <div class="prog-accent-bar" />
                <div class="ds-card-inner">
                    <!-- Header: avatar + curso + ações -->
                    <div class="flex items-center gap-2">
                        <div class="ds-avatar">
                            {{ (p.descricao || "?")[0].toUpperCase() }}
                        </div>
                        <div class="ml-auto flex items-center gap-1.5" @click.stop>
                            <button
                                @click="openEditar(p)"
                                class="action-btn action-edit"
                                title="Editar"
                            >
                                ✎
                            </button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="ds-name">{{ p.descricao || "—" }}</p>

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
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 12 12"
                                fill="none"
                            >
                                <circle
                                    cx="6"
                                    cy="6"
                                    r="5"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M6 3v3l2 1"
                                    stroke="currentColor"
                                    stroke-width="1.2"
                                    stroke-linecap="round"
                                />
                            </svg>
                            {{ p.qtd_ciclos || 0 }} ciclo{{
                                p.qtd_ciclos !== 1 ? "s" : ""
                            }}
                        </span>
                        <span
                            v-if="p.gratuito"
                            class="prog-badge prog-badge--gratuito"
                            >Gratuito</span
                        >
                        <span v-else class="prog-badge prog-badge--pago"
                            >Pago</span
                        >
                        <span
                            v-if="p.exige_processo_seletivo"
                            class="prog-badge prog-badge--selecao"
                            >C/ Seleção</span
                        >
                        <span v-else class="prog-badge prog-badge--direta"
                            >Matrícula Direta</span
                        >
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

const programaFormCtx = useProgramaForm({
    getEntidadeAtivaId,
    garantirEntidade,
    toast,
});

onMounted(() => fetchProgramas());
</script>

<style scoped>
.prog-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.ds-card:hover .prog-accent-bar { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: var(--color-secondary-surface-hover);
    color: var(--color-secondary);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: var(--color-primary); }
.action-delete:hover { background: rgba(239,68,68,0.15); color: var(--color-danger); }

/* ── Badges de programa ──────────────────────────── */
.prog-divider {
    height: 1px;
    background: var(--color-divider);
    margin: 2px 0;
}
.prog-curso {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    gap: 5px;
}
.prog-curso-label {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-secondary);
    opacity: 0.6;
}
.prog-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 2px;
}
/* badge base */
.prog-badge, .prog-badge-ciclos {
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
/* semânticos — mantêm nos dois temas */
.prog-badge--gratuito {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.2);
    color: #34d399;
}
.prog-badge--pago {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
}
.prog-badge--selecao {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.2);
    color: var(--color-primary);
}
.prog-badge--direta {
    background: rgba(56, 189, 248, 0.08);
    border-color: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}
</style>

