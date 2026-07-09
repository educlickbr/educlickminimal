<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">{{
                loading ? "..." : componentes.length + " componente(s)"
            }}</span>
            <button @click="openNovo" class="add-btn">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Novo Componente
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-if="componentes.length === 0" class="col-span-full empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/20">
                    <rect x="2" y="3" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <rect x="13" y="3" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <rect x="2" y="14" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <rect x="13" y="14" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <p class="text-sm font-bold text-white/30">Nenhum componente cadastrado</p>
                <p class="text-[10px] font-bold text-white/15 mt-1 uppercase tracking-widest">Clique em "Novo Componente" para começar</p>
            </div>

            <div v-for="c in componentes" :key="c.id" class="comp-card" @click="openEditar(c)">
                <div class="comp-accent-bar" />
                <div class="comp-card-inner">

                    <!-- Header: avatar + ações -->
                    <div class="comp-card-header">
                        <div class="comp-avatar">
                            {{ (c.nome_componente || "?").charAt(0).toUpperCase() }}
                        </div>
                        <div class="comp-card-actions" @click.stop>
                            <button @click="openEditar(c)" class="action-btn action-edit" title="Editar">✎</button>
                            <button @click="confirmDelete(c.id)" class="action-btn action-delete" title="Excluir">✕</button>
                        </div>
                    </div>

                    <!-- Nome -->
                    <p class="comp-name">{{ c.nome_componente || "—" }}</p>

                    <!-- Descrição -->
                    <p v-if="c.descricao" class="comp-desc">
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
/* ── Card ──────────────────────────────────────── */
.comp-card {
    position: relative;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.comp-card:hover {
    border-color: rgba(139, 92, 246, 0.28);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(139,92,246,0.12);
}
.comp-accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0; transition: opacity 0.2s ease;
}
.comp-card:hover .comp-accent-bar { opacity: 1; }

.comp-card-inner {
    padding: 18px 18px 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
}

/* ── Header ─────────────────────────────────────── */
.comp-card-header { display: flex; align-items: center; gap: 8px; }

.comp-avatar {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa; font-size: 14px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}

.comp-card-actions {
    margin-left: auto; display: flex; gap: 6px;
    opacity: 0; transition: opacity 0.15s ease;
}
.comp-card:hover .comp-card-actions { opacity: 1; }

.action-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.action-edit:hover   { background: rgba(139,92,246,0.18); color: #c4b5fd; }
.action-delete:hover { background: rgba(239,68,68,0.15);  color: #fca5a5; }

/* ── Content ─────────────────────────────────────── */
.comp-name {
    font-size: 13px; font-weight: 900; color: rgba(232,230,240,0.92);
    line-height: 1.3; margin-top: 2px;
}
.comp-desc {
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
