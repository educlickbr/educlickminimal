<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">{{
                areasCtx.loading.value ? "..." : areasCtx.areas.value.length + " área(s)"
            }}</span>
            <button @click="areasCtx.openNova()" class="ds-btn-primary">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Nova Área
            </button>
        </div>

        <!-- Loading -->
        <div v-if="areasCtx.loading.value" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="areasCtx.areas.value.length === 0" class="col-span-full ds-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-secondary/40">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-secondary/60">Nenhuma área cadastrada</p>
                <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Clique em "Nova Área" para começar</p>
            </div>

            <div
                v-for="a in areasCtx.areas.value"
                :key="a.id"
                class="ds-card"
                @click="areasCtx.openEditar(a)"
            >
                <div class="area-accent-bar" />
                <div class="ds-card-inner">

                    <!-- Header: avatar + ações -->
                    <div class="flex items-center gap-2">
                        <div class="ds-avatar">
                            {{ (a.nome_area || "?").charAt(0).toUpperCase() }}
                        </div>
                        <div class="ml-auto flex items-center gap-1.5" @click.stop>
                            <button @click="areasCtx.openEditar(a)" class="action-btn action-edit" title="Editar">✎</button>
                            <button @click="areasCtx.confirmDelete(a.id)" class="action-btn action-delete" title="Excluir">✕</button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="ds-name">{{ a.nome_area }}</p>

                    <!-- Descrição -->
                    <p v-if="a.descricao" class="ds-desc">
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
/* Específico da tela de Áreas — o resto usa .ds-* (design system global) */
.area-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.ds-card:hover .area-accent-bar { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: var(--color-secondary-surface-hover);
    color: var(--color-secondary);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: var(--color-primary); }
.action-delete:hover { background: rgba(239,68,68,0.15);  color: var(--color-danger); }
</style>
