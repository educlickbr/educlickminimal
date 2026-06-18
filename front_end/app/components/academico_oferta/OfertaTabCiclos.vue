<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >{{ loading ? "..." : ciclos.length + " ciclo(s)" }}</span
            >
            <button @click="openNovo" class="add-btn">+ Novo Ciclo</button>
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
            <div v-if="ciclos.length === 0" class="col-span-full empty-state">
                <p class="text-sm font-bold text-white/40">Nenhum ciclo</p>
            </div>
            <div v-for="c in ciclos" :key="c.id" class="comp-card">
                <div class="ciclo-year-badge">
                    {{ c.data_ini ? new Date(c.data_ini).getFullYear() : "—" }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-primary truncate">
                        {{ c.descricao || "Ciclo Sem Nome" }}
                    </p>
                    <p class="text-[9px] text-secondary/40">
                        Módulo: {{ c.aca_modulo?.nome_modulo || "-" }}
                    </p>
                </div>
                <div class="ciclo-dates">
                    <span class="ciclo-dates-label">Período</span
                    ><span class="ciclo-dates-value"
                        >{{
                            c.data_ini
                                ? new Date(c.data_ini).toLocaleDateString(
                                      "pt-BR",
                                  )
                                : "-"
                        }}
                        →
                        {{
                            c.data_fim
                                ? new Date(c.data_fim).toLocaleDateString(
                                      "pt-BR",
                                  )
                                : "-"
                        }}</span
                    >
                </div>
                <button
                    @click="openEditar(c)"
                    class="comp-action-btn comp-action-edit"
                >
                    ✎
                </button>
                <button
                    @click="confirmDelete(c.id)"
                    class="comp-action-btn comp-action-delete"
                >
                    ✕
                </button>
            </div>
        </div>
        <AcademicoOfertaModalCiclo
            v-model="showModal"
            :isEdit="isEdit"
            :cicloId="editData?.id || editData?.id_ciclo"
            :initialData="editData"
            :modulos="modulosDisponiveis"
            :idEntidade="getEntidadeAtivaId()"
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
} = useOfertaCiclos({ getEntidadeAtivaId, garantirEntidade, toast });

onMounted(() => fetchCiclos());
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
.comp-action-delete:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
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
.ciclo-year-badge {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.15);
    color: #a78bfa;
    font-size: 11px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.ciclo-dates {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-end;
    flex-shrink: 0;
    padding: 0 4px;
}
.ciclo-dates-label {
    font-size: 8px;
    font-weight: 900;
    color: rgba(139, 92, 246, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.12em;
}
.ciclo-dates-value {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
}
</style>
