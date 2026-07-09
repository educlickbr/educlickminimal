<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">{{
                areasCtx.loading.value ? "..." : areasCtx.areas.value.length + " área(s)"
            }}</span>
            <button @click="areasCtx.openNova()" class="add-btn">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Nova Área
            </button>
        </div>

        <!-- Loading -->
        <div v-if="areasCtx.loading.value" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="areasCtx.areas.value.length === 0" class="col-span-full empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/20">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhuma área cadastrada</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Clique em "Nova Área" para começar</p>
            </div>

            <div
                v-for="a in areasCtx.areas.value"
                :key="a.id"
                class="area-card"
                @click="areasCtx.openEditar(a)"
            >
                <div class="area-accent-bar" />
                <div class="area-card-inner">

                    <!-- Header: avatar + ações -->
                    <div class="area-card-header">
                        <div class="area-avatar">
                            {{ (a.nome_area || "?").charAt(0).toUpperCase() }}
                        </div>
                        <div class="area-card-actions" @click.stop>
                            <button @click="areasCtx.openEditar(a)" class="action-btn action-edit" title="Editar">✎</button>
                            <button @click="areasCtx.confirmDelete(a.id)" class="action-btn action-delete" title="Excluir">✕</button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="area-name">{{ a.nome_area }}</p>

                    <!-- Descrição -->
                    <p v-if="a.descricao" class="area-desc">
                        {{ a.descricao?.replace(/<[^>]*>/g, '').substring(0, 90) }}
                    </p>
                </div>
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
/* ── Card ──────────────────────────────────────── */
.area-card {
    position: relative;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.area-card:hover {
    border-color: rgba(139, 92, 246, 0.28);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(139,92,246,0.12);
}
.area-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0; transition: opacity 0.2s ease;
}
.area-card:hover .area-accent-bar { opacity: 1; }

.area-card-inner {
    padding: 18px 18px 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
}

/* ── Header ─────────────────────────────────────── */
.area-card-header { display: flex; align-items: center; gap: 8px; }

.area-avatar {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa; font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}

.area-card-actions {
    margin-left: auto; display: flex; gap: 6px;
    opacity: 0; transition: opacity 0.15s ease;
}
.area-card:hover .area-card-actions { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: #c4b5fd; }
.action-delete:hover { background: rgba(239,68,68,0.15);  color: #fca5a5; }

/* ── Content ─────────────────────────────────────── */
.area-name {
    font-size: 13px; font-weight: 900; color: rgba(232,230,240,0.92);
    line-height: 1.3; margin-top: 2px;
}
.area-desc {
    font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.28);
    line-height: 1.5; overflow: hidden; display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical;
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
