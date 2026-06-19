<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >{{
                    areasCtx.loading.value
                        ? "..."
                        : areasCtx.areas.value.length + " área(s)"
                }}</span
            >
            <button @click="areasCtx.openNova()" class="add-btn">
                + Nova Área
            </button>
        </div>
        <div
            v-if="areasCtx.loading.value"
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
                v-if="areasCtx.areas.value.length === 0"
                class="col-span-full empty-state"
            >
                <p class="text-sm font-bold text-white/40">Nenhuma área</p>
            </div>
            <div
                v-for="a in areasCtx.areas.value"
                :key="a.id"
                class="comp-card"
            >
                <div class="comp-avatar">
                    {{ (a.nome_area || "?").charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-primary truncate">
                        {{ a.nome_area }}
                    </p>
                    <p class="text-[9px] text-secondary/40 truncate">
                        {{ a.descricao || "-" }}
                    </p>
                </div>
                <button
                    @click="areasCtx.openEditar(a)"
                    class="comp-action-btn comp-action-edit"
                >
                    ✎
                </button>
                <button
                    @click="areasCtx.confirmDelete(a.id)"
                    class="comp-action-btn comp-action-delete"
                >
                    ✕
                </button>
            </div>
        </div>
        <AcademicoOfertaModalArea
            v-model="areasCtx.showModal.value"
            :isEdit="areasCtx.isEdit.value"
            :initialData="areasCtx.editData.value"
            :onSave="areasCtx.handleSave"
            @saved="areasCtx.handleSaved()"
        />
        <GlobalModalConfirmacao
            v-model="areasCtx.showConfirmDelete.value"
            title="Excluir Área"
            message="Confirmar?"
            type="danger"
            confirmText="Excluir"
            :loading="areasCtx.isDeleting.value"
            @confirm="areasCtx.handleDelete()"
        />
    </div>
</template>

<script setup lang="ts">
import { useOfertaCore } from "~/composables/academico_oferta/useOfertaCore";
import { useOfertaAreas } from "~/composables/academico_oferta/useOfertaAreas";
import { useToast } from "~/composables/useToast";

const core = useOfertaCore();
const toast = useToast();

const areasCtx = useOfertaAreas({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});

onMounted(() => areasCtx.fetchAreas());
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
</style>
