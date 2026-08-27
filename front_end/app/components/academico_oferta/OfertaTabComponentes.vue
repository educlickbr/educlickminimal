<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">{{
                loading ? "..." : componentes.length + " componente(s)"
            }}</span>
            <button @click="openNovo" class="ds-btn-primary">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Novo Componente
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="componentes.length === 0" class="col-span-full ds-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-secondary/40">
                    <rect x="2" y="3" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <rect x="13" y="3" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <rect x="2" y="14" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <rect x="13" y="14" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <p class="text-sm font-bold text-secondary/60">Nenhum componente cadastrado</p>
                <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Clique em "Novo Componente" para começar</p>
            </div>

            <div v-for="c in componentes" :key="c.id" class="ds-card" @click="openEditar(c)">
                <div class="comp-accent-bar" />
                <div class="ds-card-inner">

                    <!-- Header: avatar + ações -->
                    <div class="flex items-center gap-2">
                        <div class="ds-avatar">
                            {{ (c.nome_componente || "?").charAt(0).toUpperCase() }}
                        </div>
                        <div class="ml-auto flex items-center gap-1.5" @click.stop>
                            <button @click="openEditar(c)" class="action-btn action-edit" title="Editar">✎</button>
                            <button @click="confirmDelete(c.id)" class="action-btn action-delete" title="Excluir">✕</button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="ds-name">{{ c.nome_componente || "—" }}</p>

                    <!-- Descrição -->
                    <p v-if="c.descricao" class="ds-desc">
                        {{ c.descricao?.replace(/<[^>]*>/g, '').substring(0, 90) }}
                    </p>
                </div>
            </div>
        </div>

        <AcademicoOfertaModalComponente
            v-model="showModal"
            :isEdit="isEdit"
            :initialData="
                editData
                    ? {
                          nome_componente: editData.nome_componente,
                          descricao: editData.descricao ?? undefined,
                      }
                    : null
            "
            @save="handleSave"
        />
        <GlobalModalConfirmacao
            v-model="showConfirmDelete"
            title="Excluir Componente"
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
import { useToast } from "~/composables/useToast";
import { useAppStore } from "~~/stores/app";

const core = useOfertaCore();
const store = useAppStore();
const toast = useToast();

const componentes = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const editData = ref<any>(null);
const showConfirmDelete = ref(false);
const deleteTarget = ref<string | null>(null);
const isDeleting = ref(false);

async function fetchComponentes() {
    loading.value = true;
    try {
        const id = await core.garantirEntidade();
        const res = (await $fetch("/api/academico_oferta/componentes", {
            params: { id_entidade: id, page: 1, limit: 20 },
        })) as any;
        componentes.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
        toast.showToast(e?.message || "Erro", { type: "error" });
    } finally {
        loading.value = false;
    }
}

function openNovo() {
    isEdit.value = false;
    editData.value = null;
    showModal.value = true;
}
function openEditar(c: any) {
    isEdit.value = true;
    editData.value = c;
    showModal.value = true;
}
function confirmDelete(id: string) {
    deleteTarget.value = id;
    showConfirmDelete.value = true;
}

async function handleDelete() {
    if (!deleteTarget.value) return;
    isDeleting.value = true;
    try {
        const id = await core.garantirEntidade();
        await $fetch("/api/academico_oferta/componentes", {
            method: "DELETE",
            body: { id: deleteTarget.value, id_entidade: id },
        });
        toast.showToast("Componente removido", { type: "success" });
        fetchComponentes();
    } catch (e: any) {
        toast.showToast(e.message || "Erro", { type: "error" });
    } finally {
        isDeleting.value = false;
        showConfirmDelete.value = false;
        deleteTarget.value = null;
    }
}

async function handleSave(data: any) {
    try {
        const id = await core.garantirEntidade();
        await $fetch("/api/academico_oferta/componentes", {
            method: "POST",
            body: {
                id: isEdit.value ? editData.value?.id : undefined,
                id_entidade: id,
                nome_componente: data.nome_componente,
                descricao: data.descricao ?? null,
                usuario_id: store.user_expandido_id,
            },
        });
        toast.showToast("Salvo", { type: "success" });
        showModal.value = false;
        fetchComponentes();
    } catch (e: any) {
        toast.showToast(e.message || "Erro", { type: "error" });
    }
}

onMounted(() => fetchComponentes());
</script>

<style scoped>
/* Específico — o resto usa .ds-* (design system global) */
.comp-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--color-primary);
    opacity: 0; transition: opacity 0.2s ease;
}
.ds-card:hover .comp-accent-bar { opacity: 1; }

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
