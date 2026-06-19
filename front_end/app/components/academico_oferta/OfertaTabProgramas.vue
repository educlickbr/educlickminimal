<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >{{ loading ? "..." : programas.length + " programa(s)" }}</span
            >
            <button @click="openNovo" class="add-btn">+ Novo Programa</button>
        </div>
        <div
            v-if="loading"
            class="py-16 flex flex-col items-center justify-center gap-3"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >Carregando...</span
            >
        </div>
        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div
                v-if="programas.length === 0"
                class="col-span-full empty-state"
            >
                <p class="text-sm font-bold text-white/40">Nenhum programa</p>
            </div>
            <div v-for="p in programas" :key="p.id" class="comp-card">
                <div class="comp-avatar">
                    {{ (p.descricao || "?")[0].toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-primary truncate">
                        {{ p.descricao || "-" }}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="badge badge-muted">{{ p.nome_curso }}</span
                        ><span class="badge badge-primary"
                            >{{ p.qtd_ciclos || 0 }} ciclos</span
                        >
                    </div>
                </div>
                <button
                    @click="openEditar(p)"
                    class="comp-action-btn comp-action-edit"
                >
                    ✎
                </button>
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
.comp-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 12px;
}
.comp-avatar {
    background: rgba(139, 92, 246, 0.1);
    color: #a78bfa;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
}
.comp-action-btn {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.5);
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
}
.comp-action-edit:hover {
    background: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
}
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
}
.add-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border: 1px solid rgba(139, 92, 246, 0.4);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}
.add-btn:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.45);
    transform: translateY(-1px);
}
.badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}
.badge-primary {
    background: rgba(139, 92, 246, 0.12);
    color: #a78bfa;
}
.badge-muted {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.35);
}
</style>
